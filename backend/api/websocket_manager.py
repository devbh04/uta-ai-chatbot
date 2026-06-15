"""
WebSocket connection manager.

Manages three connection pools for real-time communication:
  1. Consumer sessions  — one WebSocket per active chat session
  2. Dashboard alerts   — broadcasts handoff notifications to all dashboard clients
  3. Chat viewers       — multiple agents can watch a single session in real-time
"""

import json
import logging
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Centralized WebSocket connection lifecycle and message routing."""

    def __init__(self) -> None:
        # session_id -> WebSocket (one consumer per session)
        self.consumer_connections: dict[str, WebSocket] = {}

        # Set of all dashboard clients listening for alerts
        self.alert_connections: set[WebSocket] = set()

        # session_id -> set of WebSockets (multiple agents can view one session)
        self.chat_viewer_connections: dict[str, set[WebSocket]] = {}

    # -------------------------------------------------------------------------
    # Consumer connections
    # -------------------------------------------------------------------------

    async def connect_consumer(self, session_id: str, websocket: WebSocket) -> None:
        """Accept and register a consumer WebSocket connection."""
        await websocket.accept()
        self.consumer_connections[session_id] = websocket
        logger.info("Consumer connected: session=%s", session_id)

    def disconnect_consumer(self, session_id: str) -> None:
        """Remove a consumer connection."""
        self.consumer_connections.pop(session_id, None)
        logger.info("Consumer disconnected: session=%s", session_id)

    async def send_to_consumer(self, session_id: str, data: dict[str, Any]) -> None:
        """Send a JSON message to a specific consumer session."""
        ws = self.consumer_connections.get(session_id)
        if ws:
            try:
                await ws.send_json(data)
            except Exception as e:
                logger.error("Failed to send to consumer %s: %s", session_id, e)
                self.disconnect_consumer(session_id)

    # -------------------------------------------------------------------------
    # Dashboard alert connections
    # -------------------------------------------------------------------------

    async def connect_alert_listener(self, websocket: WebSocket) -> None:
        """Accept and register a dashboard alert listener."""
        await websocket.accept()
        self.alert_connections.add(websocket)
        logger.info("Alert listener connected. Total: %d", len(self.alert_connections))

    def disconnect_alert_listener(self, websocket: WebSocket) -> None:
        """Remove a dashboard alert listener."""
        self.alert_connections.discard(websocket)
        logger.info("Alert listener disconnected. Total: %d", len(self.alert_connections))

    async def broadcast_alert(self, data: dict[str, Any]) -> None:
        """Broadcast a message to all connected dashboard alert listeners."""
        disconnected = set()
        for ws in self.alert_connections:
            try:
                await ws.send_json(data)
            except Exception:
                disconnected.add(ws)

        # Clean up dead connections
        for ws in disconnected:
            self.alert_connections.discard(ws)

        logger.info(
            "Broadcasted alert to %d listeners.",
            len(self.alert_connections),
        )

    # -------------------------------------------------------------------------
    # Chat viewer connections (dashboard agents watching a session)
    # -------------------------------------------------------------------------

    async def connect_chat_viewer(
        self, session_id: str, websocket: WebSocket
    ) -> None:
        """Accept and register a chat viewer for a specific session."""
        await websocket.accept()
        if session_id not in self.chat_viewer_connections:
            self.chat_viewer_connections[session_id] = set()
        self.chat_viewer_connections[session_id].add(websocket)
        logger.info("Chat viewer connected: session=%s", session_id)

    def disconnect_chat_viewer(
        self, session_id: str, websocket: WebSocket
    ) -> None:
        """Remove a chat viewer from a session."""
        viewers = self.chat_viewer_connections.get(session_id)
        if viewers:
            viewers.discard(websocket)
            if not viewers:
                del self.chat_viewer_connections[session_id]
        logger.info("Chat viewer disconnected: session=%s", session_id)

    async def broadcast_to_chat_viewers(
        self, session_id: str, data: dict[str, Any]
    ) -> None:
        """Broadcast a message to all agents viewing a specific session."""
        viewers = self.chat_viewer_connections.get(session_id, set())
        disconnected = set()

        for ws in viewers:
            try:
                await ws.send_json(data)
            except Exception:
                disconnected.add(ws)

        for ws in disconnected:
            viewers.discard(ws)


# Singleton instance
manager = ConnectionManager()
