from fastapi import APIRouter

router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.get("/")
async def list_profiles():
    pass


@router.post("/")
async def create_profile():
    pass


@router.get("/{profile_id}")
async def get_profile(profile_id: str):
    pass


@router.put("/{profile_id}")
async def update_profile(profile_id: str):
    pass


@router.delete("/{profile_id}")
async def delete_profile(profile_id: str):
    pass
