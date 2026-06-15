"""
Agent tool definitions.

Each tool is a function the LangGraph agent can invoke to perform
actions: database lookups, status updates, semantic search, etc.

Tools use synchronous wrappers around async MongoDB calls since
LangGraph tool execution may not always run in an async context.
"""

import asyncio
import logging
from datetime import datetime

from langchain_core.tools import tool

from db.mongodb import mongo
from db.qdrant import qdrant
from api.websocket_manager import manager

logger = logging.getLogger(__name__)


# =============================================================================
# Helper: Run async functions from sync context
# =============================================================================


def _run_async(coro):
    """Run an async coroutine from a synchronous context."""
    try:
        loop = asyncio.get_running_loop()
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor() as pool:
            future = pool.submit(asyncio.run, coro)
            return future.result()
    except RuntimeError:
        return asyncio.run(coro)


# =============================================================================
# Order Tools
# =============================================================================


@tool
def track_order(order_id: str) -> dict:
    """
    Look up an order by its ID and return full status details.

    Args:
        order_id: The order identifier (e.g., "ORD-001").

    Returns:
        dict with order status, items, ETA, tracking number, and customer info.
        Returns error message if order not found.
    """
    async def _lookup():
        order = await mongo.orders.find_one(
            {"order_id": order_id.upper()},
            {"_id": 0},
        )
        return order

    order = _run_async(_lookup())

    if not order:
        return {"error": f"Order '{order_id}' not found. Please check the order ID and try again."}

    # Format datetime fields for readability
    result = {
        "order_id": order["order_id"],
        "customer_name": order["customer_name"],
        "status": order["status"],
        "items": order["items"],
        "shipping_method": order.get("shipping_method", "standard"),
        "created_at": str(order.get("created_at", "")),
        "estimated_delivery": str(order.get("estimated_delivery", "")) if order.get("estimated_delivery") else "Not available",
        "tracking_number": order.get("tracking_number", "Not available"),
        "notes": order.get("notes"),
    }

    return result


# =============================================================================
# Return / Refund Tools
# =============================================================================


@tool
def get_return_policy() -> dict:
    """
    Get the store's return policy details.

    Returns:
        dict with policy text, eligible conditions, and return window.
    """
    return {
        "policy_summary": "North Star Outfitters offers a 30-day return policy on all purchases.",
        "return_window": "30 days from delivery date",
        "eligible_conditions": [
            "Item is unused and in original packaging",
            "Item was purchased within the last 30 days",
            "Item is not a final sale / clearance item",
        ],
        "eligible_statuses": ["DELIVERED"],
        "process_steps": [
            "Initiate return through our chatbot or contact support",
            "Receive a prepaid return shipping label via email",
            "Pack the item securely and drop it off at any carrier location",
            "Refund processed within 5-7 business days of receiving the return",
        ],
        "return_link": "https://northstaroutfitters.com/returns",
        "notes": "Exchanges are also available for different sizes or colors.",
    }


@tool
def initiate_return(order_id: str) -> dict:
    """
    Initiate a return for a specific order.

    Checks if the order is eligible for return (must be DELIVERED status)
    and updates the status to RETURN_REQUESTED.

    Args:
        order_id: The order identifier to initiate return for.

    Returns:
        dict with return confirmation or error message.
    """
    async def _initiate():
        order = await mongo.orders.find_one(
            {"order_id": order_id.upper()},
            {"_id": 0},
        )

        if not order:
            return {"error": f"Order '{order_id}' not found."}

        # Check eligibility
        if order["status"] != "DELIVERED":
            status = order["status"]
            if status in ("RETURN_REQUESTED", "RETURN_IN_TRANSIT", "REFUND_PROCESSING"):
                return {
                    "error": f"A return for order '{order_id}' is already in progress. "
                    f"Current status: {status}.",
                }
            if status == "REFUNDED":
                return {"error": f"Order '{order_id}' has already been refunded."}

            return {
                "error": f"Order '{order_id}' is not eligible for return. "
                f"Current status: {status}. "
                f"Orders must be in 'DELIVERED' status to initiate a return.",
            }

        # Update status
        await mongo.orders.update_one(
            {"order_id": order_id.upper()},
            {"$set": {"status": "RETURN_REQUESTED"}},
        )

        return {
            "success": True,
            "order_id": order["order_id"],
            "items": order["items"],
            "next_steps": [
                "A prepaid return label will be sent to your email",
                "Pack the item securely in its original packaging",
                "Drop off at any carrier location within 7 days",
            ],
            "refund_estimate": "5-7 business days after we receive the return",
        }

    return _run_async(_initiate())


# =============================================================================
# Product Tools
# =============================================================================


@tool
def search_products(query: str) -> dict:
    """
    Search the product catalog using semantic search.

    Finds products matching the query based on meaning, not just keywords.
    For example, "something warm for winter hiking" will match insulated jackets.

    Args:
        query: Natural language description of what the customer is looking for.

    Returns:
        dict with matching products and match type ("exact" or "nearest").
    """
    # Try threshold-based search first
    results = qdrant.search_products(query, limit=5, score_threshold=0.7)

    if results:
        return {
            "match_type": "exact",
            "products": results,
            "count": len(results),
        }

    # Fallback to nearest matches
    nearest = qdrant.get_nearest_products(query, limit=3)
    return {
        "match_type": "nearest",
        "products": nearest,
        "count": len(nearest),
        "note": "These are the closest matches we have. New gear is added regularly!",
    }


