import asyncio
import logging
import os
import re
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Optional

from app.services.config_service import config_service
from app.config import settings
from app.models.inventory import (
    LocalModel,
    DownloadStatus,
    DownloadRequest,
)

logger = logging.getLogger(__name__)


class InventoryService:
    DOWNLOAD_STATUS_FILE = "/tmp/model_download_status.json"
    DOWNLOAD_PID_FILE = "/tmp/model_download.pid"

    def __init__(self):
        self.container_name = None
        self.spark_docker_path = None

    def _get_hf_cache_dir(self) -> str:
        return settings.hf_cache_dir

    def _get_config(self):
        self.container_name = config_service.get_container_name()
        self.spark_docker_path = config_service.get_spark_docker_path()

    async def _run_docker_command(self, cmd: str) -> tuple[str, str, int]:
        full_cmd = f"docker exec {self.container_name} sh -c '{cmd}'"
        proc = await asyncio.create_subprocess_shell(
            full_cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await proc.communicate()
        return (
            stdout.decode("utf-8", errors="replace"),
            stderr.decode("utf-8", errors="replace"),
            proc.returncode or 0,
        )

    async def _run_local_command(self, cmd: str) -> tuple[str, str, int]:
        proc = await asyncio.create_subprocess_shell(
            cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await proc.communicate()
        return (
            stdout.decode("utf-8", errors="replace"),
            stderr.decode("utf-8", errors="replace"),
            proc.returncode or 0,
        )

    def _parse_model_id(self, model_path: str) -> str:
        return Path(model_path).name

    def _get_model_name(self, model_id: str) -> str:
        return model_id.split("/")[-1].replace("-", " ").replace("_", " ").title()

    def _detect_quantization(self, model_id: str) -> Optional[str]:
        quantization_patterns = ["awq", "gptq", "gguf", "int4", "int8"]
        for pattern in quantization_patterns:
            if pattern.lower() in model_id.lower():
                return pattern.upper()
        return None

    def _get_file_size_gb(self, path: Path) -> float:
        total = 0
        if path.exists() and path.is_dir():
            for p in path.rglob("*"):
                if p.is_file():
                    total += p.stat().st_size
        elif path.exists() and path.is_file():
            total = path.stat().st_size
        return total / (1024**3)

    async def list_local_models(self) -> list[LocalModel]:
        self._get_config()

        try:
            hf_cache_dir = self._get_hf_cache_dir()
            cmd = f"ls -la {hf_cache_dir} 2>/dev/null | tail -n +2"

            if hf_cache_dir.startswith("/home/") or hf_cache_dir.startswith("/root/"):
                stdout, stderr, returncode = await self._run_local_command(cmd)
            else:
                stdout, stderr, returncode = await self._run_docker_command(cmd)

            if returncode != 0:
                logger.warning(f"Failed to list models from {hf_cache_dir}: {stderr}")
                return []

            if not stdout.strip():
                return []

            models = []
            lines = stdout.strip().split("\n")

            for line in lines:
                if not line.strip():
                    continue

                parts = line.split()
                if len(parts) < 9:
                    continue

                permissions = parts[0]
                if not permissions.startswith("d"):
                    continue

                model_path = parts[-1]

                if model_path.startswith("."):
                    continue

                if not model_path.startswith("models--"):
                    continue

                hf_cache_dir = self._get_hf_cache_dir()
                full_path = Path(hf_cache_dir) / model_path
                size_gb = self._get_file_size_gb(full_path)

                name = self._get_model_name(model_id)
                quantization = self._detect_quantization(model_id)

                downloaded_at = None
                try:
                    stat = full_path.stat()
                    downloaded_at = datetime.fromtimestamp(stat.st_mtime)
                except Exception:
                    pass

                download_status = "completed"
                if self._is_downloading(model_id):
                    download_status = "downloading"

                models.append(
                    LocalModel(
                        id=model_id,
                        name=name,
                        size_gb=round(size_gb, 2),
                        quantization=quantization,
                        downloaded_at=downloaded_at,
                        download_status=download_status,
                        local_path=str(full_path),
                    )
                )

            return models

        except Exception as e:
            logger.error(f"Error listing models: {e}")
            return []

    async def get_model_info(self, model_id: str) -> Optional[LocalModel]:
        models = await self.list_local_models()
        for model in models:
            if model.id == model_id or model.id.endswith(model_id.split("/")[-1]):
                return model
        return None

    def _is_downloading(self, model_id: str) -> bool:
        try:
            if os.path.exists(self.DOWNLOAD_PID_FILE):
                with open(self.DOWNLOAD_PID_FILE) as f:
                    pid = f.read().strip()
                    if pid:
                        try:
                            os.kill(int(pid), 0)
                            return True
                        except (OSError, ProcessLookupError):
                            return False
            return False
        except Exception:
            return False

    async def download_model(self, model_id: str, distribute: bool = False) -> dict:
        self._get_config()

        if not self.spark_docker_path:
            return {
                "success": False,
                "message": "Spark docker path not configured. Please configure it in Settings.",
            }

        try:
            download_script = self.spark_docker_path / "hf-download.sh"

            if not download_script.exists():
                return {
                    "success": False,
                    "message": f"Download script not found: {download_script}. Please ensure the spark-vllm-docker repository is configured correctly.",
                }

            revision_arg = ""
            cmd_parts = [
                str(download_script),
                model_id,
            ]
            if distribute:
                cmd_parts.append("--distribute")

            full_cmd = " ".join(cmd_parts)
            full_cmd = f"nohup {full_cmd} > /tmp/hf-download.log 2>&1 & echo $! > {self.DOWNLOAD_PID_FILE}"

            hf_cache_dir = self._get_hf_cache_dir()
            if hf_cache_dir.startswith("/home/") or hf_cache_dir.startswith("/root/"):
                stdout, stderr, returncode = await self._run_local_command(full_cmd)
            else:
                stdout, stderr, returncode = await self._run_docker_command(full_cmd)

            if returncode != 0 and "nohup" not in stderr.lower():
                return {
                    "success": False,
                    "message": f"Failed to start download: {stderr}",
                }

            with open(self.DOWNLOAD_STATUS_FILE, "w") as f:
                import json

                json.dump(
                    {
                        "model_id": model_id,
                        "status": "downloading",
                        "started_at": datetime.utcnow().isoformat(),
                    },
                    f,
                )

            return {
                "success": True,
                "message": f"Download started for {model_id}",
                "model_id": model_id,
            }

        except Exception as e:
            return {
                "success": False,
                "message": f"Error starting download: {str(e)}",
            }

    async def delete_model(self, model_id: str) -> dict:
        self._get_config()

        if not self.container_name:
            return {
                "success": False,
                "message": "Docker container name not configured. Please configure it in Settings.",
                "freed_space_gb": 0.0,
            }

        try:
            hf_cache_dir = self._get_hf_cache_dir()
            model_path = Path(hf_cache_dir) / f"models--{model_id.replace('/', '--')}"

            if not model_path.exists():
                return {
                    "success": False,
                    "message": f"Model not found: {model_id}",
                    "freed_space_gb": 0.0,
                }

            size_before = self._get_file_size_gb(model_path)

            cmd = f"rm -rf {model_path}"

            if hf_cache_dir.startswith("/home/") or hf_cache_dir.startswith("/root/"):
                stdout, stderr, returncode = await self._run_local_command(cmd)
            else:
                stdout, stderr, returncode = await self._run_docker_command(cmd)

            if returncode != 0:
                return {
                    "success": False,
                    "message": f"Failed to delete model: {stderr}",
                    "freed_space_gb": 0.0,
                }

            size_after = self._get_file_size_gb(model_path.parent)
            freed = max(0, size_before - size_after)

            return {
                "success": True,
                "message": f"Model {model_id} deleted successfully",
                "freed_space_gb": round(freed, 2),
            }

        except Exception as e:
            return {
                "success": False,
                "message": f"Error deleting model: {str(e)}",
                "freed_space_gb": 0.0,
            }

    async def get_download_progress(self) -> Optional[DownloadStatus]:
        try:
            if not os.path.exists(self.DOWNLOAD_STATUS_FILE):
                return DownloadStatus(
                    model_id="",
                    progress=0.0,
                    status="idle",
                )

            with open(self.DOWNLOAD_STATUS_FILE) as f:
                import json

                data = json.load(f)

            return DownloadStatus(
                model_id=data.get("model_id", ""),
                progress=data.get("progress", 0.0),
                status=data.get("status", "idle"),
                downloaded_bytes=data.get("downloaded_bytes", 0),
                total_bytes=data.get("total_bytes"),
                speed_mbps=data.get("speed_mbps"),
                error_message=data.get("error_message"),
                updated_at=datetime.utcnow(),
            )

        except Exception as e:
            return DownloadStatus(
                model_id="",
                progress=0.0,
                status="idle",
                error_message=str(e),
            )

    async def distribute_model(self, model_id: str) -> dict:
        self._get_config()

        if not self.spark_docker_path:
            return {
                "success": False,
                "message": "Spark docker path not configured. Please configure it in Settings.",
                "distributed_to": [],
            }

        try:
            distribute_script = self.spark_docker_path / "distribute-model.sh"

            if not distribute_script.exists():
                return {
                    "success": False,
                    "message": f"Distribute script not found: {distribute_script}. Please ensure the spark-vllm-docker repository is configured correctly.",
                    "distributed_to": [],
                }

            cmd = f"{distribute_script} {model_id}"

            hf_cache_dir = self._get_hf_cache_dir()
            if hf_cache_dir.startswith("/home/") or hf_cache_dir.startswith("/root/"):
                stdout, stderr, returncode = await self._run_local_command(cmd)
            else:
                stdout, stderr, returncode = await self._run_docker_command(cmd)

            if returncode != 0:
                return {
                    "success": False,
                    "message": f"Failed to distribute model: {stderr}",
                    "distributed_to": [],
                }

            distributed_nodes = []
            if stdout.strip():
                distributed_nodes = stdout.strip().split("\n")

            return {
                "success": True,
                "message": f"Model {model_id} distributed to {len(distributed_nodes)} nodes",
                "distributed_to": distributed_nodes,
            }

        except Exception as e:
            return {
                "success": False,
                "message": f"Error distributing model: {str(e)}",
                "distributed_to": [],
            }

    async def cancel_download(self, model_id: str) -> dict:
        try:
            if not os.path.exists(self.DOWNLOAD_PID_FILE):
                return {
                    "success": False,
                    "message": "No download in progress",
                }

            with open(self.DOWNLOAD_PID_FILE) as f:
                pid = f.read().strip()

            if not pid:
                return {
                    "success": False,
                    "message": "No download in progress",
                }

            cmd = f"kill {pid} 2>/dev/null; rm -f {self.DOWNLOAD_PID_FILE} {self.DOWNLOAD_STATUS_FILE}"

            hf_cache_dir = self._get_hf_cache_dir()
            if hf_cache_dir.startswith("/home/") or hf_cache_dir.startswith("/root/"):
                await self._run_local_command(cmd)
            else:
                await self._run_docker_command(cmd)

            return {
                "success": True,
                "message": f"Download cancelled for {model_id}",
            }

        except Exception as e:
            return {
                "success": False,
                "message": f"Error cancelling download: {str(e)}",
            }


inventory_service = InventoryService()
