from fastapi import APIRouter, HTTPException, status
from typing import Optional

from app.services.cluster_service import cluster_service
from app.models.cluster import ClusterStatus, NodeStatus

router = APIRouter(prefix="/cluster", tags=["cluster"])


@router.get("/status", response_model=ClusterStatus)
async def get_cluster_status():
    return await cluster_service.get_status()


@router.post("/start", response_model=ClusterStatus)
async def start_cluster():
    return await cluster_service.start_cluster()


@router.post("/stop", response_model=ClusterStatus)
async def stop_cluster():
    return await cluster_service.stop_cluster()


@router.get("/nodes", response_model=NodeStatus)
async def get_nodes_status():
    return await cluster_service.get_nodes_status()


@router.get("/uptime")
async def get_cluster_uptime():
    uptime = await cluster_service.get_uptime()
    return {"uptime": uptime}
