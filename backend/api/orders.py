"""
Orders CRUD API endpoints.

Handles order creation, listing, updates, and status management
with legal transition validation.
"""

from datetime import datetime

from fastapi import APIRouter, HTTPException, Query

from db.mongodb import mongo
from models.schemas import (
    Order,
    OrderCreate,
    OrderStatus,
    OrderUpdate,
    StatusUpdate,
    VALID_STATUS_TRANSITIONS,
)

router = APIRouter(prefix="/api/orders", tags=["orders"])


async def _get_next_order_id() -> str:
    """Generate the next sequential order ID (ORD-001, ORD-002, etc.)."""
    last_order = await mongo.orders.find_one(
        {},
        sort=[("order_id", -1)],
        projection={"order_id": 1},
    )

    if last_order and last_order.get("order_id"):
        # Extract number from ORD-XXX format
        try:
            num = int(last_order["order_id"].split("-")[1])
            return f"ORD-{num + 1:03d}"
        except (IndexError, ValueError):
            pass

    return "ORD-001"


@router.get("")
async def list_orders(
    status: OrderStatus | None = Query(None, description="Filter by status"),
    search: str | None = Query(None, description="Search by customer name or order ID"),
):
    """
    List all orders with optional filtering.

    Supports filtering by status and searching by customer name or order ID.
    """
    query: dict = {}

    if status:
        query["status"] = status.value

    if search:
        query["$or"] = [
            {"customer_name": {"$regex": search, "$options": "i"}},
            {"order_id": {"$regex": search, "$options": "i"}},
        ]

    cursor = mongo.orders.find(query, {"_id": 0}).sort("created_at", -1)
    orders = await cursor.to_list(length=200)

    return orders


@router.get("/{order_id}")
async def get_order(order_id: str):
    """Get a single order by its ID."""
    order = await mongo.orders.find_one(
        {"order_id": order_id.upper()},
        {"_id": 0},
    )

    if not order:
        raise HTTPException(status_code=404, detail=f"Order '{order_id}' not found.")

    return order


@router.post("", response_model=dict)
async def create_order(body: OrderCreate):
    """
    Create a new order.

    Auto-generates a sequential ORD-XXX ID and sets status to PENDING.
    """
    order_id = await _get_next_order_id()

    order = Order(
        order_id=order_id,
        customer_name=body.customer_name,
        customer_email=body.customer_email,
        items=body.items,
        status=OrderStatus.PENDING,
        shipping_method=body.shipping_method,
        created_at=datetime.utcnow(),
        estimated_delivery=body.estimated_delivery,
        notes=body.notes,
    )

    await mongo.orders.insert_one(order.model_dump())

    return {"order_id": order_id, "status": OrderStatus.PENDING.value}


@router.put("/{order_id}")
async def update_order(order_id: str, body: OrderUpdate):
    """
    Update order fields (partial update).

    Only updates fields that are explicitly set in the request body.
    Does not allow status changes — use the status endpoint for that.
    """
    update_data = body.model_dump(exclude_none=True)

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update.")

    # Convert OrderItem models to dicts for MongoDB
    if "items" in update_data:
        update_data["items"] = [
            item.model_dump() if hasattr(item, "model_dump") else item
            for item in update_data["items"]
        ]

    result = await mongo.orders.update_one(
        {"order_id": order_id.upper()},
        {"$set": update_data},
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail=f"Order '{order_id}' not found.")

    return {"order_id": order_id, "updated_fields": list(update_data.keys())}


@router.patch("/{order_id}/status")
async def update_order_status(order_id: str, body: StatusUpdate):
    """
    Update an order's status with legal transition validation.

    Enforces the status transition rules defined in VALID_STATUS_TRANSITIONS.
    For example, a PENDING order can only move to PROCESSING or CANCELLED.
    """
    order = await mongo.orders.find_one(
        {"order_id": order_id.upper()},
        {"status": 1},
    )

    if not order:
        raise HTTPException(status_code=404, detail=f"Order '{order_id}' not found.")

    current_status = OrderStatus(order["status"])
    new_status = body.status
    allowed = VALID_STATUS_TRANSITIONS.get(current_status, [])

    if new_status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid transition: {current_status.value} → {new_status.value}. "
            f"Allowed: {[s.value for s in allowed]}",
        )

    await mongo.orders.update_one(
        {"order_id": order_id.upper()},
        {"$set": {"status": new_status.value}},
    )

    return {
        "order_id": order_id,
        "previous_status": current_status.value,
        "new_status": new_status.value,
    }
