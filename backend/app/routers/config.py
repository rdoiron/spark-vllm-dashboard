from fastapi import APIRouter, HTTPException
from typing import Optional
from pydantic import BaseModel

from app.services.config_service import config_service

router = APIRouter(prefix="/config", tags=["config"])


class ConfigUpdate(BaseModel):
    spark_docker_path: Optional[str] = None
    container_name: Optional[str] = None
    head_node_ip: Optional[str] = None
    worker_node_ips: Optional[list[str]] = None
    vllm_port: Optional[int] = None


class ConfigResponse(BaseModel):
    spark_docker_path: str
    container_name: str
    head_node_ip: str
    worker_node_ips: list[str]
    vllm_port: int


@router.get("", response_model=ConfigResponse)
async def get_config():
    config = config_service.get_config()
    return ConfigResponse(
        spark_docker_path=config.get("spark_docker_path", ""),
        container_name=config.get("container_name", ""),
        head_node_ip=config.get("head_node_ip", ""),
        worker_node_ips=config.get("worker_node_ips", []),
        vllm_port=config.get("vllm_port", 8000),
    )


@router.put("", response_model=ConfigResponse)
async def update_config(update: ConfigUpdate):
    try:
        config = config_service.update_config(
            spark_docker_path=update.spark_docker_path,
            container_name=update.container_name,
            head_node_ip=update.head_node_ip,
            worker_node_ips=update.worker_node_ips,
            vllm_port=update.vllm_port,
        )
        return ConfigResponse(
            spark_docker_path=config.get("spark_docker_path", ""),
            container_name=config.get("container_name", ""),
            head_node_ip=config.get("head_node_ip", ""),
            worker_node_ips=config.get("worker_node_ips", []),
            vllm_port=config.get("vllm_port", 8000),
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to update config: {str(e)}"
        )


@router.post("/reload")
async def reload_config():
    config_service.invalidate_cache()
    config = config_service.get_config()
    return {"message": "Config reloaded", "config": config}
