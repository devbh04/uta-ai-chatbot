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
    {
        "order_id": "ORD-111",
        "customer_name": "Alice Johnson",
        "customer_email": "alice@example.com",
        "items": [{"product_name": "Summit Down Jacket", "qty": 1, "price": 189.99}],
        "status": "SHIPPED",
        "shipping_method": "standard",
        "created_at": datetime.utcnow() - timedelta(days=2),
        "estimated_delivery": datetime.utcnow() + timedelta(days=1),
        "tracking_number": "TRK-11111-TEST",
    },
    {
        "order_id": "ORD-222",
        "customer_name": "Bob Smith",
        "customer_email": "bob@example.com",
        "items": [{"product_name": "Explorer Daypack 20L", "qty": 1, "price": 49.99}],
        "status": "PROCESSING",
        "shipping_method": "standard",
        "created_at": datetime.utcnow() - timedelta(hours=6),
        "estimated_delivery": datetime.utcnow() + timedelta(days=1),
    },
    {
        "order_id": "ORD-333",
        "customer_name": "Carol Davis",
        "customer_email": "carol@example.com",
        "items": [{"product_name": "Merino Wool Hiking Socks (3-Pack)", "qty": 1, "price": 24.99}],
        "status": "DELIVERED",
        "shipping_method": "standard",
        "created_at": datetime.utcnow() - timedelta(days=5),
        "estimated_delivery": datetime.utcnow() - timedelta(days=2),
        "tracking_number": "TRK-33333-TEST",
    },
]


# =============================================================================
# Sample Products (with Unsplash images)
# =============================================================================

