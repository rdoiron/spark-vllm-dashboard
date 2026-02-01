import logging
from datetime import datetime
from pathlib import Path
from typing import Optional, Any
from app.config import settings
from app.db.database import async_session_maker, get_sync_session
from app.db.models import Config

logger = logging.getLogger(__name__)


class ConfigService:
    def __init__(self):
        self._cache: Optional[dict] = None
        self._cache_valid = False

    def _get_default_config(self) -> dict:
        return {
            "spark_docker_path": settings.spark_docker_path,
            "container_name": settings.container_name,
            "head_node_ip": settings.head_node_ip,
            "worker_node_ips": settings.worker_node_ips.split(",")
            if settings.worker_node_ips
            else [],
            "vllm_port": settings.vllm_port,
        }

    def _config_from_db(self, config_db: Optional[Config]) -> Optional[dict]:
        if config_db is None:
            return None
        worker_ips = config_db.worker_node_ips
        if worker_ips:
            worker_ips = worker_ips.split(",")
        return {
            "id": config_db.id,
            "spark_docker_path": config_db.spark_docker_path,
            "container_name": config_db.container_name,
            "head_node_ip": config_db.head_node_ip,
            "worker_node_ips": worker_ips,
            "vllm_port": config_db.vllm_port,
            "created_at": config_db.created_at.isoformat()
            if config_db.created_at
            else None,
            "updated_at": config_db.updated_at.isoformat()
            if config_db.updated_at
            else None,
        }

    def get_spark_docker_path(self) -> Path:
        config = self.get_config()
        path_str = config.get("spark_docker_path", "/home/user/spark-vllm-docker")
        return Path(path_str)

    def get_container_name(self) -> str:
        config = self.get_config()
        return config.get("container_name", "vllm_node")

    def get_head_node_ip(self) -> str:
        config = self.get_config()
        return config.get("head_node_ip", "192.168.5.157")

    def get_worker_node_ips(self) -> list[str]:
        config = self.get_config()
        return config.get("worker_node_ips", ["192.168.5.212"])

    def get_vllm_port(self) -> int:
        config = self.get_config()
        return config.get("vllm_port", 8000)

    def get_config(self) -> dict:
        if self._cache_valid:
            return self._cache

        try:
            session = get_sync_session()
            try:
                config_db = session.query(Config).filter_by(id="default").first()
                if config_db:
                    config_dict = self._config_from_db(config_db)
                    if config_dict:
                        self._cache = config_dict
                        self._cache_valid = True
                        return config_dict
            finally:
                session.close()
        except Exception as e:
            logger.warning(f"Failed to read config from database: {e}")

        default_config = self._get_default_config()
        self._cache = default_config
        self._cache_valid = True
        return default_config

    def update_config(
        self,
        spark_docker_path: Optional[str] = None,
        container_name: Optional[str] = None,
        head_node_ip: Optional[str] = None,
        worker_node_ips: Optional[list[str]] = None,
        vllm_port: Optional[int] = None,
    ) -> dict:
        try:
            session = get_sync_session()
            try:
                config_db = session.query(Config).filter_by(id="default").first()
                if not config_db:
                    config_db = Config(id="default")
                    session.add(config_db)
                    session.flush()

                if spark_docker_path is not None:
                    config_db.spark_docker_path = spark_docker_path
                if container_name is not None:
                    config_db.container_name = container_name
                if head_node_ip is not None:
                    config_db.head_node_ip = head_node_ip
                if worker_node_ips is not None:
                    config_db.worker_node_ips = ",".join(worker_node_ips)
                if vllm_port is not None:
                    config_db.vllm_port = vllm_port

                config_db.updated_at = datetime.utcnow()
                session.commit()

                self._cache = None
                self._cache_valid = False

                return self.get_config()
            finally:
                session.close()
        except Exception as e:
            logger.error(f"Failed to update config: {e}")
            raise

    def invalidate_cache(self):
        self._cache = None
        self._cache_valid = False


config_service = ConfigService()
