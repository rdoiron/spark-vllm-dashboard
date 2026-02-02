from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    spark_docker_path: str = "/home/user/spark-vllm-docker"
    container_name: str = "vllm_node"
    head_node_ip: str = "192.168.5.157"
    worker_node_ips: str = "192.168.5.212"
    vllm_port: int = 8000
    api_port: int = 8080
    hf_cache_dir: str = "/root/.cache/huggingface/hub"

    class Config:
        env_prefix = "SPARK_"


settings = Settings()