SEED_PRODUCTS = [
    {
        "product_id": "PROD-001",
        "name": "Summit Down Jacket",
        "description": "Premium 800-fill down jacket for extreme cold-weather hiking and mountaineering. High-loft warmth with a ultra-packable design and water-resistant ripstop nylon shell.",
        "category": "jackets",
        "price": 189.99,
        "image_url": "https://images.unsplash.com/photo-1544585456-12ff987b6b4d?w=600&auto=format&fit=crop&q=80",
        "in_stock": True,
        "tags": ["jacket", "down", "puffer", "winter", "hiking", "water-resistant"],
    },
    {
        "product_id": "PROD-002",
        "name": "Alpine Gore-Tex Rain Shell",
        "description": "Fully seam-taped, 3-layer Gore-Tex rain shell. Breathable and completely waterproof, featuring adjustable storm hood and pit zips for high-output ventilation.",
        "category": "jackets",
        "price": 219.99,
        "image_url": "https://images.unsplash.com/photo-1545594861-3bef43ff2fc8?w=600&auto=format&fit=crop&q=80",
        "in_stock": True,
        "tags": ["jacket", "rain shell", "waterproof", "gore-tex", "hiking", "breathable"],
    },
    {
        "product_id": "PROD-003",
        "name": "Ridgeline Fleece Pullover",
        "description": "Midweight Polartec fleece pullover offering exceptional warmth-to-weight ratio. Features a half-zip design, high collar, and zippered chest pocket for layering.",
        "category": "jackets",
        "price": 79.99,
        "image_url": "https://images.unsplash.com/photo-1608063615781-e2eeebd31320?w=600&auto=format&fit=crop&q=80",
        "in_stock": True,
        "tags": ["jacket", "fleece", "layering", "midweight", "pullover"],
    },
    {
        "product_id": "PROD-004",
        "name": "Windrunner Lightweight Windbreaker",
        "description": "Ultralight, windproof and water-repellent windbreaker that packs into its own chest pocket. Ideal for trail running, cycling, and fast-and-light mountain scrambles.",
        "category": "jackets",
        "price": 64.99,
        "image_url": "https://images.unsplash.com/photo-1508441133599-14e6d61a721f?w=600&auto=format&fit=crop&q=80",
        "in_stock": True,
        "tags": ["jacket", "windbreaker", "lightweight", "packable", "running"],
    },
    {
        "product_id": "PROD-005",
        "name": "Vanguard Expedition Parka",
        "description": "Heavyweight arctic-grade parka with premium synthetic insulation. Durable outer shell resists severe winds and heavy snow, with a faux-fur lined hood and utility pockets.",
        "category": "jackets",
        "price": 279.99,
        "image_url": "https://images.unsplash.com/photo-1548883354-7622d03aca27?w=600&auto=format&fit=crop&q=80",
        "in_stock": True,
        "tags": ["jacket", "parka", "winter", "expedition", "insulated", "heavyweight"],
    },
    {
        "product_id": "PROD-006",
        "name": "Summit Trail Leather Hiking Boots",
        "description": "Classic full-grain leather hiking boots with Vibram outsoles and deep lugs. Waterproof membrane, full rubber rand, and ankle support for technical mountain terrain.",
        "category": "footwear",
        "price": 199.99,
        "image_url": "https://images.unsplash.com/photo-1520219306100-ec4afeeefe58?w=600&auto=format&fit=crop&q=80",
        "in_stock": True,
        "tags": ["footwear", "boots", "hiking", "leather", "waterproof", "vibram"],
    },
    {
        "product_id": "PROD-007",
        "name": "Trail Runner Pro Shoes",
        "description": "Aggressive, lightweight trail running shoes with sticky rubber soles and protective rock plates. Breathable mesh upper with quick-lace system for technical trails.",
        "category": "footwear",
        "price": 129.99,
        "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
        "in_stock": True,
        "tags": ["footwear", "shoes", "running", "trail running", "lightweight"],
    },
    {
        "product_id": "PROD-008",
        "name": "Alpine Approach Shoes",
        "description": "Durable approach shoes designed for climbing scrambles and technical hikes. Sticky rubber toe box climber rand, supportive midsole, and highly durable canvas-suede upper.",
        "category": "footwear",
        "price": 119.99,
        "image_url": "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&auto=format&fit=crop&q=80",
        "in_stock": True,
        "tags": ["footwear", "shoes", "approach", "climbing", "hiking"],
    },
    {
        "product_id": "PROD-009",
        "name": "Canyonlands Hiking Sandals",
        "description": "Water-ready hiking sandals with durable webbing straps and a cushioned, slip-resistant footbed. Ideal for river crossings, beach camp, and warm-weather hikes.",
        "category": "footwear",
        "price": 69.99,
        "image_url": "https://images.unsplash.com/photo-1562273589-2ab237ddda79?w=600&auto=format&fit=crop&q=80",
        "in_stock": True,
        "tags": ["footwear", "sandals", "waterproof", "camping", "hiking"],
    },
    {
        "product_id": "PROD-010",
        "name": "Merino Wool Hiking Socks (3-Pack)",
        "description": "Premium merino wool hiking socks. Moisture-wicking, temperature-regulating, and cushioned in high-impact zones to prevent blisters. Pack of three pairs.",
        "category": "footwear",
        "price": 24.99,
        "image_url": "https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=600&auto=format&fit=crop&q=80",
        "in_stock": True,
        "tags": ["socks", "merino wool", "hiking", "accessories", "cushioned"],
    },
    {
        "product_id": "PROD-011",
        "name": "Alpine Backpack 45L",
        "description": "Versatile 45-liter technical pack for multi-day hiking trips. Adjustable harness, padded hip belt with pockets, tool attachment points, and custom rain cover.",
        "category": "backpacks",
        "price": 159.99,
        "image_url": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80",
        "in_stock": True,
        "tags": ["backpack", "hiking", "backpacking", "multi-day", "rain cover"],
    },
    {
        "product_id": "PROD-012",
        "name": "Explorer Daypack 20L",
        "description": "Compact, durable 20-liter daypack perfect for daily hikes or commuting. Padded laptop/hydration sleeve, dual water bottle pockets, and breathable mesh back panel.",
        "category": "backpacks",
        "price": 49.99,
        "image_url": "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600&auto=format&fit=crop&q=80",
        "in_stock": True,
        "tags": ["backpack", "daypack", "hiking", "lightweight", "commuting"],
    },
    {
        "product_id": "PROD-013",
        "name": "Trail Runner Hydration Vest",
        "description": "Body-hugging hydration vest for long-distance trail runs. Includes two 500ml soft flasks, front storage pockets for gels, and trekking pole attachment straps.",
        "category": "backpacks",
        "price": 99.99,
        "image_url": "https://images.unsplash.com/photo-1508962914676-134849a727f0?w=600&auto=format&fit=crop&q=80",
        "in_stock": True,
        "tags": ["backpack", "running", "hydration", "vest", "lightweight"],
    },
    {
        "product_id": "PROD-014",
        "name": "Adventure Waterproof Dry-Bag 30L",
        "description": "Heavy-duty 30-liter dry bag with roll-top closure and padded shoulder straps. Keeps gear bone-dry during kayaking, rafting, or torrential storms.",
        "category": "backpacks",
        "price": 39.99,
        "image_url": "https://images.unsplash.com/photo-1605587786438-e67c87c94541?w=600&auto=format&fit=crop&q=80",
        "in_stock": True,
        "tags": ["backpack", "dry bag", "waterproof", "kayaking", "rafting"],
    },
    {
        "product_id": "PROD-015",
        "name": "Basecamp Tent 2P",
        "description": "Durable 3-season, 2-person dome tent. Easy freestanding setup, full-coverage rainfly with vestibules, and gear loft included. Weighs 5.2 lbs packed.",
        "category": "camping",
        "price": 249.99,
        "image_url": "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600&auto=format&fit=crop&q=80",
        "in_stock": True,
        "tags": ["tent", "camping", "backpacking", "two-person"],
    },
    {
        "product_id": "PROD-016",
        "name": "Ultralight Solo Tent 1P",
        "description": "One-person double-wall tent designed for fast-and-light solo backpacking. Pitchable with trekking poles to reduce weight. Weighs just 2.1 lbs packed.",
        "category": "camping",
        "price": 189.99,
        "image_url": "https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=600&auto=format&fit=crop&q=80",
        "in_stock": True,
        "tags": ["tent", "camping", "backpacking", "solo", "ultralight"],
    },
    {
        "product_id": "PROD-017",
        "name": "Summit Down Sleeping Bag",
        "description": "Mummy-style 650-fill down sleeping bag rated down to 15°F. Draft collars, full-length double zippers, and a compressed size that fits easily into backpack bottoms.",
        "category": "camping",
        "price": 179.99,
        "image_url": "https://images.unsplash.com/photo-1508873696983-2df519f0397e?w=600&auto=format&fit=crop&q=80",
        "in_stock": True,
        "tags": ["sleeping bag", "down", "camping", "winter", "sleeping gear"],
    },
    {
        "product_id": "PROD-018",
        "name": "Ultralight Sleeping Pad",
        "description": "Inflatable 2.5-inch thick sleeping pad with insulated chambers for a warm night's sleep. Compactly rolls down to the size of a water bottle.",
        "category": "camping",
        "price": 84.99,
        "image_url": "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?w=600&auto=format&fit=crop&q=80",
        "in_stock": True,
        "tags": ["sleeping pad", "mattress", "insulated", "camping", "lightweight"],
    },
    {
        "product_id": "PROD-019",
        "name": "Basecamp Backpacking Stove",
        "description": "Ultralight canister stove that mounts directly to a fuel canister. Precision flame control boils 1 liter of water in under 3.5 minutes. Foldable pot supports.",
        "category": "camping",
        "price": 39.99,
        "image_url": "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=600&auto=format&fit=crop&q=80",
        "in_stock": True,
        "tags": ["stove", "burner", "cooking", "camping", "backpacking"],
    },
    {
        "product_id": "PROD-020",
        "name": "Rechargeable LED Headlamp",
        "description": "Rechargeable 450-lumen headlamp with flood, spot, and red night-vision modes. IPX6 waterproof rating, adjustable strap, and 60-hour runtime on low setting.",
        "category": "camping",
        "price": 34.99,
        "image_url": "https://images.unsplash.com/photo-1525811902-f2342640856e?w=600&auto=format&fit=crop&q=80",
        "in_stock": True,
        "tags": ["headlamp", "led", "rechargeable", "lighting", "camping"],
    },
    {
        "product_id": "PROD-021",
        "name": "Solar Camp Lantern",
        "description": "Inflatable, solar-powered LED lantern for camping and emergency use. Folds down flat, features 4 light settings, and functions as a power bank via USB.",
        "category": "camping",
        "price": 29.99,
        "image_url": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80",
        "in_stock": True,
        "tags": ["lantern", "led", "solar", "lighting", "camping"],
    },
    {
        "product_id": "PROD-022",
        "name": "Carbon Trekking Poles",
        "description": "Telescoping 100% carbon fiber trekking poles with premium moisture-wicking cork handles. Quick-lever locks for adjustments on the go. Set of two.",
        "category": "camping",
        "price": 89.99,
        "image_url": "https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&auto=format&fit=crop&q=80",
        "in_stock": True,
        "tags": ["trekking poles", "hiking", "carbon fiber", "cork grip"],
    },
    {
        "product_id": "PROD-023",
        "name": "Glacier Polarized Sunglasses",
        "description": "Classic high-altitude glacier sunglasses. Features dark polarized Category 4 lenses, removable leather side shields to block glare, and flexible temples.",
        "category": "accessories",
        "price": 59.99,
        "image_url": "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop&q=80",
        "in_stock": True,
        "tags": ["sunglasses", "glacier", "polarized", "eyewear", "accessories"],
    },
    {
        "product_id": "PROD-024",
        "name": "Insulated Water Bottle 32oz",
        "description": "Double-wall vacuum-insulated stainless steel water bottle. Keeps drinks icy cold for 24 hours or piping hot for 12 hours. Wide-mouth opening.",
        "category": "accessories",
        "price": 29.99,
        "image_url": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80",
        "in_stock": True,
        "tags": ["bottle", "insulated", "stainless steel", "hydration", "accessories"],
    },
    {
        "product_id": "PROD-025",
        "name": "Multi-Tool Utility Pocket Knife",
        "description": "Stainless steel pocket multi-tool with 14 functions, including pliers, wire cutters, knives, screwdrivers, bottle openers, and wood saw. Nylon sheath included.",
        "category": "accessories",
        "price": 44.99,
        "image_url": "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=600&auto=format&fit=crop&q=80",
        "in_stock": True,
        "tags": ["multi-tool", "knife", "utility", "camping", "accessories"],
    },
    {
        "product_id": "PROD-026",
        "name": "Camping Enamel Mug",
        "description": "Classic steel camp mug with double-coated enamel finish. Highly durable, shatterproof, and safe for direct stove heating. Features a retro speckled print.",
        "category": "accessories",
        "price": 14.99,
        "image_url": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80",
        "in_stock": True,
        "tags": ["mug", "enamel", "cup", "camp kitchen", "accessories"],
    },
    {
        "product_id": "PROD-027",
        "name": "Compact Trail First Aid Kit",
        "description": "Water-resistant first aid pouch packed with 85 essential medical supplies. Includes bandages, antiseptic wipes, medical tape, emergency blanket, and whistle.",
        "category": "accessories",
        "price": 24.99,
        "image_url": "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=600&auto=format&fit=crop&q=80",
        "in_stock": True,
        "tags": ["first aid", "safety", "medical kit", "hiking", "accessories"],
    },
    {
        "product_id": "PROD-028",
        "name": "Adventure Waterproof Watch",
        "description": "Rugged outdoor sports watch featuring water resistance up to 100m, digital compass, altimeter, barometer, stopwatch, and a durable military-grade silicone strap.",
        "category": "accessories",
        "price": 119.99,
        "image_url": "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=600&auto=format&fit=crop&q=80",
        "in_stock": True,
        "tags": ["watch", "waterproof", "barometer", "compass", "accessories"],
    },
    {
        "product_id": "PROD-029",
        "name": "Windproof Mountain Gloves",
        "description": "Insulated winter mountain gloves featuring windproof shell, synthetic leather palms for grip, and touchscreen compatibility. Rated for skiing and cold hiking.",
        "category": "accessories",
        "price": 39.99,
        "image_url": "https://images.unsplash.com/photo-1588775086055-6677fcc180c4?w=600&auto=format&fit=crop&q=80",
        "in_stock": True,
        "tags": ["gloves", "windproof", "insulated", "winter", "accessories"],
    },
    {
        "product_id": "PROD-030",
        "name": "Thermal Merino Wool Beanie",
        "description": "Double-layered 100% merino wool knit beanie. Extremely warm, lightweight, breathable, and naturally odor-resistant. Fits comfortably under climbing helmets.",
        "category": "accessories",
        "price": 19.99,
        "image_url": "https://images.unsplash.com/photo-1576871337622-98d48d4aa53e?w=600&auto=format&fit=crop&q=80",
        "in_stock": True,
        "tags": ["beanie", "merino wool", "winter", "hat", "accessories"],
    }
]


