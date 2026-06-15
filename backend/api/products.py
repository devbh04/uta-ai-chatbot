"""
Products CRUD API endpoints.

Handles product creation, listing, updates, deletion,
and automatic Qdrant embedding pipeline.
"""

import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException, Query

from db.mongodb import mongo
from db.qdrant import qdrant
from models.schemas import Product, ProductCreate, ProductUpdate

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("")
async def list_products(
    category: str | None = Query(None, description="Filter by category"),
    in_stock: bool | None = Query(None, description="Filter by stock status"),
):
    """List all products with optional filtering."""
    query: dict = {}

    if category:
        query["category"] = category.lower()

    if in_stock is not None:
        query["in_stock"] = in_stock

    cursor = mongo.products.find(query, {"_id": 0}).sort("name", 1)
    products = await cursor.to_list(length=200)

    return products


@router.get("/search")
async def search_products_endpoint(
    query: str = Query(..., description="Search query for semantic product search"),
    limit: int = Query(5, ge=1, le=20),
):
    """
    Semantic search over the product catalog via Qdrant.

    Returns products ranked by similarity. Falls back to nearest
    matches if no results exceed the relevance threshold.
    """
    # Try threshold-based search first
    results = qdrant.search_products(query, limit=limit, score_threshold=0.55)

    if results:
        return {"results": results, "match_type": "exact"}

    # Fallback: return nearest matches regardless of score
    nearest = qdrant.get_nearest_products(query, limit=min(limit, 3))
    return {"results": nearest, "match_type": "nearest"}


@router.get("/{product_id}")
async def get_product(product_id: str):
    """Get a single product by its ID."""
    product = await mongo.products.find_one(
        {"product_id": product_id},
        {"_id": 0},
    )

    if not product:
        raise HTTPException(status_code=404, detail=f"Product '{product_id}' not found.")

    return product


@router.post("", response_model=dict)
async def create_product(body: ProductCreate):
    """
    Create a new product.

    Generates a unique product ID, stores in MongoDB, then embeds
    and upserts into Qdrant for semantic search.
    """
    product_id = f"PROD-{uuid.uuid4().hex[:6].upper()}"

    product = Product(
        product_id=product_id,
        name=body.name,
        description=body.description,
        category=body.category.lower(),
        price=body.price,
        image_url=body.image_url,
        in_stock=body.in_stock,
        tags=body.tags,
        embedded_at=datetime.utcnow(),
    )

    product_dict = product.model_dump()

    # Store in MongoDB
    await mongo.products.insert_one(product_dict)

    # Embed and upsert into Qdrant
    try:
        qdrant.upsert_product(product_dict)
    except Exception as e:
        # Product is in MongoDB but Qdrant embed failed — log but don't fail
        # Admin can re-embed later
        import logging
        logging.getLogger(__name__).error(
            "Failed to embed product '%s': %s", product_id, e
        )

    return {"product_id": product_id, "name": body.name}


@router.put("/{product_id}")
async def update_product(product_id: str, body: ProductUpdate):
    """
    Update product fields (partial update).

    If name, description, or tags change, the product is automatically
    re-embedded in Qdrant.
    """
    update_data = body.model_dump(exclude_none=True)

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update.")

    # Check if re-embedding is needed
    re_embed_fields = {"name", "description", "tags", "category"}
    needs_re_embed = bool(re_embed_fields & set(update_data.keys()))

    if needs_re_embed:
        update_data["embedded_at"] = datetime.utcnow()

    result = await mongo.products.update_one(
        {"product_id": product_id},
        {"$set": update_data},
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail=f"Product '{product_id}' not found.")

    # Re-embed in Qdrant if needed
    if needs_re_embed:
        updated_product = await mongo.products.find_one(
            {"product_id": product_id},
            {"_id": 0},
        )
        if updated_product:
            try:
                qdrant.upsert_product(updated_product)
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(
                    "Failed to re-embed product '%s': %s", product_id, e
                )

    return {
        "product_id": product_id,
        "updated_fields": list(update_data.keys()),
        "re_embedded": needs_re_embed,
    }


@router.delete("/{product_id}")
async def delete_product(product_id: str):
    """Delete a product from both MongoDB and Qdrant."""
    result = await mongo.products.delete_one({"product_id": product_id})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=f"Product '{product_id}' not found.")

    # Remove from Qdrant
    try:
        qdrant.delete_product(product_id)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(
            "Failed to delete product '%s' from Qdrant: %s", product_id, e
        )

    return {"product_id": product_id, "deleted": True}
