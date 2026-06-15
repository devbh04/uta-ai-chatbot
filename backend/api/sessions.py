"""
Session management API endpoints.

Handles chat session CRUD, takeover, and resolution.
"""

import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException

from db.mongodb import mongo
from models.schemas import (
    ChatSession,
    SessionCreate,
    SessionStatus,
    TakeoverRequest,
)

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.post("", response_model=dict)
async def create_session(body: SessionCreate):
    """
    Create a new chat session.

    Called when a consumer starts chatting. Generates a unique session ID
    and stores the session in MongoDB.
    """
    session_id = f"SES-{uuid.uuid4().hex[:8].upper()}"

    session = ChatSession(
        session_id=session_id,
        consumer_name=body.consumer_name,
        status=SessionStatus.ACTIVE,
        started_at=datetime.utcnow(),
        messages=[],
    )

    await mongo.sessions.insert_one(session.model_dump())

    return {"session_id": session_id, "consumer_name": body.consumer_name}


@router.get("")
async def list_sessions():
    """
    List all chat sessions for the dashboard.

    Returns sessions sorted by most recent first, with a computed
    duration field for display.
    """
    cursor = mongo.sessions.find(
        {},
        {"_id": 0},
    ).sort("started_at", -1)

    sessions = await cursor.to_list(length=100)

    # Add duration field for dashboard display
    now = datetime.utcnow()
    for session in sessions:
        started = session.get("started_at", now)
        if isinstance(started, datetime):
            delta = now - started
            minutes = int(delta.total_seconds() // 60)
            session["duration_minutes"] = minutes

    return sessions


@router.get("/{session_id}")
async def get_session(session_id: str):
    """Get a single session with full message history."""
    session = await mongo.sessions.find_one(
        {"session_id": session_id},
        {"_id": 0},
    )

    if not session:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")

    return session


@router.patch("/{session_id}/takeover")
async def takeover_session(session_id: str, body: TakeoverRequest):
    """
    Agent takes over a handed-off session.

    Updates the session status to TAKEN_OVER and records the agent name.
    Only allowed when session status is HANDED_OFF.
    """
    session = await mongo.sessions.find_one({"session_id": session_id})

    if not session:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")

    if session["status"] != SessionStatus.HANDED_OFF.value:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot take over session in '{session['status']}' status. "
            f"Session must be in 'handed_off' status.",
        )

    await mongo.sessions.update_one(
        {"session_id": session_id},
        {
            "$set": {
                "status": SessionStatus.TAKEN_OVER.value,
                "assigned_agent": body.agent_name,
            }
        },
    )

    return {
        "session_id": session_id,
        "status": SessionStatus.TAKEN_OVER.value,
        "assigned_agent": body.agent_name,
    }


@router.patch("/{session_id}/resolve")
async def resolve_session(session_id: str):
    """Mark a session as resolved."""
    result = await mongo.sessions.update_one(
        {"session_id": session_id},
        {"$set": {"status": SessionStatus.RESOLVED.value}},
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")

    return {"session_id": session_id, "status": SessionStatus.RESOLVED.value}
