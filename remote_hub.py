import asyncio
import base64
import json
import logging
import os
import time
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional, Set
from fastapi import WebSocket

logger = logging.getLogger("EduBoard.RemoteHub")

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
SLIDES_DIR = DATA_DIR / "slides"
STATE_FILE = DATA_DIR / "remote_state.json"

DATA_DIR.mkdir(parents=True, exist_ok=True)
SLIDES_DIR.mkdir(parents=True, exist_ok=True)

DEFAULT_STATE: Dict[str, Any] = {
    "mode": "normal",  # normal | slideshow | browser | cast | alert | standby
    "frozenClass": None,
    "images": [],
    "slideIntervalMs": 8000,
    "browserUrl": "",
    "alertMessage": "",
    "alertLevel": "critical",
    "autoRevertSeconds": None,
    "revertAt": None,
    "tvPower": True,
    "updatedAt": time.time(),
}


class RemoteHub:
    def __init__(self):
        self.state: Dict[str, Any] = dict(DEFAULT_STATE)
        self.displays: Set[WebSocket] = set()
        self.controllers: Set[WebSocket] = set()
        self._load_state()

    def _load_state(self):
        if STATE_FILE.exists():
            try:
                with open(STATE_FILE, "r", encoding="utf-8") as f:
                    saved = json.load(f)
                    self.state.update(saved)
                    # Reset non-persistent live modes like cast or alert on startup
                    if self.state.get("mode") in ("cast", "alert"):
                        self.state["mode"] = "normal"
            except Exception as exc:
                logger.warning(f"Failed to load remote_state.json: {exc}")

    def _save_state(self):
        try:
            with open(STATE_FILE, "w", encoding="utf-8") as f:
                json.dump(self.state, f, indent=2, ensure_ascii=False)
        except Exception as exc:
            logger.warning(f"Failed to save remote_state.json: {exc}")

    def verify_auth(self, token: Optional[str]) -> bool:
        if not token:
            return False
        clean_token = token.strip()
        # Check against ADMIN_PIN or EduPage PASSWORD
        configured_pin = os.getenv("ADMIN_PIN", "").strip()
        configured_pwd = os.getenv("PASSWORD", "").strip()

        # If neither is set, fallback to default safe PIN 1234
        if not configured_pin and not configured_pwd:
            return clean_token in ("1234", "admin")

        valid_tokens = [t for t in (configured_pin, configured_pwd) if t]
        return clean_token in valid_tokens

    async def connect_display(self, websocket: WebSocket):
        await websocket.accept()
        self.displays.add(websocket)
        logger.info(f"Kiosk display connected via WebSocket. Active displays: {len(self.displays)}")
        # Send initial state immediately
        await websocket.send_json({"type": "state", "data": self.state})

    def disconnect_display(self, websocket: WebSocket):
        self.displays.discard(websocket)
        logger.info(f"Kiosk display disconnected. Remaining displays: {len(self.displays)}")

    async def connect_controller(self, websocket: WebSocket):
        await websocket.accept()
        self.controllers.add(websocket)
        logger.info(f"Admin controller connected via WebSocket. Active controllers: {len(self.controllers)}")
        await websocket.send_json({
            "type": "state",
            "data": self.state,
            "connectedDisplays": len(self.displays),
        })

    def disconnect_controller(self, websocket: WebSocket):
        self.controllers.discard(websocket)

    async def broadcast_state(self):
        self.state["updatedAt"] = time.time()
        self._save_state()

        payload = {"type": "state", "data": self.state, "connectedDisplays": len(self.displays)}
        dead_displays = set()
        for ws in self.displays:
            try:
                await ws.send_json(payload)
            except Exception:
                dead_displays.add(ws)
        self.displays -= dead_displays

        dead_controllers = set()
        for ws in self.controllers:
            try:
                await ws.send_json(payload)
            except Exception:
                dead_controllers.add(ws)
        self.controllers -= dead_controllers

    async def update_state(self, updates: Dict[str, Any]) -> Dict[str, Any]:
        # Handle auto-revert timer calculation
        auto_revert = updates.get("autoRevertSeconds")
        if auto_revert and int(auto_revert) > 0:
            updates["revertAt"] = time.time() + int(auto_revert)
        elif "autoRevertSeconds" in updates and not updates["autoRevertSeconds"]:
            updates["revertAt"] = None

        self.state.update(updates)
        await self.broadcast_state()
        return self.state

    async def relay_webrtc_signal(self, sender_ws: WebSocket, message: dict):
        """Relay WebRTC offer/answer/candidate between controller and kiosk display."""
        target_group = self.displays if sender_ws in self.controllers else self.controllers
        dead_sockets = set()
        for ws in target_group:
            try:
                await ws.send_json({"type": "webrtc_signal", "data": message.get("data")})
            except Exception:
                dead_sockets.add(ws)
        target_group -= dead_sockets

    def save_slide_image(self, b64_data: str, caption: str = "") -> dict:
        """Decode base64 image and save to data/slides/."""
        if "," in b64_data:
            header, b64_data = b64_data.split(",", 1)
            ext = "jpg"
            if "png" in header:
                ext = "png"
            elif "webp" in header:
                ext = "webp"
            elif "gif" in header:
                ext = "gif"
        else:
            ext = "jpg"

        file_id = str(uuid.uuid4())[:8]
        filename = f"slide_{file_id}.{ext}"
        filepath = SLIDES_DIR / filename

        img_bytes = base64.b64decode(b64_data)
        with open(filepath, "wb") as f:
            f.write(img_bytes)

        item = {
            "id": file_id,
            "filename": filename,
            "url": f"/api/remote/slides/{filename}",
            "caption": caption.strip(),
            "createdAt": time.time(),
        }

        images = self.state.get("images", [])
        images.append(item)
        self.state["images"] = images
        self._save_state()
        return item

    def delete_slide_image(self, image_id: str) -> bool:
        images = self.state.get("images", [])
        to_remove = [img for img in images if img.get("id") == image_id]
        if not to_remove:
            return False

        for img in to_remove:
            filename = img.get("filename")
            if filename:
                fpath = SLIDES_DIR / filename
                if fpath.exists():
                    try:
                        fpath.unlink()
                    except Exception as e:
                        logger.warning(f"Could not delete slide file {filename}: {e}")

        self.state["images"] = [img for img in images if img.get("id") != image_id]
        self._save_state()
        return True

    async def check_auto_revert(self):
        """Background watchdog: automatically reverts temporary modes to timetable when timer expires."""
        revert_at = self.state.get("revertAt")
        mode = self.state.get("mode")
        if revert_at and mode != "normal":
            if time.time() >= revert_at:
                logger.info(f"Auto-revert timer expired. Returning kiosk from {mode} to normal timetable.")
                self.state["mode"] = "normal"
                self.state["revertAt"] = None
                self.state["autoRevertSeconds"] = None
                await self.broadcast_state()


remote_hub = RemoteHub()
