"""
Agent state schema.

Defines the typed state that flows through the LangGraph agent.
All nodes read from and write to this shared state.
"""

from typing import Annotated, Any

from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages
from typing_extensions import TypedDict


class AgentState(TypedDict):
    """
    Typed state for the North Star AI agent.

    Attributes:
        session_id: Active chat session identifier.
        consumer_name: Name of the consumer in this session.
        messages: Conversation history (LangChain message format).
        current_intent: Classified intent from the intent router.
        resolved_entities: Extracted entities (order_id, filters, etc.).
        failed_intent_count: Consecutive unresolved intent counter.
        handoff_triggered: Whether human handoff has been initiated.
        handoff_summary: AI-generated conversation summary for agents.
        last_card_payload: Structured card data for frontend rendering.
    """

    session_id: str
    consumer_name: str
    messages: Annotated[list[BaseMessage], add_messages]
    current_intent: str
    resolved_entities: dict[str, Any]
    failed_intent_count: int
    handoff_triggered: bool
    handoff_summary: str
    last_card_payload: dict[str, Any]
