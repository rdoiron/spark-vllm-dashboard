from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional

from pydantic import BaseModel

from app.db.database import get_async_session
from app.db.models import Profile
from app.services.profile_service import ProfileService
from app.models.vllm import ModelLaunchConfig
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/profiles", tags=["profiles"])


async def get_profile_service(
    session: AsyncSession = Depends(get_async_session),
) -> ProfileService:
    return ProfileService(session)


class ProfileCreate(BaseModel):
    name: str
    description: Optional[str] = None
    model_id: str
    config: ModelLaunchConfig
    favorite: bool = False


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    model_id: Optional[str] = None
    config: Optional[ModelLaunchConfig] = None
    favorite: Optional[bool] = None


class ProfileResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    model_id: str
    config: dict
    favorite: bool
    created_at: Optional[str]
    updated_at: Optional[str]


class ImportRequest(BaseModel):
    json_data: str


class ExportResponse(BaseModel):
    profiles_json: str
    count: int


class LaunchFromProfileResponse(BaseModel):
    success: bool
    message: str
    profile_id: str
    model_id: str


def profile_to_response(profile: Profile) -> ProfileResponse:
    import json

    config_dict = {}
    try:
        config_dict = json.loads(profile.config_json)
    except Exception:
        pass

    return ProfileResponse(
        id=profile.id,
        name=profile.name,
        description=profile.description,
        model_id=profile.model_id,
        config=config_dict,
        favorite=profile.favorite,
        created_at=profile.created_at.isoformat()
        if profile.created_at is not None
        else None,
        updated_at=profile.updated_at.isoformat()
        if profile.updated_at is not None
        else None,
    )


@router.get("/", response_model=List[ProfileResponse])
async def list_profiles(
    favorites_only: bool = False,
    service: ProfileService = Depends(get_profile_service),
):
    profiles = await service.list_profiles(include_favorites_only=favorites_only)
    return [profile_to_response(p) for p in profiles]


@router.post("/", response_model=ProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_profile(
    profile_data: ProfileCreate,
    service: ProfileService = Depends(get_profile_service),
):
    profile = await service.create_profile(
        name=profile_data.name,
        description=profile_data.description,
        model_id=profile_data.model_id,
        config=profile_data.config,
        favorite=profile_data.favorite,
    )
    return profile_to_response(profile)


@router.get("/{profile_id}", response_model=ProfileResponse)
async def get_profile(
    profile_id: str,
    service: ProfileService = Depends(get_profile_service),
):
    profile = await service.get_profile(profile_id)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile {profile_id} not found",
        )
    return profile_to_response(profile)


@router.put("/{profile_id}", response_model=ProfileResponse)
async def update_profile(
    profile_id: str,
    update_data: ProfileUpdate,
    service: ProfileService = Depends(get_profile_service),
):
    profile = await service.update_profile(
        profile_id=profile_id,
        name=update_data.name,
        description=update_data.description,
        model_id=update_data.model_id,
        config=update_data.config,
        favorite=update_data.favorite,
    )
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile {profile_id} not found",
        )
    return profile_to_response(profile)


@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_profile(
    profile_id: str,
    service: ProfileService = Depends(get_profile_service),
):
    deleted = await service.delete_profile(profile_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile {profile_id} not found",
        )


@router.post("/{profile_id}/launch", response_model=LaunchFromProfileResponse)
async def launch_from_profile(
    profile_id: str,
    service: ProfileService = Depends(get_profile_service),
):
    from app.services.vllm_service import vllm_service

    profile = await service.get_profile(profile_id)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile {profile_id} not found",
        )

    config = await service.get_config_from_profile(profile_id)
    if config is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse configuration for profile {profile_id}",
        )

    result = await vllm_service.launch_model(config)

    return LaunchFromProfileResponse(
        success=result.success,
        message=result.message,
        profile_id=profile_id,
        model_id=profile.model_id,
    )


@router.post("/import", response_model=dict)
async def import_profiles(
    import_request: ImportRequest,
    service: ProfileService = Depends(get_profile_service),
):
    try:
        count = await service.import_profiles(import_request.json_data)
        return {"imported": count, "message": f"Successfully imported {count} profiles"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Import failed: {str(e)}",
        )


@router.get("/export", response_model=ExportResponse)
async def export_profiles(
    service: ProfileService = Depends(get_profile_service),
):
    profiles_json = await service.export_profiles()
    import json

    count = 0
    if profiles_json.strip():
        try:
            profiles_list = json.loads(profiles_json)
            count = len(profiles_list)
        except Exception:
            pass

    return ExportResponse(
        profiles_json=profiles_json,
        count=count,
    )


@router.get("/favorites", response_model=List[ProfileResponse])
async def get_favorites(
    service: ProfileService = Depends(get_profile_service),
):
    profiles = await service.list_profiles(include_favorites_only=True)
    return [profile_to_response(p) for p in profiles]
