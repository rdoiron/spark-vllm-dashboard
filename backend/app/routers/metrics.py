import asyncio
import json
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.metrics_service import metrics_service
from app.models.metrics import VLLMMetrics, MetricsSnapshot, MetricsSummary

router = APIRouter(prefix="/metrics", tags=["metrics"])

logger = logging.getLogger(__name__)


@router.get("/", response_model=MetricsSummary)
async def get_current_metrics():
    snapshot = await metrics_service.get_snapshot()
    if snapshot is None:
        return MetricsSummary(
            current=VLLMMetrics(timestamp=datetime.utcnow().isoformat() + "Z"),
            derived={"error": "Could not fetch metrics from vLLM"},
            recommendations=["Ensure vLLM is running and accessible"],
        )

    derived = metrics_service.calculate_derived_metrics(snapshot.metrics)

    recommendations = []
    if snapshot.metrics.gpu_memory_utilization > 0.9:
        recommendations.append("Consider reducing batch size or stopping unused models")
    if snapshot.metrics.queue_size > 10:
        recommendations.append("High queue size - consider scaling resources")
    if snapshot.metrics.num_active_requests > 100:
        recommendations.append("High request load - consider load balancing")

    return MetricsSummary(
        current=snapshot.metrics,
        derived=derived,
        recommendations=recommendations,
    )


@router.get("/current", response_model=MetricsSnapshot)
async def get_metrics_snapshot():
    snapshot = await metrics_service.get_snapshot()
    if snapshot is None:
        return MetricsSnapshot(
            timestamp=datetime.utcnow().isoformat() + "Z",
            metrics=VLLMMetrics(timestamp=datetime.utcnow().isoformat() + "Z"),
            source="unavailable",
        )
    return snapshot


@router.websocket("/stream")
async def metrics_websocket(websocket: WebSocket):
    await websocket.accept()
    logger.info("WebSocket connection established for metrics stream")

    previous_metrics: Optional[VLLMMetrics] = None

    try:
        while True:
            try:
                snapshot = await metrics_service.get_snapshot()

                if snapshot is not None:
                    derived = metrics_service.calculate_derived_metrics(
                        snapshot.metrics, previous_metrics
                    )

                    message = {
                        "timestamp": datetime.utcnow().isoformat() + "Z",
                        "metrics": snapshot.metrics.model_dump(),
                        "derived": derived,
                    }

                    await websocket.send_json(message)
                    previous_metrics = snapshot.metrics
                else:
                    await websocket.send_json(
                        {
                            "timestamp": datetime.utcnow().isoformat() + "Z",
                            "metrics": None,
                            "error": "Could not fetch metrics",
                        }
                    )

                await asyncio.sleep(1.0)

            except Exception as e:
                logger.error(f"Error in metrics stream: {e}")
                await websocket.send_json(
                    {
                        "timestamp": datetime.utcnow().isoformat() + "Z",
                        "error": str(e),
                    }
                )
                await asyncio.sleep(1.0)

    except WebSocketDisconnect:
        logger.info("WebSocket connection closed for metrics stream")
    except Exception as e:
        logger.exception(f"Unexpected error in metrics WebSocket: {e}")
    finally:
        try:
            await websocket.close()
        except Exception:
            pass
