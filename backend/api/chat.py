"""
WebSocket chat endpoints.

Three WebSocket channels:
  1. /ws/consumer/{session_id}     — Consumer chat with the AI agent
  2. /ws/dashboard/alerts          — Real-time handoff alerts for the dashboard
  3. /ws/dashboard/chat/{session_id} — Live chat view + agent takeover
"""

import json
import logging
from datetime import datetime
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from langchain_core.messages import AIMessage, HumanMessage

from agent.graph import agent_graph
from api.websocket_manager import manager
from db.mongodb import mongo

logger = logging.getLogger(__name__)

router = APIRouter(tags=["chat"])


# =============================================================================
# Consumer Chat WebSocket
# =============================================================================


@router.websocket("/ws/consumer/{session_id}")
async def consumer_chat(websocket: WebSocket, session_id: str):
    """
    Consumer chat WebSocket endpoint.

    Receives user messages, runs them through the LangGraph agent,
    and streams back responses with card payloads.
    Also broadcasts messages to any dashboard chat viewers.
    """
    # Verify session exists
    session = await mongo.sessions.find_one({"session_id": session_id})
    if not session:
        await websocket.close(code=4004, reason="Session not found")
        return

    await manager.connect_consumer(session_id, websocket)

    try:
        # Send welcome message with interactive support options card
        welcome_message = {
            "role": "assistant",
            "content": f"Welcome, {session['consumer_name']}! I'm North Star, your outdoor gear assistant. How can I help you today?",
            "timestamp": datetime.utcnow().isoformat(),
            "card_payload": {
                "type": "help_menu",
                "data": {
                    "options": [
                        "Track my order",
                        "Returns & exchanges",
                        "Product recommendations",
                        "Talk to a human agent"
                    ],
                    "suggest_handoff": False
                }
            }
        }

        # Store welcome message in MongoDB session history
        await mongo.sessions.update_one(
            {"session_id": session_id},
            {"$push": {"messages": welcome_message}},
        )

        # Send welcome message over WebSocket
        await websocket.send_json({
            "type": "message",
            **welcome_message
        })

        while True:
            # Receive message from consumer
            data = await websocket.receive_json()
            user_content = data.get("content", "").strip()

            if not user_content:
                continue

            # Store user message in MongoDB
            user_message = {
                "role": "user",
                "content": user_content,
                "timestamp": datetime.utcnow().isoformat(),
            }
            await mongo.sessions.update_one(
                {"session_id": session_id},
                {"$push": {"messages": user_message}},
            )

            # Broadcast user message to dashboard viewers
            await manager.broadcast_to_chat_viewers(session_id, {
                "type": "message",
                **user_message,
            })

            # Check if session is taken over by human agent
            current_session = await mongo.sessions.find_one(
                {"session_id": session_id},
                {"status": 1},
            )
            if current_session and current_session.get("status") == "taken_over":
                # Don't process with AI — human agent is handling it
                continue

            # Send typing indicator
            await websocket.send_json({"type": "typing", "is_typing": True})

            # Build agent state from conversation history
            db_session = await mongo.sessions.find_one(
                {"session_id": session_id},
                {"_id": 0},
            )
            history_messages = _build_message_history(
                db_session.get("messages", [])
            )

            agent_state = {
                "session_id": session_id,
                "consumer_name": session["consumer_name"],
                "messages": history_messages,
                "current_intent": "",
                "resolved_entities": {},
                "failed_intent_count": db_session.get("_failed_intents", 0),
                "handoff_triggered": False,
                "handoff_summary": "",
                "last_card_payload": {},
            }

            # Run the agent graph
            try:
                result = await _run_agent(agent_state)
            except Exception as e:
                logger.error("Agent error for session %s: %s", session_id, e)
                result = {
                    "messages": [
                        AIMessage(
                            content="I'm sorry, I encountered an issue. "
                            "Could you try rephrasing that? Or I can "
                            "connect you with a human agent."
                        )
                    ],
                    "last_card_payload": {},
                }

            # Extract the final AI response
            ai_response = _extract_final_response(result)

            # Store assistant message in MongoDB
            assistant_message = {
                "role": "assistant",
                "content": ai_response["content"],
                "timestamp": datetime.utcnow().isoformat(),
                "card_payload": ai_response.get("card_payload"),
            }
            await mongo.sessions.update_one(
                {"session_id": session_id},
                {"$push": {"messages": assistant_message}},
            )

            # Update failed intent count
            failed_count = result.get("failed_intent_count", 0)
            await mongo.sessions.update_one(
                {"session_id": session_id},
                {"$set": {"_failed_intents": failed_count}},
            )

            # Stop typing indicator
            await websocket.send_json({"type": "typing", "is_typing": False})

            # Send AI response to consumer
            await websocket.send_json({
                "type": "message",
                **assistant_message,
            })

            # Broadcast to dashboard viewers
            await manager.broadcast_to_chat_viewers(session_id, {
                "type": "message",
                **assistant_message,
            })

    except WebSocketDisconnect:
        manager.disconnect_consumer(session_id)
        logger.info("Consumer disconnected: session=%s", session_id)
    except Exception as e:
        logger.error("Unexpected error in consumer chat: %s", e)
        manager.disconnect_consumer(session_id)


