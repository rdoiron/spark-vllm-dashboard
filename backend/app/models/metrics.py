from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class VLLMMetrics(BaseModel):
    timestamp: str

    gpu_memory_utilization: float = 0.0
    gpu_memory_used_bytes: int = 0
    gpu_memory_total_bytes: int = 0

    cpu_utilization: float = 0.0
    ram_used_bytes: int = 0
    ram_total_bytes: int = 0

    request_count_total: int = 0
    request_count_in_progress: int = 0
    request_count_finished: int = 0

    prompt_tokens_total: int = 0
    generation_tokens_total: int = 0
    total_tokens_total: int = 0

    throughput_tokens_per_second: float = 0.0
    throughput_requests_per_second: float = 0.0

    avg_prompt_latency_seconds: float = 0.0
    avg_generation_latency_seconds: float = 0.0
    avg_total_latency_seconds: float = 0.0

    queue_size: int = 0
    time_in_queue_seconds: float = 0.0

    num_active_requests: int = 0
    num_waiting_requests: int = 0
    num_finished_requests: int = 0

    model_loaded: bool = False
    model_name: Optional[str] = None
    port: int = 8000


class MetricsSnapshot(BaseModel):
    timestamp: str
    metrics: VLLMMetrics
    source: str = "vllm"


class MetricsSummary(BaseModel):
    current: VLLMMetrics
    derived: dict
    recommendations: list[str]
