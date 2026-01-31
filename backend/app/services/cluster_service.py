import asyncio
import logging
import re
from pathlib import Path
from typing import Optional

from app.config import settings
from app.models.cluster import ClusterStatus, NodeHealth, NodeStatus

logger = logging.getLogger(__name__)


class ClusterService:
    def __init__(self):
        self.spark_docker_path = Path(settings.spark_docker_path)
        self.launch_script = self.spark_docker_path / "launch-cluster.sh"

    def _get_script_path(self, script_name: str) -> Path:
        script_path = self.spark_docker_path / script_name
        if not script_path.exists():
            raise FileNotFoundError(f"Script not found: {script_path}")
        return script_path

    async def _run_script(
        self, script_name: str, args: Optional[list[str]] = None
    ) -> tuple[str, str, int]:
        script_path = self._get_script_path(script_name)
        cmd = [str(script_path)] + (args or [])

        logger.info(f"Running command: {' '.join(cmd)}")

        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        stdout, stderr = await proc.communicate()
        return (
            stdout.decode("utf-8", errors="replace"),
            stderr.decode("utf-8", errors="replace"),
            proc.returncode or 0,
        )

    def _parse_status_output(self, output: str) -> ClusterStatus:
        running = False
        head_healthy = False
        worker_healthy = False
        uptime = None
        message = None

        output_lower = output.lower()

        if "running" in output_lower or "active" in output_lower:
            running = True

        if "head" in output_lower and (
            "online" in output_lower
            or "healthy" in output_lower
            or "running" in output_lower
        ):
            head_healthy = True

        if "worker" in output_lower and (
            "online" in output_lower
            or "healthy" in output_lower
            or "running" in output_lower
        ):
            worker_healthy = True

        uptime_match = re.search(r"uptime[:\s]+(\d+[hmhs]+)", output, re.IGNORECASE)
        if uptime_match:
            uptime = uptime_match.group(1)

        if "error" in output_lower or "failed" in output_lower:
            message = output.strip()

        return ClusterStatus(
            running=running,
            head_healthy=head_healthy,
            worker_healthy=worker_healthy,
            uptime=uptime,
            message=message
            if message
            else ("Cluster is running" if running else "Cluster is stopped"),
        )

    async def start_cluster(self) -> ClusterStatus:
        try:
            stdout, stderr, returncode = await self._run_script(
                "launch-cluster.sh", ["-d"]
            )
            logger.info(f"Start cluster stdout: {stdout}")
            if stderr:
                logger.warning(f"Start cluster stderr: {stderr}")

            if returncode != 0:
                error_msg = stderr or stdout
                logger.error(f"Failed to start cluster: {error_msg}")
                return ClusterStatus(
                    running=False,
                    head_healthy=False,
                    worker_healthy=False,
                    message=f"Failed to start cluster: {error_msg.strip()}",
                )

            return self._parse_status_output(stdout)

        except FileNotFoundError as e:
            logger.error(f"Script not found: {e}")
            return ClusterStatus(
                running=False,
                head_healthy=False,
                worker_healthy=False,
                message=str(e),
            )
        except Exception as e:
            logger.exception(f"Error starting cluster: {e}")
            return ClusterStatus(
                running=False,
                head_healthy=False,
                worker_healthy=False,
                message=f"Unexpected error: {str(e)}",
            )

    async def stop_cluster(self) -> ClusterStatus:
        try:
            stdout, stderr, returncode = await self._run_script(
                "launch-cluster.sh", ["stop"]
            )
            logger.info(f"Stop cluster stdout: {stdout}")
            if stderr:
                logger.warning(f"Stop cluster stderr: {stderr}")

            if returncode != 0:
                error_msg = stderr or stdout
                logger.error(f"Failed to stop cluster: {error_msg}")
                return ClusterStatus(
                    running=True,
                    head_healthy=False,
                    worker_healthy=False,
                    message=f"Failed to stop cluster: {error_msg.strip()}",
                )

            return ClusterStatus(
                running=False,
                head_healthy=False,
                worker_healthy=False,
                message="Cluster stopped successfully",
            )

        except FileNotFoundError as e:
            logger.error(f"Script not found: {e}")
            return ClusterStatus(
                running=False,
                head_healthy=False,
                worker_healthy=False,
                message=str(e),
            )
        except Exception as e:
            logger.exception(f"Error stopping cluster: {e}")
            return ClusterStatus(
                running=False,
                head_healthy=False,
                worker_healthy=False,
                message=f"Unexpected error: {str(e)}",
            )

    async def get_status(self) -> ClusterStatus:
        try:
            stdout, stderr, returncode = await self._run_script(
                "launch-cluster.sh", ["status"]
            )
            logger.debug(f"Status stdout: {stdout}")
            if stderr:
                logger.debug(f"Status stderr: {stderr}")

            if returncode != 0 and "not running" in stderr.lower():
                return ClusterStatus(
                    running=False,
                    head_healthy=False,
                    worker_healthy=False,
                    message="Cluster is not running",
                )

            return self._parse_status_output(stdout)

        except FileNotFoundError as e:
            logger.error(f"Script not found: {e}")
            return ClusterStatus(
                running=False,
                head_healthy=False,
                worker_healthy=False,
                message=str(e),
            )
        except Exception as e:
            logger.exception(f"Error getting status: {e}")
            return ClusterStatus(
                running=False,
                head_healthy=False,
                worker_healthy=False,
                message=f"Unexpected error: {str(e)}",
            )

    async def check_node_health(self, ip: str) -> NodeHealth:
        try:
            proc = await asyncio.create_subprocess_exec(
                "ping",
                "-c",
                "3",
                "-W",
                "2",
                ip,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )

            stdout, _ = await proc.communicate()
            output = stdout.decode("utf-8", errors="replace")

            latency_match = re.search(r"rtt.*=[\d.]+/([\d.]+)", output)
            latency_ms = None
            if latency_match:
                latency_ms = float(latency_match.group(1))

            healthy = proc.returncode == 0

            return NodeHealth(
                ip=ip,
                healthy=healthy,
                latency_ms=latency_ms,
            )

        except Exception as e:
            logger.exception(f"Error checking node health for {ip}: {e}")
            return NodeHealth(
                ip=ip,
                healthy=False,
                latency_ms=None,
            )

    async def get_nodes_status(self) -> NodeStatus:
        head_ip = settings.head_node_ip
        worker_ip = "192.168.5.212"

        head_health = await self.check_node_health(head_ip)
        worker_health = await self.check_node_health(worker_ip)

        return NodeStatus(
            head=head_health,
            worker=worker_health,
        )


cluster_service = ClusterService()
