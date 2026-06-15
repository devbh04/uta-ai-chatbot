"""
Data models and schemas for the North Star application.

Defines all Pydantic models, enums, and request/response types
used across the API, database, and agent layers.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


# =============================================================================
# Enums
# =============================================================================


class OrderStatus(str, Enum):
    """All possible order lifecycle states."""

    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    SHIPPED = "SHIPPED"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"
    RETURN_REQUESTED = "RETURN_REQUESTED"
    RETURN_IN_TRANSIT = "RETURN_IN_TRANSIT"
    REFUND_PROCESSING = "REFUND_PROCESSING"
    REFUNDED = "REFUNDED"
    EXCHANGED = "EXCHANGED"


class SessionStatus(str, Enum):
    """Chat session lifecycle states."""

    ACTIVE = "active"
    HANDED_OFF = "handed_off"
    RESOLVED = "resolved"
    TAKEN_OVER = "taken_over"


class ShippingMethod(str, Enum):
    """Available shipping methods."""

    STANDARD = "standard"
    EXPEDITED = "expedited"


# Valid status transitions — used for validation in the orders API
VALID_STATUS_TRANSITIONS: dict[OrderStatus, list[OrderStatus]] = {
    OrderStatus.PENDING: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
    OrderStatus.PROCESSING: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
    OrderStatus.SHIPPED: [OrderStatus.OUT_FOR_DELIVERY],
    OrderStatus.OUT_FOR_DELIVERY: [OrderStatus.DELIVERED],
    OrderStatus.DELIVERED: [OrderStatus.RETURN_REQUESTED],
    OrderStatus.CANCELLED: [],
    OrderStatus.RETURN_REQUESTED: [OrderStatus.RETURN_IN_TRANSIT],
    OrderStatus.RETURN_IN_TRANSIT: [OrderStatus.REFUND_PROCESSING],
    OrderStatus.REFUND_PROCESSING: [OrderStatus.REFUNDED, OrderStatus.EXCHANGED],
    OrderStatus.REFUNDED: [],
    OrderStatus.EXCHANGED: [],
}


# =============================================================================
# Core Models
# =============================================================================


class OrderItem(BaseModel):
    """A single item within an order."""

    product_name: str
    qty: int = Field(ge=1)
    price: float = Field(ge=0)


class Order(BaseModel):
    """Full order record stored in MongoDB."""

    order_id: str
    customer_name: str
    customer_email: str
    items: list[OrderItem]
    status: OrderStatus = OrderStatus.PENDING
    shipping_method: ShippingMethod = ShippingMethod.STANDARD
    created_at: datetime = Field(default_factory=datetime.utcnow)
    estimated_delivery: Optional[datetime] = None
    tracking_number: Optional[str] = None
    notes: Optional[str] = None


class Product(BaseModel):
    """Product record stored in MongoDB + embedded in Qdrant."""

    product_id: str
    name: str
    description: str
    category: str
    price: float = Field(ge=0)
    image_url: str
    in_stock: bool = True
    tags: list[str] = Field(default_factory=list)
    embedded_at: Optional[datetime] = None


class ChatMessage(BaseModel):
    """A single message in a chat session."""

    role: str  # "user", "assistant", or "agent"
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    card_payload: Optional[dict[str, Any]] = None


class ChatSession(BaseModel):
    """Chat session record stored in MongoDB."""

    session_id: str
    consumer_name: str
    guest_id: Optional[str] = None
    status: SessionStatus = SessionStatus.ACTIVE
    started_at: datetime = Field(default_factory=datetime.utcnow)
    messages: list[ChatMessage] = Field(default_factory=list)
    handoff_summary: Optional[str] = None
    assigned_agent: Optional[str] = None


# =============================================================================
# Request / Response Models
# =============================================================================


class SessionCreate(BaseModel):
    """Request body for creating a new chat session."""

    consumer_name: str = Field(min_length=1, max_length=100)
    guest_id: Optional[str] = None


class OrderCreate(BaseModel):
    """Request body for creating a new order."""

    customer_name: str = Field(min_length=1)
    customer_email: str
    items: list[OrderItem] = Field(min_length=1)
    shipping_method: ShippingMethod = ShippingMethod.STANDARD
    estimated_delivery: Optional[datetime] = None
    notes: Optional[str] = None


class OrderUpdate(BaseModel):
    """Request body for updating order fields (partial update)."""

    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    items: Optional[list[OrderItem]] = None
    shipping_method: Optional[ShippingMethod] = None
    estimated_delivery: Optional[datetime] = None
    tracking_number: Optional[str] = None
    notes: Optional[str] = None


class StatusUpdate(BaseModel):
    """Request body for updating an order's status."""

    status: OrderStatus


class ProductCreate(BaseModel):
    """Request body for creating a new product."""

    name: str = Field(min_length=1)
    description: str
    category: str
    price: float = Field(ge=0)
    image_url: str
    in_stock: bool = True
    tags: list[str] = Field(default_factory=list)


class ProductUpdate(BaseModel):
    """Request body for updating product fields (partial update)."""

    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    image_url: Optional[str] = None
    in_stock: Optional[bool] = None
    tags: Optional[list[str]] = None


class TakeoverRequest(BaseModel):
    """Request body for an agent taking over a session."""

    agent_name: str = Field(min_length=1, max_length=100)
