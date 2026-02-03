import asyncio
import json
import logging
import os
import re
from pathlib import Path
from typing import Optional

from app.services.config_service import config_service
from app.models.vllm import ModelLaunchConfig, ModelStatus, LaunchResult, RunningConfig

logger = logging.getLogger(__name__)

VLLM_PID_FILE = "/tmp/vllm_server.pid"
VLLM_CONFIG_FILE = "/tmp/vllm_config.json"


class VLLMService:
    def __init__(self):
        self.container_name = None
        self.vllm_port = None
        self.spark_docker_path = None

    def _get_config(self):
        self.container_name = config_service.get_container_name()
        self.vllm_port = config_service.get_vllm_port()
        self.spark_docker_path = config_service.get_spark_docker_path()

    async def _run_docker_command(self, cmd: str) -> tuple[str, str, int]:
        self._get_config()
        if not self.container_name:
            raise RuntimeError(
                "Container name not configured. Please set container_name in settings."
            )

        full_cmd = f"docker exec {self.container_name} sh -c '{cmd}'"
        logger.info(f"Running Docker command: {full_cmd}")

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

    def _build_vllm_command(self, config: ModelLaunchConfig) -> list[str]:
        cmd_parts = [
            "vllm",
            "serve",
            config.model_id,
            "--tensor-parallel-size",
            str(config.tensor_parallel),
            "--gpu-memory-utilization",
            str(config.gpu_memory_utilization),
            "--port",
            str(config.port),
            "--distributed-executor-backend",
            "ray",
            "--host",
            "0.0.0.0",
        ]

        if config.max_model_len:
            cmd_parts.extend(["--max-model-len", str(config.max_model_len)])

        if config.enable_auto_tool_choice:
            cmd_parts.append("--enable-auto-tool-choice")

        if config.tool_call_parser:
            cmd_parts.extend(["--tool-call-parser", config.tool_call_parser])

        if config.reasoning_parser:
            cmd_parts.extend(["--reasoning-parser", config.reasoning_parser])

        if not config.trust_remote_code:
            cmd_parts.append("--no-trust-remote-code")

        if config.load_format and config.load_format != "auto":
            cmd_parts.extend(["--load-format", config.load_format])

        return cmd_parts

    async def launch_model(self, config: ModelLaunchConfig) -> LaunchResult:
        try:
            vllm_cmd = " ".join(self._build_vllm_command(config))
            full_cmd = f"cd /spark-dashboard/spark-vllm-docker && nohup {vllm_cmd} > /tmp/vllm.log 2>&1 & echo $! > {VLLM_PID_FILE}"

            stdout, stderr, returncode = await self._run_docker_command(full_cmd)

            logger.info(f"Launch command stdout: {stdout}")
            if stderr:
                logger.warning(f"Launch command stderr: {stderr}")

            if returncode != 0:
                error_msg = stderr or stdout
                logger.error(f"Failed to launch model: {error_msg}")
                return LaunchResult(
                    success=False,
                    message=f"Failed to launch model: {error_msg.strip()}",
                )

            config_data = config.model_dump()
            with open(VLLM_CONFIG_FILE, "w") as f:
                json.dump(config_data, f)

            logger.info(
                f"Successfully launched model {config.model_id} on port {config.port}"
            )
            return LaunchResult(
                success=True,
                message=f"Model {config.model_id} launched successfully on port {config.port}",
                model_id=config.model_id,
                port=config.port,
            )

        except Exception as e:
            logger.exception(f"Error launching model: {e}")
            return LaunchResult(
                success=False,
                message=f"Unexpected error launching model: {str(e)}",
            )

    async def stop_model(self) -> LaunchResult:
        try:
            check_cmd = f"cat {VLLM_PID_FILE} 2>/dev/null"
            stdout, _, _ = await self._run_docker_command(check_cmd)

            pid_match = re.search(r"(\d+)", stdout)
            if pid_match:
                pid = pid_match.group(1)
                kill_cmd = (
                    f"kill {pid} 2>/dev/null; rm -f {VLLM_PID_FILE} {VLLM_CONFIG_FILE}"
                )
                await self._run_docker_command(kill_cmd)
                logger.info(f"Stopped vLLM process with PID {pid}")
                return LaunchResult(
                    success=True,
                    message="Model stopped successfully",
                )
            else:
                logger.warning("No running vLLM process found")
                return LaunchResult(
                    success=False,
                    message="No running vLLM process found",
                )

        except Exception as e:
            logger.exception(f"Error stopping model: {e}")
            return LaunchResult(
                success=False,
                message=f"Unexpected error stopping model: {str(e)}",
            )

    async def get_model_status(self) -> ModelStatus:
        try:
            self._get_config()
            logger.info(
                f"Checking model status with container_name={self.container_name}"
            )

            check_pid_cmd = f"cat {VLLM_PID_FILE} 2>/dev/null"
            stdout, stderr, returncode = await self._run_docker_command(check_pid_cmd)

            logger.info(
                f"PID file check: stdout='{stdout}', stderr='{stderr}', returncode={returncode}"
            )

            pid_match = re.search(r"(\d+)", stdout)
            found_via_pid_file = False
            pid = None

            if pid_match:
                pid = pid_match.group(1)
                logger.info(f"Found PID from file: {pid}")

                check_process_cmd = f"ps -p {pid} -o pid,etime 2>/dev/null | tail -n 1"
                process_output, _, _ = await self._run_docker_command(check_process_cmd)

                logger.info(f"Process check output: '{process_output}'")

                if (
                    process_output.strip()
                    and "no such process" not in process_output.lower()
                ):
                    found_via_pid_file = True
                    uptime = None
                    uptime_match = re.search(r"(\d+-\d+:\d+|\d+:\d+)", process_output)
                    if uptime_match:
                        uptime = uptime_match.group(1)

                    config = await self.get_running_config()

                    port = int(self.vllm_port) if self.vllm_port else 8000
                    return ModelStatus(
                        running=True,
                        model_id=config.model_id if config else None,
                        uptime=uptime,
                        port=port,
                        message="vLLM model is running",
                    )

            logger.info("PID file method failed, trying alternative checks")

            check_port_cmd = "ss -tlnp 2>/dev/null | grep ':8000' || netstat -tlnp 2>/dev/null | grep ':8000' || true"
            port_output, _, _ = await self._run_docker_command(check_port_cmd)
            logger.info(f"Port check output: '{port_output}'")

            if "8000" in port_output:
                logger.info("Port 8000 is listening, vLLM appears to be running")
                config = await self.get_running_config()
                return ModelStatus(
                    running=True,
                    model_id=config.model_id if config else None,
                    uptime=None,
                    port=8000,
                    message="vLLM model is running (detected via port check)",
                )

            check_pgrep_cmd = "pgrep -f 'vllm' || pgrep -f 'vllm serve' || true"
            pgrep_output, _, _ = await self._run_docker_command(check_pgrep_cmd)
            logger.info(f"pgrep output: '{pgrep_output}'")

            if pgrep_output.strip():
                logger.info("vLLM process found via pgrep")
                config = await self.get_running_config()
                port = self.vllm_port if self.vllm_port else 8000
                return ModelStatus(
                    running=True,
                    model_id=config.model_id if config else None,
                    uptime=None,
                    port=port,
                    message="vLLM model is running (detected via process check)",
                )

            check_log_cmd = f"tail -n 1 /tmp/vllm.log 2>/dev/null || echo ''"
            log_output, _, _ = await self._run_docker_command(check_log_cmd)
            logger.info(f"Log file check: '{log_output}'")

            if log_output.strip() and "No such file" not in log_output:
                logger.info("Log file exists and has content")
                config = await self.get_running_config()
                port = self.vllm_port if self.vllm_port else 8000
                return ModelStatus(
                    running=True,
                    model_id=config.model_id if config else None,
                    uptime=None,
                    port=port,
                    message="vLLM model may be running (log file exists)",
                )

            logger.warning("All checks failed, vLLM does not appear to be running")
            return ModelStatus(
                running=False,
                message="No vLLM process running (PID file not found and no alternative detection methods succeeded)",
            )

        except Exception as e:
            logger.exception(f"Error getting model status: {e}")
            return ModelStatus(
                running=False,
                message=f"Error checking status: {str(e)}",
            )

    async def get_running_config(self) -> Optional[RunningConfig]:
        try:
            check_config_cmd = f"cat {VLLM_CONFIG_FILE} 2>/dev/null"
            stdout, _, returncode = await self._run_docker_command(check_config_cmd)

            if returncode != 0 or not stdout.strip():
                return None

            config_data = json.loads(stdout)
            return RunningConfig(**config_data)

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse vLLM config: {e}")
            return None
        except Exception as e:
            logger.exception(f"Error getting running config: {e}")
            return None


vllm_service = VLLMService()
