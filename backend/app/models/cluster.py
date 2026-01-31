from typing import Optional
from pydantic import BaseModel
from typing import Literal


class ClusterStatus(BaseModel):
    running: bool
    head_healthy: bool
    worker_healthy: bool
    uptime: Optional[str] = None
    message: Optional[str] = None


class ClusterAction(BaseModel):
    action: Literal["start", "stop"]


class NodeHealth(BaseModel):
    ip: str
    healthy: bool
    latency_ms: Optional[float] = None


class NodeStatus(BaseModel):
    head: NodeHealth
    worker: NodeHealth
