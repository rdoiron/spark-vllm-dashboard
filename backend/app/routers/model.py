from fastapi import APIRouter, HTTPException, status

from app.services.vllm_service import vllm_service
from app.models.vllm import ModelLaunchConfig, ModelStatus, LaunchResult, RunningConfig

router = APIRouter(prefix="/model", tags=["model"])


@router.post("/launch", response_model=LaunchResult)
async def launch_model(config: ModelLaunchConfig):
    return await vllm_service.launch_model(config)


@router.post("/stop", response_model=LaunchResult)
async def stop_model():
    return await vllm_service.stop_model()


@router.get("/status", response_model=ModelStatus)
async def get_model_status():
    return await vllm_service.get_model_status()


@router.get("/running-config", response_model=RunningConfig)
async def get_running_config():
    config = await vllm_service.get_running_config()
    if config is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No model is currently running",
        )
    return config


@router.get("/list")
async def list_models():
    available_models = [
        {
            "id": "THUDM/glm-4-7b-chat-awq",
            "name": "GLM-4.7B-AWQ",
            "description": "GLM-4 7B quantized with AWQ",
            "quantization": "AWQ",
            "estimated_memory": "48GB",
        },
        {
            "id": "MiniMaxAI/MiniMax-M2.1-AWQ",
            "name": "MiniMax-M2.1-AWQ",
            "description": "MiniMax M2.1 model quantized with AWQ",
            "quantization": "AWQ",
            "estimated_memory": "48GB",
        },
    ]
    return {"models": available_models}
