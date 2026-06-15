"""
Seed data for the North Star application.

Loads sample orders and products into MongoDB and Qdrant on first startup.
Only seeds if collections are empty (safe to run multiple times).
"""

import logging
from datetime import datetime, timedelta

from db.mongodb import mongo
from db.qdrant import qdrant

logger = logging.getLogger(__name__)


# =============================================================================
# Sample Orders
# =============================================================================

SEED_ORDERS = [
    {
        "order_id": "ORD-001",
        "customer_name": "Alice Johnson",
        "customer_email": "alice@example.com",
        "items": [{"product_name": "Summit Insulated Jacket", "qty": 1, "price": 189.99}],
        "status": "DELIVERED",
        "shipping_method": "expedited",
        "created_at": datetime.utcnow() - timedelta(days=14),
        "estimated_delivery": datetime.utcnow() - timedelta(days=7),
        "tracking_number": "TRK-98765-AJ",
        "notes": "Gift wrapped",
    },
    {
        "order_id": "ORD-002",
        "customer_name": "Bob Smith",
        "customer_email": "bob@example.com",
        "items": [
            {"product_name": "Trail Runner Pro", "qty": 1, "price": 129.99},
            {"product_name": "Carbon Trekking Poles", "qty": 1, "price": 89.99},
        ],
        "status": "SHIPPED",
        "shipping_method": "standard",
        "created_at": datetime.utcnow() - timedelta(days=5),
        "estimated_delivery": datetime.utcnow() + timedelta(days=3),
        "tracking_number": "TRK-45678-BS",
    },
    {
        "order_id": "ORD-003",
        "customer_name": "Carol Davis",
        "customer_email": "carol@example.com",
        "items": [{"product_name": "Alpine Backpack 45L", "qty": 1, "price": 159.99}],
        "status": "PROCESSING",
        "shipping_method": "standard",
        "created_at": datetime.utcnow() - timedelta(days=2),
        "estimated_delivery": datetime.utcnow() + timedelta(days=7),
    },
    {
        "order_id": "ORD-004",
        "customer_name": "Dave Wilson",
        "customer_email": "dave@example.com",
        "items": [{"product_name": "Basecamp Tent 2P", "qty": 1, "price": 249.99}],
        "status": "RETURN_REQUESTED",
        "shipping_method": "expedited",
        "created_at": datetime.utcnow() - timedelta(days=20),
        "estimated_delivery": datetime.utcnow() - timedelta(days=14),
        "tracking_number": "TRK-11223-DW",
        "notes": "Customer reported wrong size",
    },
    {
        "order_id": "ORD-005",
        "customer_name": "Eve Martinez",
        "customer_email": "eve@example.com",
        "items": [{"product_name": "Glacier Sunglasses", "qty": 1, "price": 59.99}],
        "status": "REFUND_PROCESSING",
        "shipping_method": "standard",
        "created_at": datetime.utcnow() - timedelta(days=25),
        "estimated_delivery": datetime.utcnow() - timedelta(days=20),
        "tracking_number": "TRK-33445-EM",
    },
    {
        "order_id": "ORD-006",
        "customer_name": "Frank Lee",
        "customer_email": "frank@example.com",
        "items": [
            {"product_name": "Ridgeline Fleece", "qty": 1, "price": 79.99},
            {"product_name": "Wool Hiking Socks (3-Pack)", "qty": 2, "price": 24.99},
        ],
        "status": "PENDING",
        "shipping_method": "standard",
        "created_at": datetime.utcnow() - timedelta(hours=6),
        "estimated_delivery": datetime.utcnow() + timedelta(days=10),
    },
]


# =============================================================================
# Sample Products (with Unsplash images)
# =============================================================================

