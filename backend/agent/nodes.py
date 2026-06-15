"""
LangGraph node functions.

Each function is a node in the agent graph. Nodes receive the current
AgentState, perform their logic (LLM calls, tool invocations), and
return state updates.
"""

import json
import logging
from typing import Any

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from agent.prompts import (
    AGENT_PERSONA,
    FAQ_PROMPT,
    FALLBACK_PROMPT,
    GENERAL_CHAT_PROMPT,
    HANDOFF_SUMMARY_PROMPT,
    INTENT_CLASSIFICATION_PROMPT,
    ORDER_TRACKING_PROMPT,
    PRODUCT_RECOMMENDATION_PROMPT,
    RETURNS_EXCHANGES_PROMPT,
)
from agent.state import AgentState
from agent.tools import ALL_TOOLS
from config import settings

logger = logging.getLogger(__name__)

import os
if settings.gcp_credentials_path:
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = settings.gcp_credentials_path

# Initialize the LLM — shared across all nodes
if settings.gcp_project and settings.gcp_credentials_path:
    from langchain_google_vertexai import ChatVertexAI
    logger.info("Initializing Vertex AI Chat Model (Project: %s, Location: %s)", settings.gcp_project, settings.gcp_location)
    llm = ChatVertexAI(
        model="gemini-2.5-flash",
        project=settings.gcp_project,
        location=settings.gcp_location,
        temperature=0.7,
    )
else:
    logger.info("Initializing Google AI Studio Chat Model")
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=settings.gemini_api_key,
        temperature=0.7,
    )

# LLM with tools bound — for nodes that need tool calling
llm_with_tools = llm.bind_tools(ALL_TOOLS)


# =============================================================================
# Intent Router
# =============================================================================


def intent_router(state: AgentState) -> dict[str, Any]:
    """
    Classify the user's latest message into an intent category.

    This is the entry node — every message passes through here first.
    Sets current_intent which determines which domain node runs next.
    """
    messages = state["messages"]
    if not messages:
        return {"current_intent": "general_chat"}

    last_message = messages[-1]

    # Use a separate LLM call for classification (low temperature for consistency)
    if settings.gcp_project and settings.gcp_credentials_path:
        from langchain_google_vertexai import ChatVertexAI
        classifier = ChatVertexAI(
            model="gemini-2.5-flash",
            project=settings.gcp_project,
            location=settings.gcp_location,
            temperature=0.1,
        )
    else:
        classifier = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=settings.gemini_api_key,
            temperature=0.1,
        )

    response = classifier.invoke([
        SystemMessage(content=INTENT_CLASSIFICATION_PROMPT),
        HumanMessage(content=last_message.content),
    ])

    intent = response.content.strip().lower().replace('"', "").replace("'", "")

    # Validate intent — fall back to "fallback" if unrecognized
    valid_intents = {
        "order_tracking",
        "returns_exchanges",
        "product_recommendation",
        "faq",
        "human_handoff",
        "general_chat",
        "fallback",
    }

    if intent not in valid_intents:
        logger.warning("Unrecognized intent '%s' — falling back.", intent)
        intent = "fallback"

    logger.info("Classified intent: %s", intent)
    return {"current_intent": intent}


# =============================================================================
# Domain Nodes
# =============================================================================


def order_tracking_node(state: AgentState) -> dict[str, Any]:
    """Handle order tracking queries using the track_order tool."""
    response = llm_with_tools.invoke([
        SystemMessage(content=ORDER_TRACKING_PROMPT),
        *state["messages"],
    ])

    # Process tool calls if any
    result = _process_tool_response(response, state)
    result["failed_intent_count"] = 0  # Reset on successful intent
    return result


def returns_exchanges_node(state: AgentState) -> dict[str, Any]:
    """Handle return policy, return initiation, and refund status queries."""
    response = llm_with_tools.invoke([
        SystemMessage(content=RETURNS_EXCHANGES_PROMPT),
        *state["messages"],
    ])

    result = _process_tool_response(response, state)
    result["failed_intent_count"] = 0
    return result


