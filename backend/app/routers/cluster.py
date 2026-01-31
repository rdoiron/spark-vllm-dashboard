from fastapi import APIRouter

router = APIRouter(prefix="/cluster", tags=["cluster"])


@router.get("/status")
async def get_cluster_status():
    pass


@router.post("/start")
async def start_cluster():
    pass


@router.post("/stop")
async def stop_cluster():
    pass