SEED_PRODUCTS = [
    {
        "product_id": "PROD-001",
        "name": "Summit Insulated Jacket",
        "description": "Premium insulated jacket for cold-weather hiking and mountaineering. "
        "Features 800-fill down, waterproof shell, and adjustable hood. "
        "Rated for temperatures down to -20°F.",
        "category": "jackets",
        "price": 189.99,
        "image_url": "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400",
        "in_stock": True,
        "tags": ["insulated", "winter", "hiking", "mountaineering", "waterproof"],
    },
    {
        "product_id": "PROD-002",
        "name": "Trail Runner Pro",
        "description": "Lightweight trail running shoes with aggressive tread pattern. "
        "Breathable mesh upper, rock plate protection, and responsive cushioning. "
        "Perfect for technical trails and ultramarathons.",
        "category": "footwear",
        "price": 129.99,
        "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
        "in_stock": True,
        "tags": ["trail running", "lightweight", "breathable", "technical"],
    },
    {
        "product_id": "PROD-003",
        "name": "Alpine Backpack 45L",
        "description": "Versatile 45-liter backpack for multi-day hikes. "
        "Adjustable torso length, padded hip belt, and multiple access points. "
        "Includes rain cover and hydration sleeve.",
        "category": "backpacks",
        "price": 159.99,
        "image_url": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400",
        "in_stock": True,
        "tags": ["backpacking", "multi-day", "hiking", "rain cover"],
    },
    {
        "product_id": "PROD-004",
        "name": "Basecamp Tent 2P",
        "description": "Two-person, four-season tent built for harsh conditions. "
        "Double-wall construction, full-coverage fly, and two vestibules. "
        "Weighs 4.2 lbs packed.",
        "category": "camping",
        "price": 249.99,
        "image_url": "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400",
        "in_stock": True,
        "tags": ["tent", "four-season", "camping", "backpacking", "lightweight"],
    },
    {
        "product_id": "PROD-005",
        "name": "Carbon Trekking Poles",
        "description": "Ultralight carbon fiber trekking poles with cork grips. "
        "Three-section telescoping design, quick-lock mechanism. "
        "Includes snow baskets and rubber tips.",
        "category": "trekking poles",
        "price": 89.99,
        "image_url": "https://images.unsplash.com/photo-1551632811-561732d1e306?w=400",
        "in_stock": True,
        "tags": ["trekking", "ultralight", "carbon fiber", "hiking"],
    },
    {
        "product_id": "PROD-006",
        "name": "Ridgeline Fleece",
        "description": "Midweight fleece jacket ideal for layering. "
        "Polartec fabric, full-zip design, and zippered hand pockets. "
        "Great as a standalone or mid-layer for cold weather.",
        "category": "jackets",
        "price": 79.99,
        "image_url": "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400",
        "in_stock": True,
        "tags": ["fleece", "layering", "midweight", "cold weather"],
    },
    {
        "product_id": "PROD-007",
        "name": "Glacier Sunglasses",
        "description": "High-altitude glacier sunglasses with Category 4 lenses. "
        "Side shields block peripheral light. Polarized, anti-fog coating. "
        "Essential for snow and high-elevation trekking.",
        "category": "accessories",
        "price": 59.99,
        "image_url": "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400",
        "in_stock": True,
        "tags": ["sunglasses", "glacier", "polarized", "UV protection"],
    },
    {
        "product_id": "PROD-008",
        "name": "Wool Hiking Socks (3-Pack)",
        "description": "Premium merino wool hiking socks. Moisture-wicking, "
        "odor-resistant, and cushioned in high-impact zones. "
        "Reinforced heel and toe. Pack of three pairs.",
        "category": "accessories",
        "price": 24.99,
        "image_url": "https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=400",
        "in_stock": True,
        "tags": ["socks", "merino wool", "moisture-wicking", "hiking"],
    },
    {
        "product_id": "PROD-009",
        "name": "Waterproof Rain Shell",
        "description": "Ultralight waterproof rain jacket with fully taped seams. "
        "3-layer construction, pit zips for ventilation, and packable design. "
        "Weighs just 8 oz — fits in its own pocket.",
        "category": "jackets",
        "price": 219.99,
        "image_url": "https://images.unsplash.com/photo-1545594861-3bef43ff2fc8?w=400",
        "in_stock": True,
        "tags": ["rain jacket", "waterproof", "ultralight", "packable"],
    },
    {
        "product_id": "PROD-010",
        "name": "Summit Hiking Boots",
        "description": "Full-grain leather hiking boots with Vibram soles. "
        "Ankle support, waterproof membrane, and cushioned midsole. "
        "Built for rugged terrain and heavy loads.",
        "category": "footwear",
        "price": 199.99,
        "image_url": "https://images.unsplash.com/photo-1520219306100-ec4afeeefe58?w=400",
        "in_stock": True,
        "tags": ["hiking boots", "leather", "waterproof", "rugged"],
    },
    {
        "product_id": "PROD-011",
        "name": "Camping Headlamp",
        "description": "Rechargeable LED headlamp with 350 lumens output. "
        "Red night-vision mode, adjustable beam, and IPX7 waterproof rating. "
        "USB-C charging, 40-hour runtime on low.",
        "category": "camping",
        "price": 34.99,
        "image_url": "https://images.unsplash.com/photo-1525811902-f2342640856e?w=400",
        "in_stock": True,
        "tags": ["headlamp", "LED", "rechargeable", "camping", "waterproof"],
    },
    {
        "product_id": "PROD-012",
        "name": "Insulated Water Bottle",
        "description": "32 oz double-wall vacuum insulated water bottle. "
        "Keeps drinks cold 24 hours or hot 12 hours. "
        "BPA-free, leak-proof lid, fits standard cup holders.",
        "category": "accessories",
        "price": 29.99,
        "image_url": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400",
        "in_stock": False,
        "tags": ["water bottle", "insulated", "BPA-free", "hydration"],
    },
]


# =============================================================================
# Seed Functions
# =============================================================================


async def seed_orders() -> None:
    """Insert sample orders if the orders collection is empty."""
    count = await mongo.orders.count_documents({})
    if count > 0:
        logger.info("Orders collection already has %d documents — skipping seed.", count)
        return

    await mongo.orders.insert_many(SEED_ORDERS)
    logger.info("Seeded %d sample orders.", len(SEED_ORDERS))


async def seed_products() -> None:
    """
    Insert sample products into MongoDB and embed them in Qdrant.

    Only seeds if the products collection is empty.
    """
    count = await mongo.products.count_documents({})
    if count > 0:
        logger.info("Products collection already has %d documents — skipping seed.", count)
        return

    # Insert into MongoDB
    products_with_timestamps = [
        {**p, "embedded_at": datetime.utcnow()} for p in SEED_PRODUCTS
    ]
    await mongo.products.insert_many(products_with_timestamps)
    logger.info("Seeded %d products into MongoDB.", len(SEED_PRODUCTS))

    # Embed and upsert into Qdrant
    for product in SEED_PRODUCTS:
        try:
            qdrant.upsert_product(product)
        except Exception as e:
            logger.error("Failed to embed product '%s': %s", product["name"], e)

    logger.info("Embedded %d products into Qdrant.", len(SEED_PRODUCTS))


async def seed_all() -> None:
    """Run all seed functions."""
    logger.info("Starting data seed...")
    await seed_orders()
    await seed_products()
    logger.info("Data seed complete.")