def product_recommendation_node(state: AgentState) -> dict[str, Any]:
    """Handle product discovery and recommendation queries."""
    response = llm_with_tools.invoke([
        SystemMessage(content=PRODUCT_RECOMMENDATION_PROMPT),
        *state["messages"],
    ])

    result = _process_tool_response(response, state)
    result["failed_intent_count"] = 0
    return result


def faq_node(state: AgentState) -> dict[str, Any]:
    """Handle general FAQ questions."""
    response = llm_with_tools.invoke([
        SystemMessage(content=FAQ_PROMPT),
        *state["messages"],
    ])

    result = _process_tool_response(response, state)
    result["failed_intent_count"] = 0
    return result


def general_chat_node(state: AgentState) -> dict[str, Any]:
    """Handle greetings, thank-yous, and casual conversation."""
    consumer_name = state.get("consumer_name", "there")

    response = llm.invoke([
        SystemMessage(content=GENERAL_CHAT_PROMPT),
        HumanMessage(content=f"[Customer name: {consumer_name}]"),
        *state["messages"],
    ])

    return {
        "messages": [response],
        "last_card_payload": {},
        "failed_intent_count": 0,
    }


def fallback_node(state: AgentState) -> dict[str, Any]:
    """
    Handle unrecognized intents.

    Increments the failed intent counter. After 2+ failures,
    suggests human handoff.
    """
    failed_count = state.get("failed_intent_count", 0) + 1

    if failed_count >= 2:
        # Suggest handoff after repeated failures
        response = llm.invoke([
            SystemMessage(
                content=f"{AGENT_PERSONA}\n\n"
                "The customer has had trouble getting help. Apologize sincerely "
                "and offer to connect them with a human agent. Also show the "
                "help menu with common options. Set card_payload with type 'help_menu'."
            ),
            *state["messages"],
        ])
    else:
        response = llm.invoke([
            SystemMessage(content=FALLBACK_PROMPT),
            *state["messages"],
        ])

    card_payload = {
        "type": "help_menu",
        "data": {
            "options": [
                "Track my order",
                "Returns & exchanges",
                "Product recommendations",
                "General questions",
                "Talk to a human agent",
            ],
            "suggest_handoff": failed_count >= 2,
        },
    }

    return {
        "messages": [response],
        "last_card_payload": card_payload,
        "failed_intent_count": failed_count,
    }


def human_handoff_node(state: AgentState) -> dict[str, Any]:
    """
    Initiate human handoff.

    Generates a conversation summary and triggers the escalation flow.
    """
    # Generate summary from conversation history
    summary_messages = [
        SystemMessage(content=HANDOFF_SUMMARY_PROMPT),
    ]

    for msg in state["messages"][-10:]:  # Last 10 messages for context
        if isinstance(msg, HumanMessage):
            summary_messages.append(HumanMessage(content=msg.content))
        elif isinstance(msg, AIMessage):
            summary_messages.append(AIMessage(content=msg.content))

    summary_response = llm.invoke(summary_messages)
    summary = summary_response.content

    # Call the escalation tool
    from agent.tools import escalate_to_human
    escalation_result = escalate_to_human.invoke({
        "session_id": state["session_id"],
        "summary": summary,
    })

    # Build response message
    response = AIMessage(
        content="I'm connecting you with a human support agent now. "
        "They'll have the full context of our conversation. "
        "Someone will be with you shortly — hang tight! 🙌"
    )

    card_payload = {
        "type": "handoff",
        "data": {
            "summary": summary,
            "status": "connecting",
            "message": "Connecting you to a live agent...",
        },
    }

    return {
        "messages": [response],
        "handoff_triggered": True,
        "handoff_summary": summary,
        "last_card_payload": card_payload,
        "failed_intent_count": 0,
    }


# =============================================================================
# Response Formatter (Terminal Node)
# =============================================================================


def response_formatter(state: AgentState) -> dict[str, Any]:
    """
    Terminal node — formats the final response.

    Ensures the response has both text content and a card_payload
    (even if empty) for the frontend to process.
    """
    # The response is already in messages from the domain node
    # Just ensure card_payload is set
    card_payload = state.get("last_card_payload", {})

    return {"last_card_payload": card_payload}


