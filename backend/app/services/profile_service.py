import json
import logging
import uuid
from typing import Optional, List
from datetime import datetime

from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Profile
from app.models.vllm import ModelLaunchConfig

logger = logging.getLogger(__name__)


def config_to_json(config: ModelLaunchConfig) -> str:
    return json.dumps(config.model_dump())


def json_to_config(json_str: str) -> ModelLaunchConfig:
    data = json.loads(json_str)
    return ModelLaunchConfig(**data)


class ProfileService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_profile(
        self,
        name: str,
        description: Optional[str],
        model_id: str,
        config: ModelLaunchConfig,
        favorite: bool = False,
    ) -> Profile:
        profile_id = str(uuid.uuid4())
        config_json = config_to_json(config)

        profile = Profile(
            id=profile_id,
            name=name,
            description=description,
            model_id=model_id,
            config_json=config_json,
            favorite=favorite,
        )

        self.session.add(profile)
        await self.session.commit()
        await self.session.refresh(profile)

        logger.info(f"Created profile: {profile_id} - {name}")
        return profile

    async def get_profile(self, profile_id: str) -> Optional[Profile]:
        result = await self.session.execute(
            select(Profile).where(Profile.id == profile_id)
        )
        return result.scalar_one_or_none()

    async def get_profile_by_name(self, name: str) -> Optional[Profile]:
        result = await self.session.execute(select(Profile).where(Profile.name == name))
        return result.scalar_one_or_none()

    async def list_profiles(
        self, include_favorites_only: bool = False
    ) -> List[Profile]:
        query = select(Profile).order_by(Profile.created_at.desc())
        if include_favorites_only:
            query = query.where(Profile.favorite == True)

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def update_profile(
        self,
        profile_id: str,
        name: Optional[str] = None,
        description: Optional[str] = None,
        model_id: Optional[str] = None,
        config: Optional[ModelLaunchConfig] = None,
        favorite: Optional[bool] = None,
    ) -> Optional[Profile]:
        profile = await self.get_profile(profile_id)
        if profile is None:
            return None

        updates = {}
        if name is not None:
            updates["name"] = name
        if description is not None:
            updates["description"] = description
        if model_id is not None:
            updates["model_id"] = model_id
        if config is not None:
            updates["config_json"] = config_to_json(config)
        if favorite is not None:
            updates["favorite"] = favorite

        updates["updated_at"] = datetime.utcnow()

        await self.session.execute(
            update(Profile).where(Profile.id == profile_id).values(**updates)
        )
        await self.session.commit()

        await self.session.refresh(profile)
        logger.info(f"Updated profile: {profile_id}")
        return profile

    async def delete_profile(self, profile_id: str) -> bool:
        profile = await self.get_profile(profile_id)
        if profile is None:
            return False

        await self.session.delete(profile)
        await self.session.commit()

        logger.info(f"Deleted profile: {profile_id}")
        return True

    async def import_profiles(self, json_data: str) -> int:
        try:
            profiles_data = json.loads(json_data)
            if not isinstance(profiles_data, list):
                profiles_data = [profiles_data]

            imported_count = 0
            for profile_data in profiles_data:
                name = profile_data.get("name")
                description = profile_data.get("description")
                model_id = profile_data.get("model_id")
                config_data = profile_data.get("config", {})

                if not name or not model_id:
                    logger.warning(
                        f"Skipping profile without name or model_id: {profile_data}"
                    )
                    continue

                try:
                    config = ModelLaunchConfig(**config_data)
                    await self.create_profile(
                        name=name,
                        description=description,
                        model_id=model_id,
                        config=config,
                        favorite=profile_data.get("favorite", False),
                    )
                    imported_count += 1
                except Exception as e:
                    logger.error(f"Error importing profile {name}: {e}")
                    continue

            logger.info(f"Imported {imported_count} profiles")
            return imported_count

        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON for import: {e}")
            raise ValueError("Invalid JSON format for import")

    async def export_profiles(self, profile_ids: Optional[List[str]] = None) -> str:
        if profile_ids:
            profiles = []
            for pid in profile_ids:
                profile = await self.get_profile(pid)
                if profile:
                    profiles.append(profile.to_dict())
        else:
            profiles = await self.list_profiles()

        export_data = [p.to_dict() for p in profiles]
        return json.dumps(export_data, indent=2)

    async def get_config_from_profile(
        self, profile_id: str
    ) -> Optional[ModelLaunchConfig]:
        profile = await self.get_profile(profile_id)
        if profile is None:
            return None

        try:
            return json_to_config(profile.config_json)
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing config for profile {profile_id}: {e}")
            return None


async def seed_default_profiles(session: AsyncSession):
    service = ProfileService(session)

    glm47_config = ModelLaunchConfig(
        model_id="THUDM/glm-4-7b-chat-awq",
        tensor_parallel=1,
        gpu_memory_utilization=0.9,
        max_model_len=32768,
        enable_auto_tool_choice=False,
        tool_call_parser=None,
        reasoning_parser=None,
        trust_remote_code=True,
        load_format="auto",
        port=8000,
    )

    minimax_config = ModelLaunchConfig(
        model_id="MiniMaxAI/MiniMax-M2.1-AWQ",
        tensor_parallel=1,
        gpu_memory_utilization=0.9,
        max_model_len=32768,
        enable_auto_tool_choice=False,
        tool_call_parser=None,
        reasoning_parser=None,
        trust_remote_code=True,
        load_format="auto",
        port=8000,
    )

    default_profiles = [
        {
            "name": "GLM-4.7B-AWQ",
            "description": "GLM-4 7B quantized with AWQ for efficient inference",
            "model_id": "THUDM/glm-4-7b-chat-awq",
            "config": glm47_config,
            "favorite": True,
        },
        {
            "name": "MiniMax-M2.1-AWQ",
            "description": "MiniMax M2.1 model quantized with AWQ",
            "model_id": "MiniMaxAI/MiniMax-M2.1-AWQ",
            "config": minimax_config,
            "favorite": True,
        },
    ]

    for profile_data in default_profiles:
        existing = await service.get_profile_by_name(profile_data["name"])
        if existing is None:
            await service.create_profile(
                name=profile_data["name"],
                description=profile_data["description"],
                model_id=profile_data["model_id"],
                config=profile_data["config"],
                favorite=profile_data["favorite"],
            )
            logger.info(f"Seeded default profile: {profile_data['name']}")

    logger.info("Default profiles seeded")
