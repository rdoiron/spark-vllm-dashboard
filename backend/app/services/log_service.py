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
        timestamp_pattern = (
            r"(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)"
        )
        level_pattern = r"(DEBUG|INFO|WARNING|ERROR|CRITICAL)"

        timestamp_match = re.search(timestamp_pattern, line)
        level_match = re.search(level_pattern, line, re.IGNORECASE)

        if timestamp_match:
            timestamp = timestamp_match.group(1)
        else:
            timestamp = datetime.utcnow().isoformat() + "Z"

        if level_match:
            level_str = level_match.group(1).upper()
            try:
                level = LogLevel(level_str)
            except ValueError:
                level = LogLevel.INFO
        else:
            level = LogLevel.INFO

        message_start = 0
        if timestamp_match:
            message_start = timestamp_match.end()
        if level_match:
            message_start = max(message_start, level_match.end())

        message = line[message_start:].strip()
        if message.startswith(":"):
            message = message[1:].strip()
        elif message.startswith(" - "):
            message = message[3:].strip()

        if not message:
            message = line.strip()

        return ParsedLogEntry(
            timestamp=timestamp,
            level=level,
            message=message,
            raw_line=line.strip(),
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

    async def stream_logs(
        self, delay: float = 0.5
    ) -> AsyncGenerator[ParsedLogEntry, None]:
        proc = None
        try:
            logger.info(f"Starting log stream from {self.LOG_FILE}")
            cmd = ["tail", "-f", self.LOG_FILE]
            proc = await self._run_docker_exec(cmd)
            logger.info(f"tail process started with returncode={proc.returncode}")

            if proc.returncode != 0:
                stderr = b""
                try:
                    _, stderr = await proc.communicate()
                except Exception as e:
                    logger.warning(f"Error communicating with tail process: {e}")
                error_msg = (
                    stderr.decode("utf-8", errors="replace").strip()
                    or "Unknown Docker error"
                )
                logger.error(f"Docker command failed: {error_msg}")
                raise RuntimeError(f"Docker command failed: {error_msg}")

            logger.info("Reading log lines from tail output")
            stdout = proc.stdout
            line_count = 0
            empty_reads = 0
            max_empty_reads = 10

            while stdout and True:
                line = await stdout.readline()
                if not line:
                    empty_reads += 1
                    if empty_reads >= max_empty_reads:
                        logger.warning(
                            f"No log output for {max_empty_reads} consecutive reads, stopping stream"
                        )
                        break
                    continue

                empty_reads = 0
                decoded_line = line.decode("utf-8", errors="replace").strip()
                if not decoded_line:
                    continue

                line_count += 1
                if line_count <= 5:
                    logger.info(f"Log line #{line_count}: {decoded_line[:100]}")

                try:
                    parsed = self._parse_log_line(decoded_line)
                    yield parsed
                except Exception as e:
                    logger.warning(
                        f"Failed to parse log line: {decoded_line[:50]}... Error: {e}"
                    )
                    yield ParsedLogEntry(
                        timestamp=datetime.utcnow().isoformat() + "Z",
                        level=LogLevel.INFO,
                        message=decoded_line,
                        raw_line=decoded_line,
                    )

            logger.info(f"Log stream ended after {line_count} lines")

        except asyncio.CancelledError:
            logger.info("Log stream cancelled")
            raise
        except RuntimeError:
            raise
        except Exception as e:
            logger.exception(f"Error in log streaming: {e}")
            raise RuntimeError(f"Failed to stream logs: {str(e)}")
        finally:
            if proc:
                try:
                    proc.terminate()
                    await proc.wait()
                    logger.info("tail process terminated")
                except Exception as e:
                    logger.warning(f"Error terminating tail process: {e}")

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
