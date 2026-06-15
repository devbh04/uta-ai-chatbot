"""
LangGraph state graph definition.

Defines the agent's execution flow: intent routing → domain nodes → response.
This is the core orchestration layer that wires everything together.
"""

import logging
from typing import Any

from langgraph.graph import END, StateGraph

from agent.nodes import (
    fallback_node,
    faq_node,
    general_chat_node,
    human_handoff_node,
    intent_router,
    order_tracking_node,
    product_recommendation_node,
    response_formatter,
    returns_exchanges_node,
)
from agent.state import AgentState

logger = logging.getLogger(__name__)


# =============================================================================
# Conditional Edge: Route by Intent
# =============================================================================


def route_by_intent(state: AgentState) -> str:
    """
    Conditional edge function — routes to the appropriate domain node
    based on the classified intent.
    """
    intent = state.get("current_intent", "fallback")

    intent_to_node = {
        "order_tracking": "order_tracking_node",
        "returns_exchanges": "returns_exchanges_node",
        "product_recommendation": "product_recommendation_node",
        "faq": "faq_node",
        "general_chat": "general_chat_node",
        "human_handoff": "human_handoff_node",
        "fallback": "fallback_node",
    }

    node = intent_to_node.get(intent, "fallback_node")
    logger.info("Routing to node: %s (intent: %s)", node, intent)
    return node


# =============================================================================
# Build the Graph
# =============================================================================


def build_agent_graph() -> StateGraph:
    """
    Construct and compile the LangGraph agent.

    Graph structure:
        START → intent_router → [domain node] → response_formatter → END

    Returns:
        Compiled LangGraph StateGraph ready for invocation.
    """
    graph = StateGraph(AgentState)

    # Add all nodes
    graph.add_node("intent_router", intent_router)
    graph.add_node("order_tracking_node", order_tracking_node)
    graph.add_node("returns_exchanges_node", returns_exchanges_node)
    graph.add_node("product_recommendation_node", product_recommendation_node)
    graph.add_node("faq_node", faq_node)
    graph.add_node("general_chat_node", general_chat_node)
    graph.add_node("fallback_node", fallback_node)
    graph.add_node("human_handoff_node", human_handoff_node)
    graph.add_node("response_formatter", response_formatter)

    # Entry point
    graph.set_entry_point("intent_router")

    # Conditional routing from intent_router to domain nodes
    graph.add_conditional_edges(
        "intent_router",
        route_by_intent,
        {
            "order_tracking_node": "order_tracking_node",
            "returns_exchanges_node": "returns_exchanges_node",
            "product_recommendation_node": "product_recommendation_node",
            "faq_node": "faq_node",
            "general_chat_node": "general_chat_node",
            "fallback_node": "fallback_node",
            "human_handoff_node": "human_handoff_node",
        },
    )

    # All domain nodes → response_formatter → END
    for node_name in [
        "order_tracking_node",
        "returns_exchanges_node",
        "product_recommendation_node",
        "faq_node",
        "general_chat_node",
        "fallback_node",
        "human_handoff_node",
    ]:
        graph.add_edge(node_name, "response_formatter")

    graph.add_edge("response_formatter", END)

    return graph.compile()


# Compiled graph — import and invoke this
agent_graph = build_agent_graph()
