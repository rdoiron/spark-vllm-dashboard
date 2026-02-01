import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, status

from app.services.inventory_service import inventory_service
from app.models.inventory import (
    LocalModel,
    DownloadStatus,
    DownloadRequest,
    DownloadResponse,
    DeleteResponse,
    DistributeResponse,
    ModelListResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/models", tags=["models"])


@router.get("", response_model=ModelListResponse)
async def list_models():
    models = await inventory_service.list_local_models()
    total_size = sum(m.size_gb for m in models)
    return ModelListResponse(
        models=models,
        total_count=len(models),
        total_size_gb=round(total_size, 2),
    )


@router.get("/{model_id}", response_model=LocalModel)
async def get_model(model_id: str):
    model = await inventory_service.get_model_info(model_id)
    if model is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Model {model_id} not found in local inventory",
        )
    return model


@router.post("/download", response_model=DownloadResponse)
async def download_model(request: DownloadRequest):
    if not request.model_id or not request.model_id.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Model ID is required",
        )

    result = await inventory_service.download_model(
        request.model_id,
        distribute=request.distribute,
    )

    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result["message"],
        )

    return DownloadResponse(
        success=True,
        message=result["message"],
        model_id=request.model_id,
    )


@router.delete("/{model_id}", response_model=DeleteResponse)
async def delete_model(model_id: str):
    if not model_id or not model_id.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Model ID is required",
        )

    result = await inventory_service.delete_model(model_id)

    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result["message"],
        )

    return DeleteResponse(
        success=True,
        message=result["message"],
        freed_space_gb=result.get("freed_space_gb"),
    )


@router.get("/download/status", response_model=DownloadStatus)
async def get_download_status():
    return await inventory_service.get_download_progress()


@router.post("/{model_id}/distribute", response_model=DistributeResponse)
async def distribute_model(model_id: str):
    if not model_id or not model_id.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Model ID is required",
        )

    model = await inventory_service.get_model_info(model_id)
    if model is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Model {model_id} not found in local inventory",
        )

    result = await inventory_service.distribute_model(model_id)

    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result["message"],
        )

    return DistributeResponse(
        success=True,
        message=result["message"],
        distributed_to=result.get("distributed_to", []),
    )


@router.post("/download/{model_id}/cancel")
async def cancel_download(model_id: str):
    if not model_id or not model_id.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Model ID is required",
        )

    result = await inventory_service.cancel_download(model_id)

    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result["message"],
        )

    return {"success": True, "message": result["message"]}