@tool
def get_nearest_products(query: str) -> dict:
    """
    Get the nearest matching products regardless of relevance score.

    Used as a fallback when no strong matches exist.

    Args:
        query: Natural language search query.

    Returns:
        dict with nearest products.
    """
    results = qdrant.get_nearest_products(query, limit=3)
    return {
        "products": results,
        "count": len(results),
        "note": "These are our closest matches. We're always adding new gear — check back soon!",
    }


# =============================================================================
# FAQ Tool
# =============================================================================

_FAQ_DATA = {
    "shipping": {
        "topic": "Shipping Information",
        "content": (
            "Standard shipping: 5-7 business days ($5.99, free over $75).\n"
            "Expedited shipping: 2-3 business days ($14.99).\n"
            "All orders ship from our warehouse in Denver, CO.\n"
            "Tracking numbers are emailed once your order ships."
        ),
    },
    "payment": {
        "topic": "Payment Methods",
        "content": (
            "We accept Visa, Mastercard, American Express, Discover, PayPal, "
            "and Apple Pay. All transactions are secured with SSL encryption."
        ),
    },
    "warranty": {
        "topic": "Product Warranty",
        "content": (
            "All North Star Outfitters branded products come with a lifetime "
            "warranty against manufacturing defects. Third-party brands carry "
            "their manufacturer's warranty. Contact us for warranty claims."
        ),
    },
    "hours": {
        "topic": "Store Hours & Contact",
        "content": (
            "Online store: Always open!\n"
            "Customer support: Mon-Fri 8am-6pm MT, Sat 9am-3pm MT.\n"
            "Email: support@northstaroutfitters.com\n"
            "Phone: 1-800-NORTH-STAR"
        ),
    },
    "sizing": {
        "topic": "Sizing & Fit",
        "content": (
            "Check our size guide on each product page for detailed measurements. "
            "When between sizes, we recommend sizing up for layering (jackets) "
            "and trying your usual size for footwear. Free exchanges for wrong sizes!"
        ),
    },
}


@tool
def get_faq(topic: str) -> dict:
    """
    Look up frequently asked questions by topic.

    Args:
        topic: The FAQ topic — one of: shipping, payment, warranty, hours, sizing.

    Returns:
        dict with the FAQ topic title and content.
    """
    topic_lower = topic.lower().strip()

    # Try exact match first
    if topic_lower in _FAQ_DATA:
        return _FAQ_DATA[topic_lower]

    # Try partial match
    for key, data in _FAQ_DATA.items():
        if topic_lower in key or key in topic_lower:
            return data

    # No match — return all topics
    return {
        "topic": "Available FAQ Topics",
        "content": "I can help with these topics: " + ", ".join(_FAQ_DATA.keys()),
        "available_topics": list(_FAQ_DATA.keys()),
    }


# =============================================================================
# Human Handoff Tools
# =============================================================================


@tool
def escalate_to_human(session_id: str, summary: str) -> dict:
    """
    Escalate the current session to a human support agent.

    Updates the session status to HANDED_OFF and broadcasts
    an alert to all connected dashboard agents.

    Args:
        session_id: The chat session to escalate.
        summary: AI-generated summary of the conversation for the agent.

    Returns:
        dict confirming the handoff.
    """
    async def _escalate():
        # Update session in MongoDB
        result = await mongo.sessions.update_one(
            {"session_id": session_id},
            {
                "$set": {
                    "status": "handed_off",
                    "handoff_summary": summary,
                }
            },
        )

        if result.matched_count == 0:
            return {"error": f"Session '{session_id}' not found."}

        # Get session details for the alert
        session = await mongo.sessions.find_one(
            {"session_id": session_id},
            {"_id": 0, "consumer_name": 1, "session_id": 1},
        )

        # Broadcast alert to dashboard
        await manager.broadcast_alert({
            "type": "handoff_alert",
            "session_id": session_id,
            "consumer_name": session.get("consumer_name", "Unknown"),
            "summary": summary,
            "timestamp": datetime.utcnow().isoformat(),
        })

        return {
            "success": True,
            "session_id": session_id,
            "status": "handed_off",
            "message": "Your conversation has been forwarded to a support agent. "
            "Someone will be with you shortly.",
        }

    return _run_async(_escalate())


@tool
def get_session_summary(session_id: str) -> dict:
    """
    Pull the full conversation context for a session.

    Used to generate handoff summaries or review conversation history.

    Args:
        session_id: The session to summarize.

    Returns:
        dict with session details and message history.
    """
    async def _get_summary():
        session = await mongo.sessions.find_one(
            {"session_id": session_id},
            {"_id": 0},
        )

        if not session:
            return {"error": f"Session '{session_id}' not found."}

        return {
            "session_id": session["session_id"],
            "consumer_name": session["consumer_name"],
            "status": session["status"],
            "message_count": len(session.get("messages", [])),
            "messages": session.get("messages", [])[-10:],  # Last 10 messages
        }

    return _run_async(_get_summary())


# =============================================================================
# Tool Registry
# =============================================================================

ALL_TOOLS = [
    track_order,
    get_return_policy,
    initiate_return,
    search_products,
    get_nearest_products,
    get_faq,
    escalate_to_human,
    get_session_summary,
]
