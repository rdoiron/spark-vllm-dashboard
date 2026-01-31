from fastapi import APIRouter

router = APIRouter(prefix="/model", tags=["model"])


@router.get("/list")
async def list_models():
    pass


@router.post("/launch")
async def launch_model():
    pass


@router.post("/stop")
async def stop_model():
    pass
