from fastapi import APIRouter, WebSocket

router = APIRouter(prefix="/logs", tags=["logs"])


@router.get("/recent")
async def get_recent_logs():
    pass


@router.websocket("/stream")
async def logs_websocket(websocket: WebSocket):
    pass
