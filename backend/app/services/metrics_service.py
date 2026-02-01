import asyncio
import json
import logging
import re
from datetime import datetime
from typing import Optional

from app.config import settings
from app.models.metrics import VLLMMetrics, MetricsSnapshot

logger = logging.getLogger(__name__)


class MetricsService:
    def __init__(self):
        self.container_name = settings.container_name
        self.vllm_port = settings.vllm_port

    async def _run_docker_command(self, cmd: str) -> tuple[str, str, int]:
        full_cmd = f"docker exec {self.container_name} sh -c '{cmd}'"
        logger.debug(f"Running Docker command: {full_cmd}")

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

    def parse_prometheus(self, text: str) -> dict[str, float]:
        metrics = {}

        for line in text.split("\n"):
            line = line.strip()
            if not line or line.startswith("#"):
                continue

            match = re.match(r"^([a-zA-Z_:][a-zA-Z0-9_:]*)\s+(.+)$", line)
            if match:
                name = match.group(1)
                value_str = match.group(2).strip()

                try:
                    if value_str.endswith(".0"):
                        value = float(value_str)
                    else:
                        value = float(value_str)
                    metrics[name] = value
                except ValueError:
                    continue

        return metrics

    def extract_labels(self, text: str) -> dict:
        labels = {}

        for line in text.split("\n"):
            if line.startswith("#") and "=" in line:
                match = re.search(r"#\s*(\w+)\{([^}]+)\}", line)
                if match:
                    metric_name = match.group(1)
                    labels_content = match.group(2)
                    label_dict = {}
                    for label_match in re.finditer(r'(\w+)="([^"]*)"', labels_content):
                        label_dict[label_match.group(1)] = label_match.group(2)
                    if "model_name" in label_dict:
                        labels["model_name"] = label_dict["model_name"]

        return labels

    async def fetch_metrics(self) -> Optional[VLLMMetrics]:
        try:
            curl_cmd = f"curl -s http://localhost:{self.vllm_port}/metrics 2>/dev/null"
            stdout, stderr, returncode = await self._run_docker_command(curl_cmd)

            if returncode != 0 or not stdout.strip():
                logger.warning(f"Failed to fetch metrics from vLLM: {stderr}")
                return None

            metrics = self.parse_prometheus(stdout)
            labels = self.extract_labels(stdout)

            model_loaded = len(metrics) > 0

            throughput_tps = 0.0
            throughput_rps = 0.0

            if "vllm:request_throughput" in metrics:
                throughput_tps = metrics.get("vllm:request_throughput", 0.0)
            if "vllm:request_throughput_toks_per_s" in metrics:
                throughput_tps = metrics.get("vllm:request_throughput_toks_per_s", 0.0)

            if "vllm:num_requests_processed" in metrics:
                request_count = metrics.get("vllm:num_requests_processed", 0)

            gpu_memory_used = 0
            gpu_memory_total = 0

            if 'gpu_memory_usage_bytes{role="worker"}' in metrics:
                gpu_memory_used = int(
                    metrics.get('gpu_memory_usage_bytes{role="worker"}', 0)
                )

            queue_size = 0
            if "vllm:num_requests_waiting" in metrics:
                queue_size = int(metrics.get("vllm:num_requests_waiting", 0))

            num_active = 0
            if "vllm:num_requests_processing" in metrics:
                num_active = int(metrics.get("vllm:num_requests_processing", 0))

            num_finished = 0
            if "vllm:num_requests_finished" in metrics:
                num_finished = int(metrics.get("vllm:num_requests_finished", 0))

            prompt_tokens = 0
            generation_tokens = 0
            total_tokens = 0
            if "vllm:prompt_tokens_total" in metrics:
                prompt_tokens = int(metrics.get("vllm:prompt_tokens_total", 0))
            if "vllm:generation_tokens_total" in metrics:
                generation_tokens = int(metrics.get("vllm:generation_tokens_total", 0))
            if "vllm:total_tokens_total" in metrics:
                total_tokens = int(metrics.get("vllm:total_tokens_total", 0))

            avg_prompt_latency = 0.0
            avg_generation_latency = 0.0
            avg_total_latency = 0.0

            if "vllm:avg_prompt_latency" in metrics:
                avg_prompt_latency = metrics.get("vllm:avg_prompt_latency", 0.0)
            if "vllm:avg_generation_latency" in metrics:
                avg_generation_latency = metrics.get("vllm:avg_generation_latency", 0.0)
            if "vllm:avg_total_latency" in metrics:
                avg_total_latency = metrics.get("vllm:avg_total_latency", 0.0)

            time_in_queue = 0.0
            if "vllm:time_in_queue_avg" in metrics:
                time_in_queue = metrics.get("vllm:time_in_queue_avg", 0.0)

            cpu_util = 0.0
            ram_used = 0
            ram_total = 0

            if "process_cpu_percent" in metrics:
                cpu_util = metrics.get("process_cpu_percent", 0.0)
            if "process_resident_memory_bytes" in metrics:
                ram_used = int(metrics.get("process_resident_memory_bytes", 0))
            if "process_virtual_memory_bytes" in metrics:
                ram_total = int(metrics.get("process_virtual_memory_bytes", 0))

            gpu_util = 0.0
            if "gpu_util" in metrics:
                gpu_util = metrics.get("gpu_util", 0.0)

            timestamp = datetime.utcnow().isoformat() + "Z"

            return VLLMMetrics(
                timestamp=timestamp,
                gpu_memory_utilization=gpu_util / 100.0
                if gpu_util <= 1.0
                else gpu_util / 100.0,
                gpu_memory_used_bytes=gpu_memory_used,
                gpu_memory_total_bytes=gpu_memory_total,
                cpu_utilization=cpu_util / 100.0
                if cpu_util <= 1.0
                else cpu_util / 100.0,
                ram_used_bytes=ram_used,
                ram_total_bytes=ram_total,
                request_count_total=num_active + num_finished,
                request_count_in_progress=num_active,
                request_count_finished=num_finished,
                prompt_tokens_total=prompt_tokens,
                generation_tokens_total=generation_tokens,
                total_tokens_total=total_tokens,
                throughput_tokens_per_second=throughput_tps,
                throughput_requests_per_second=throughput_rps,
                avg_prompt_latency_seconds=avg_prompt_latency,
                avg_generation_latency_seconds=avg_generation_latency,
                avg_total_latency_seconds=avg_total_latency,
                queue_size=queue_size,
                time_in_queue_seconds=time_in_queue,
                num_active_requests=num_active,
                num_waiting_requests=queue_size,
                num_finished_requests=num_finished,
                model_loaded=model_loaded,
                model_name=labels.get("model_name"),
                port=self.vllm_port,
            )

        except Exception as e:
            logger.exception(f"Error fetching metrics: {e}")
            return None

    async def get_snapshot(self) -> Optional[MetricsSnapshot]:
        metrics = await self.fetch_metrics()
        if metrics is None:
            return None

        return MetricsSnapshot(
            timestamp=datetime.utcnow().isoformat() + "Z",
            metrics=metrics,
            source="vllm",
        )

    def calculate_derived_metrics(
        self, current: VLLMMetrics, previous: Optional[VLLMMetrics] = None
    ) -> dict:
        derived = {}

        if current.gpu_memory_utilization > 0.9:
            derived["gpu_warning"] = "GPU memory utilization is above 90%"
        if current.queue_size > 10:
            derived["queue_warning"] = (
                f"High queue size: {current.queue_size} requests waiting"
            )
        if current.num_active_requests > 100:
            derived["load_warning"] = (
                f"High request load: {current.num_active_requests} active requests"
            )

        if previous is not None:
            time_diff = 1.0
            token_delta = current.total_tokens_total - previous.total_tokens_total
            derived["tokens_per_second_delta"] = token_delta / time_diff

            request_delta = (
                current.request_count_finished - previous.request_count_finished
            )
            derived["requests_per_second_delta"] = request_delta / time_diff

        derived["health_status"] = (
            "healthy"
            if (
                current.gpu_memory_utilization < 0.85
                and current.queue_size < 20
                and current.num_active_requests < 100
            )
            else "degraded"
        )

        return derived


metrics_service = MetricsService()
