import asyncio
import re
import logging
from datetime import datetime
from typing import AsyncGenerator, Optional
from dataclasses import dataclass
from enum import Enum


logger = logging.getLogger(__name__)


class LogLevel(Enum):
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


@dataclass
class ParsedLogEntry:
    timestamp: str
    level: LogLevel
    message: str
    raw_line: str


class LogService:
    CONTAINER_NAME = "vllm_node"
    LOG_FILE = "/tmp/vllm.log"

    def __init__(self, container_name: Optional[str] = None):
        self.container_name = container_name or self.CONTAINER_NAME

    def _parse_log_line(self, line: str) -> ParsedLogEntry:
        original_line = line
        line = line.strip()

        timestamp_patterns = [
            r"(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)",
            r"(\d{2}-\d{2} \d{2}:\d{2}:\d{2})",
        ]

        level_pattern = r"(DEBUG|INFO|WARNING|ERROR|CRITICAL)"

        timestamp = datetime.utcnow().isoformat() + "Z"
        for pattern in timestamp_patterns:
            match = re.search(pattern, line)
            if match:
                timestamp = match.group(1)
                if pattern == timestamp_patterns[0]:
                    pass
                else:
                    timestamp = f"2026-{match.group(1)}"
                break

        level_match = re.search(level_pattern, line, re.IGNORECASE)
        if level_match:
            level_str = level_match.group(1).upper()
            try:
                level = LogLevel(level_str)
            except ValueError:
                level = LogLevel.INFO
        else:
            level = LogLevel.INFO

        message_start = 0
        for pattern in timestamp_patterns:
            match = re.search(pattern, line)
            if match:
                message_start = match.end()
                break

        level_match = re.search(level_pattern, line, re.IGNORECASE)
        if level_match:
            message_start = max(message_start, level_match.end())

        message = line[message_start:].strip()

        message = re.sub(r"^[\s:\-]+", "", message)

        if not message:
            message = line

        return ParsedLogEntry(
            timestamp=timestamp,
            level=level,
            message=message,
            raw_line=original_line.strip(),
        )

    async def _run_docker_exec(self, cmd: list[str]) -> asyncio.subprocess.Process:
        docker_cmd = ["docker", "exec", self.container_name] + cmd
        return await asyncio.create_subprocess_exec(
            *docker_cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

    async def get_recent_logs(self, lines: int = 100) -> list[ParsedLogEntry]:
        cmd = ["tail", "-n", str(lines), self.LOG_FILE]
        proc = await self._run_docker_exec(cmd)

        output = b""
        try:
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=10.0)
            output = stdout
            if proc.returncode != 0 and stderr:
                logger.warning(
                    f"tail command stderr: {stderr.decode('utf-8', errors='replace')}"
                )
        except asyncio.TimeoutError:
            logger.warning("Timeout reading log file")
            proc.terminate()
            try:
                await proc.wait()
            except Exception:
                pass

        if not output:
            logger.info("No log output received")
            return []

        lines_list = output.decode("utf-8", errors="replace").splitlines()
        logger.info(f"Parsed {len(lines_list)} raw log lines")
        return [self._parse_log_line(line) for line in lines_list if line.strip()]

    async def get_log_file_content(self) -> bytes:
        cmd = ["cat", self.LOG_FILE]
        proc = await self._run_docker_exec(cmd)

        stdout, stderr = await proc.communicate()
        if proc.returncode != 0:
            error_msg = stderr.decode("utf-8", errors="replace")
            logger.error(f"Failed to read log file: {error_msg}")
            raise RuntimeError(f"Failed to read log file: {error_msg}")

        content = stdout
        logger.info(
            f"Log file content: {len(content)} bytes, {content.count(chr(10))} lines"
        )
        if content:
            logger.info(
                f"First line: {content.decode('utf-8', errors='replace').split(chr(10))[0][:100]}"
            )
        else:
            logger.warning("Log file is empty")

        return content

    async def stream_logs(
        self, delay: float = 0.5
    ) -> AsyncGenerator[ParsedLogEntry, None]:
        logger.info(f"Starting log stream from {self.LOG_FILE}")

        try:
            content = await self.get_log_file_content()
            if not content:
                logger.warning("Log file is empty, will wait for new content")

            logger.info("Starting tail process for real-time updates")

            proc = await asyncio.create_subprocess_exec(
                "docker",
                "exec",
                self.container_name,
                "tail",
                "-f",
                self.LOG_FILE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )

            logger.info(f"tail process started with PID={proc.pid}")

            if content:
                lines = content.decode("utf-8", errors="replace").splitlines()
                for line in lines:
                    if line.strip():
                        yield self._parse_log_line(line)
                logger.info(
                    f"Yielded {len(lines)} historical log lines, now waiting for new content"
                )

            stdout = proc.stdout
            stderr = proc.stderr
            empty_reads = 0
            max_empty_reads = 30

            read_task = None

            while True:
                try:
                    line = await asyncio.wait_for(stdout.readline(), timeout=5.0)
                    if not line:
                        empty_reads += 1
                        if empty_reads >= max_empty_reads:
                            logger.warning(
                                f"No log output for {max_empty_reads} reads, stopping stream"
                            )
                            break
                        continue

                    empty_reads = 0
                    decoded_line = line.decode("utf-8", errors="replace").strip()
                    if decoded_line:
                        yield self._parse_log_line(decoded_line)

                except asyncio.TimeoutError:
                    logger.debug("Timeout waiting for log line, continuing...")
                    continue

        except Exception as e:
            logger.exception(f"Error in log streaming: {e}")
            raise RuntimeError(f"Failed to stream logs: {str(e)}")

    async def get_log_file_content(self) -> bytes:
        cmd = ["cat", self.LOG_FILE]
        proc = await self._run_docker_exec(cmd)

        stdout, stderr = await proc.communicate()
        if proc.returncode != 0:
            error_msg = stderr.decode("utf-8", errors="replace")
            raise RuntimeError(f"Failed to read log file: {error_msg}")

        return stdout

    async def get_filtered_logs(
        self, level: Optional[LogLevel] = None, lines: int = 100
    ) -> list[ParsedLogEntry]:
        logs = await self.get_recent_logs(lines * 2)

        if level:
            logs = [log for log in logs if log.level == level]

        return logs[-lines:]


log_service = LogService()