# =============================================================================
# Helper: Process Tool Responses
# =============================================================================


def _process_tool_response(response: AIMessage, state: AgentState) -> dict[str, Any]:
    """
    Process an LLM response that may contain tool calls.

    If the LLM decided to call tools, execute them and feed results
    back for a final response. Extracts card_payload from tool results.
    """
    if not response.tool_calls:
        # No tool calls — return the text response directly
        return {
            "messages": [response],
            "last_card_payload": _extract_card_payload(response.content, state),
        }

    # Execute tool calls and collect results
    from langchain_core.messages import ToolMessage

    tool_map = {tool.name: tool for tool in ALL_TOOLS}
    tool_messages = [response]  # Include the AI message with tool_calls
    card_payload = {}

    for tool_call in response.tool_calls:
        tool_name = tool_call["name"]
        tool_args = tool_call["args"]

        if tool_name in tool_map:
            try:
                result = tool_map[tool_name].invoke(tool_args)
                tool_messages.append(
                    ToolMessage(
                        content=json.dumps(result, default=str),
                        tool_call_id=tool_call["id"],
                    )
                )

                # Build card payload from tool results
                card_payload = _build_card_from_tool(tool_name, result, state)

            except Exception as e:
                logger.error("Tool '%s' failed: %s", tool_name, e)
                tool_messages.append(
                    ToolMessage(
                        content=json.dumps({"error": str(e)}),
                        tool_call_id=tool_call["id"],
                    )
                )
        else:
            logger.warning("Unknown tool requested: %s", tool_name)
            tool_messages.append(
                ToolMessage(
                    content=json.dumps({"error": f"Unknown tool: {tool_name}"}),
                    tool_call_id=tool_call["id"],
                )
            )

    # Get final response with tool results
    final_response = llm.invoke([
        SystemMessage(content=AGENT_PERSONA),
        *state["messages"],
        *tool_messages,
    ])

    return {
        "messages": [response, *tool_messages[1:], final_response],
        "last_card_payload": card_payload,
    }


def _build_card_from_tool(
    tool_name: str, result: dict, state: AgentState
) -> dict[str, Any]:
    """Build a card_payload based on which tool was called and its result."""
    if tool_name == "track_order" and "error" not in result:
        return {
            "type": "order_status",
            "data": {
                "order_id": result.get("order_id"),
                "status": result.get("status"),
                "items": result.get("items", []),
                "estimated_delivery": result.get("estimated_delivery"),
                "tracking_number": result.get("tracking_number"),
                "shipping_method": result.get("shipping_method"),
            },
        }

    if tool_name == "get_return_policy":
        return {
            "type": "return_policy",
            "data": result,
        }

    if tool_name == "initiate_return":
        if result.get("success"):
            return {
                "type": "return_confirmation",
                "data": {
                    "order_id": result.get("order_id"),
                    "items": result.get("items", []),
                    "next_steps": result.get("next_steps", []),
                    "refund_estimate": result.get("refund_estimate"),
                },
            }
        return {}

    if tool_name in ("search_products", "get_nearest_products"):
        products = result.get("products", [])
        if products:
            return {
                "type": "product_cards",
                "data": {
                    "products": products,
                    "match_type": result.get("match_type", "nearest"),
                    "note": result.get("note"),
                },
            }
        return {}

    if tool_name == "get_faq":
        return {}  # FAQ responses are text-only, no card needed

    if tool_name == "escalate_to_human":
        return {
            "type": "handoff",
            "data": {
                "summary": result.get("message", ""),
                "status": "connecting",
            },
        }

    return {}


def _extract_card_payload(content: str, state: AgentState) -> dict[str, Any]:
    """
    Try to extract a card_payload from the LLM's text response.

    Some responses may include card data inline as JSON.
    Returns empty dict if no card found.
    """
    # For now, return empty — cards are built from tool results
    return state.get("last_card_payload", {})
