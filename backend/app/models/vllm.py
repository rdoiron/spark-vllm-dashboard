from typing import Optional, Literal
from pydantic import BaseModel, Field


class ModelLaunchConfig(BaseModel):
    model_id: str = Field(..., description="HuggingFace model ID or path")
    tensor_parallel: int = Field(
        1, ge=1, le=8, description="Number of tensor parallel shards"
    )
    gpu_memory_utilization: float = Field(
        0.9, ge=0.0, le=1.0, description="GPU memory utilization ratio"
    )
    max_model_len: Optional[int] = Field(
        None, gt=0, description="Maximum model sequence length"
    )
    enable_auto_tool_choice: bool = Field(
        False, description="Enable automatic tool selection"
    )
    tool_call_parser: Optional[str] = Field(None, description="Parser for tool calls")
    reasoning_parser: Optional[str] = Field(None, description="Parser for reasoning")
    trust_remote_code: bool = Field(
        True, description="Trust remote code for custom models"
    )
    load_format: Optional[Literal["auto", "pt", "safetensors", "npcache", "dummy"]] = (
        Field("auto", description="Model weight load format")
    )
    port: int = Field(8000, ge=1024, le=65535, description="Port for vLLM server")


class ModelStatus(BaseModel):
    running: bool
    model_id: Optional[str] = None
    uptime: Optional[str] = None
    port: int = 8000
    message: Optional[str] = None


class LaunchResult(BaseModel):
    success: bool
    message: str
    model_id: Optional[str] = None
    port: Optional[int] = None


class RunningConfig(BaseModel):
    model_id: str
    tensor_parallel: int
    gpu_memory_utilization: float
    max_model_len: Optional[int]
    enable_auto_tool_choice: bool
    tool_call_parser: Optional[str]
    reasoning_parser: Optional[str]
    trust_remote_code: bool
    load_format: str
    port: int
