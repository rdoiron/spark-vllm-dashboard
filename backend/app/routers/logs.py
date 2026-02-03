import asyncio
import logging
from datetime import datetime
from typing import Optional

from fastapi import (
    APIRouter,
    HTTPException,
    Query,
    WebSocket,
    WebSocketDisconnect,
    status,
    Response,
)
from pydantic import BaseModel

from app.services.log_service import log_service, LogLevel
from app.services.vllm_service import vllm_service

logger = logging.getLogger(__name__)


class LogEntryResponse(BaseModel):
    timestamp: str
    level: str
    message: str
    raw_line: str


class LogHistoryResponse(BaseModel):
    logs: list[LogEntryResponse]
    count: int
    timestamp: str


class LogStreamMessage(BaseModel):
    timestamp: str
    level: str
    message: str
    raw_line: str


router = APIRouter(prefix="/logs", tags=["logs"])


@router.get("/history", response_model=LogHistoryResponse)
async def get_log_history(
    lines: int = Query(default=100, ge=1, le=1000),
    level: Optional[str] = None,
):
    status_result = await vllm_service.get_model_status()
    if not status_result.running:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="vLLM is not currently running",
        )

    try:
        log_level = None
        if level:
            try:
                log_level = LogLevel(level.upper())
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid log level: {level}. Valid levels: DEBUG, INFO, WARNING, ERROR, CRITICAL",
                )

        if log_level:
            logs = await log_service.get_filtered_logs(level=log_level, lines=lines)
        else:
            logs = await log_service.get_recent_logs(lines=lines)

        return LogHistoryResponse(
            logs=[
                LogEntryResponse(
                    timestamp=log.timestamp,
                    level=log.level.value,
                    message=log.message,
                    raw_line=log.raw_line,
                )
                for log in logs
            ],
            count=len(logs),
            timestamp=datetime.utcnow().isoformat() + "Z",
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("/download")
async def download_logs(lines: int = Query(default=1000, ge=1, le=10000)):
    status_result = await vllm_service.get_model_status()
    if not status_result.running:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="vLLM is not currently running",
        )

    try:
        content = await log_service.get_log_file_content()
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"vllm_logs_{timestamp}.log"

        return Response(
            content=content,
            media_type="text/plain",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
            },
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.websocket("/stream")
async def logs_websocket(websocket: WebSocket):
    await websocket.accept()
    logger.info("WebSocket connection established for log streaming")

    try:
        status_result = await vllm_service.get_model_status()
        logger.info(
            f"Model status check: running={status_result.running}, message={status_result.message}"
        )
    except Exception as e:
        logger.exception(f"Error checking model status: {e}")
        error_msg = f"Failed to check vLLM status: {str(e)}"
        await websocket.send_json(
            {
                "error": error_msg,
                "error_type": "status_check_failed",
                "timestamp": datetime.utcnow().isoformat() + "Z",
            }
        )
        await websocket.close()
        return

    if not status_result.running:
        logger.warning("vLLM is not running, closing WebSocket connection")
        await websocket.send_json(
            {
                "error": "vLLM is not currently running",
                "error_type": "vllm_not_running",
                "timestamp": datetime.utcnow().isoformat() + "Z",
            }
        )
        await websocket.close()
        return

    logger.info("vLLM is running, starting log stream")
    try:
        log_count = 0
        async for log_entry in log_service.stream_logs():
            log_count += 1
            if log_count <= 5 or log_count % 100 == 0:
                logger.debug(f"Streaming log #{log_count}: {log_entry.message[:50]}...")
            message = LogStreamMessage(
                timestamp=log_entry.timestamp,
                level=log_entry.level.value,
                message=log_entry.message,
                raw_line=log_entry.raw_line,
            )
            await websocket.send_json(message.model_dump())

        logger.info(f"Log stream ended after {log_count} entries")
    except WebSocketDisconnect:
        logger.info("WebSocket connection closed for log streaming")
    except asyncio.CancelledError:
        logger.info("WebSocket connection cancelled for log streaming")
    except Exception as e:
        logger.exception(f"Unexpected error in log WebSocket: {e}")
        try:
            await websocket.send_json(
                {
                    "error": str(e),
                    "error_type": "streaming_error",
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                }
            )
        except Exception:
            pass
    finally:
        try:
            await websocket.close()
        except Exception:
            pass
