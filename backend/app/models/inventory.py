from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field


class LocalModel(BaseModel):
    id: str = Field(..., description="Model ID (HuggingFace path or local name)")
    name: str = Field(..., description="Human-readable model name")
    size_gb: float = Field(..., ge=0, description="Model size in gigabytes")
    quantization: Optional[str] = Field(
        default=None, description="Quantization format (e.g., AWQ, GPTQ)"
    )
    revision: Optional[str] = Field(default=None, description="Git revision/commit")
    security: Optional[str] = Field(
        default=None, description="Security info (e.g., safe-tensors)"
    )
    downloaded_at: Optional[datetime] = Field(
        default=None, description="When the model was downloaded"
    )
    download_status: Optional[str] = Field(
        default=None, description="Current download status"
    )
    local_path: Optional[str] = Field(default=None, description="Local filesystem path")


class DownloadStatus(BaseModel):
    model_id: str
    progress: float = Field(
        default=0.0, ge=0.0, le=100.0, description="Download progress percentage"
    )
    status: Literal["idle", "downloading", "completed", "failed", "cancelled"]
    downloaded_bytes: int = Field(default=0, ge=0)
    total_bytes: Optional[int] = Field(default=None, ge=0)
    speed_mbps: Optional[float] = Field(
        default=None, ge=0, description="Download speed in MB/s"
    )
    error_message: Optional[str] = Field(default=None)
    started_at: Optional[datetime] = Field(default=None)
    updated_at: Optional[datetime] = Field(default=None)


class DownloadRequest(BaseModel):
    model_id: str = Field(..., description="HuggingFace model ID to download")
    revision: Optional[str] = Field(None, description="Git revision/commit to download")
    distribute: bool = Field(False, description="Whether to distribute to worker nodes")


class DownloadResponse(BaseModel):
    success: bool
    message: str
    model_id: str


class DeleteResponse(BaseModel):
    success: bool
    message: str
    freed_space_gb: Optional[float] = Field(None)


class DistributeResponse(BaseModel):
    success: bool
    message: str
    distributed_to: list[str]


class ModelListResponse(BaseModel):
    models: list[LocalModel]
    total_count: int
    total_size_gb: float