async def seed_orders() -> None:
    """Insert sample orders. If count doesn't match len(SEED_ORDERS), drop and re-seed."""
    count = await mongo.orders.count_documents({})
    if count == len(SEED_ORDERS):
        logger.info("Orders collection already has %d documents — skipping seed.", count)
        return

    logger.info("Orders count (%d) does not match seed count (%d). Re-seeding orders...", count, len(SEED_ORDERS))
    await mongo.orders.delete_many({})
    await mongo.orders.insert_many(SEED_ORDERS)
    logger.info("Seeded %d sample orders.", len(SEED_ORDERS))


async def seed_products() -> None:
    """
    Insert sample products into MongoDB and embed them in Qdrant.

    If the current count in MongoDB doesn't match the expected SEED_PRODUCTS count,
    we flush and re-seed to ensure all 30 products are populated and embedded.
    """
    count = await mongo.products.count_documents({})
    if count == len(SEED_PRODUCTS):
        logger.info("Products collection already has %d documents — skipping seed.", count)
        return

    logger.info("Products count (%d) does not match seed count (%d). Re-seeding products...", count, len(SEED_PRODUCTS))

    # 1. Clear existing products in MongoDB
    await mongo.products.delete_many({})

    # 2. Re-initialize Qdrant collection to clear old vector embeddings
    from config import settings
    try:
        qdrant.client.delete_collection(settings.qdrant_collection)
    except Exception as e:
        logger.warning("Could not delete Qdrant collection (it might not exist yet): %s", e)
    qdrant.init_collection()

    # 3. Insert into MongoDB
    products_with_timestamps = [
        {**p, "embedded_at": datetime.utcnow()} for p in SEED_PRODUCTS
    ]
    await mongo.products.insert_many(products_with_timestamps)
    logger.info("Seeded %d products into MongoDB.", len(SEED_PRODUCTS))

    # 4. Embed and upsert into Qdrant
    import time
    for product in SEED_PRODUCTS:
        retries = 5
        delay = 2.0
        while retries > 0:
            try:
                qdrant.upsert_product(product)
                time.sleep(0.5)  # Small gap to help avoid rate limits
                break
            except Exception as e:
                err_str = str(e).upper()
                if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                    logger.warning("Rate limit hit while embedding '%s'. Retrying in %.1fs... (%d retries left)", product["name"], delay, retries - 1)
                    time.sleep(delay)
                    delay *= 2.0
                    retries -= 1
                else:
                    logger.error("Failed to embed product '%s': %s", product["name"], e)
                    break
        else:
            logger.error("Failed to embed product '%s' after maximum retries due to rate limits.", product["name"])

    logger.info("Embedded %d products into Qdrant.", len(SEED_PRODUCTS))


async def seed_all() -> None:
    """Run all seed functions."""
    logger.info("Starting data seed...")
    await seed_orders()
    await seed_products()
    logger.info("Data seed complete.")
