import asyncio
import os
import time
from typing import Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware

from sensor_generator import generate_frame

app = FastAPI(title="Digital Twin API")

# CORS_ORIGINS env var: comma-separated list of allowed origins, or "*" (default)
_cors_raw = os.getenv("CORS_ORIGINS", "*")
_allowed_origins: list[str] = [o.strip() for o in _cors_raw.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Fault injection state ────────────────────────────────────────────────────
_fault_type: str | None = None   # 'bearing' | 'alignment' | 'motor' | None
_fault_expires: float = 0.0      # monotonic time when the timed fault ends


def _active_fault() -> str | None:
    global _fault_type, _fault_expires
    if _fault_type and _fault_expires > 0 and time.monotonic() > _fault_expires:
        _fault_type = None
    return _fault_type


# ─── Maintenance flags (in-memory) ───────────────────────────────────────────
_flags: list[dict[str, Any]] = []


# ─── REST endpoints ───────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/fault-injection")
def get_fault():
    ft = _active_fault()
    remaining = max(0.0, _fault_expires - time.monotonic()) if ft and _fault_expires > 0 else None
    return {"faultType": ft, "remainingSeconds": round(remaining, 1) if remaining else None}


@app.post("/fault-injection/{value}")
def set_fault(value: str):
    """Accepts: 'bearing' | 'alignment' | 'motor' (60 s timed),
               'true' / 'false' (legacy toggle — maps to bearing fault / off),
               'off' to clear."""
    global _fault_type, _fault_expires
    timed_types = {"bearing", "alignment", "motor"}
    if value in ("false", "off", "0"):
        _fault_type = None
        _fault_expires = 0.0
    elif value in ("true", "1"):
        _fault_type = "bearing"
        _fault_expires = 0.0          # no auto-expiry for legacy toggle
    elif value in timed_types:
        _fault_type = value
        _fault_expires = time.monotonic() + 60.0
    return {"faultType": _fault_type}


@app.get("/api/maintenance-flags")
def get_flags():
    return {"flags": _flags}


@app.post("/api/maintenance-flags")
async def post_flag(request: Request):
    body = await request.json()
    flag = {
        "id": f"flag-{len(_flags) + 1}",
        "componentId": body.get("componentId", ""),
        "sensor": body.get("sensor", ""),
        "timestamp": body.get("timestamp", ""),
        "createdAt": time.time(),
    }
    _flags.append(flag)
    return {"success": True, "flag": flag}


# ─── WebSocket streaming ──────────────────────────────────────────────────────

async def _stream(websocket: WebSocket) -> None:
    await websocket.accept()
    start = time.monotonic()
    try:
        while True:
            elapsed = time.monotonic() - start
            frame = generate_frame(fault_type=_active_fault(), elapsed=elapsed)
            await websocket.send_text(frame.model_dump_json())
            await asyncio.sleep(1.0)
    except WebSocketDisconnect:
        pass


@app.websocket("/ws/telemetry")
async def telemetry_ws(websocket: WebSocket):
    await _stream(websocket)


@app.websocket("/ws/conveyor-01")
async def conveyor_01_ws(websocket: WebSocket):
    await _stream(websocket)
