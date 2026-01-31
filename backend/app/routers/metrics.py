from fastapi import APIRouter, WebSocket

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("/current")
async def get_current_metrics():
    pass


@router.websocket("/stream")
async def metrics_websocket(websocket: WebSocket):
    pass