# =============================================================================
# Dashboard Alert WebSocket
# =============================================================================


@router.websocket("/ws/dashboard/alerts")
async def dashboard_alerts(websocket: WebSocket):
    """
    Dashboard alert WebSocket.

    Broadcasts real-time handoff notifications to all connected
    dashboard clients. Connection stays open indefinitely.
    """
    await manager.connect_alert_listener(websocket)

    try:
        while True:
            # Keep connection alive — alerts are pushed via broadcast_alert()
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_alert_listener(websocket)


# =============================================================================
# Dashboard Chat Viewer WebSocket
# =============================================================================


@router.websocket("/ws/dashboard/chat/{session_id}")
async def dashboard_chat_viewer(websocket: WebSocket, session_id: str):
    """
    Dashboard chat viewer WebSocket.

    Allows agents to watch a session in real-time. After takeover,
    enables bidirectional messaging with the consumer.
    """
    session = await mongo.sessions.find_one({"session_id": session_id})
    if not session:
        await websocket.close(code=4004, reason="Session not found")
        return

    await manager.connect_chat_viewer(session_id, websocket)

    try:
        while True:
            data = await websocket.receive_json()

            # Check if this is an agent message (post-takeover)
            if data.get("type") == "agent_message":
                agent_content = data.get("content", "").strip()
                agent_name = data.get("agent_name", "Support Agent")

                if not agent_content:
                    continue

                # Verify session is in taken_over state
                current_session = await mongo.sessions.find_one(
                    {"session_id": session_id},
                    {"status": 1},
                )
                if not current_session or current_session.get("status") != "taken_over":
                    await websocket.send_json({
                        "type": "error",
                        "content": "Cannot send messages — session is not taken over.",
                    })
                    continue

                # Store agent message
                agent_message = {
                    "role": "agent",
                    "content": agent_content,
                    "timestamp": datetime.utcnow().isoformat(),
                    "agent_name": agent_name,
                }
                await mongo.sessions.update_one(
                    {"session_id": session_id},
                    {"$push": {"messages": agent_message}},
                )

                # Send to consumer
                await manager.send_to_consumer(session_id, {
                    "type": "message",
                    **agent_message,
                })

                # Broadcast to other viewers
                await manager.broadcast_to_chat_viewers(session_id, {
                    "type": "message",
                    **agent_message,
                })

    except WebSocketDisconnect:
        manager.disconnect_chat_viewer(session_id, websocket)
        logger.info("Chat viewer disconnected: session=%s", session_id)


# =============================================================================
# Helpers
# =============================================================================


def _build_message_history(
    db_messages: list[dict],
) -> list[HumanMessage | AIMessage]:
    """Convert MongoDB message records to LangChain message objects."""
    messages = []
    for msg in db_messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")

        if role == "user":
            messages.append(HumanMessage(content=content))
        elif role in ("assistant", "agent"):
            messages.append(AIMessage(content=content))

    return messages


async def _run_agent(state: dict[str, Any]) -> dict[str, Any]:
    """Run the LangGraph agent and return the result state."""
    # LangGraph's invoke is synchronous — run in executor
    import asyncio
    import functools

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None,
        functools.partial(agent_graph.invoke, state),
    )
    return result


def _extract_final_response(result: dict[str, Any]) -> dict[str, Any]:
    """Extract the final AI message and card payload from agent result."""
    messages = result.get("messages", [])
    card_payload = result.get("last_card_payload", {})

    # Find the last AIMessage in the result
    ai_content = "I'm here to help! What can I do for you?"
    for msg in reversed(messages):
        if isinstance(msg, AIMessage) and msg.content and not msg.tool_calls:
            ai_content = msg.content
            break

    response = {"content": ai_content}
    if card_payload:
        response["card_payload"] = card_payload

    return response
