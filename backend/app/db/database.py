import logging
from pathlib import Path
from typing import AsyncGenerator

from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import sessionmaker, Session

from app.config import settings

logger = logging.getLogger(__name__)

PROFILES_DIR = Path.home() / ".spark-dashboard"
PROFILES_DIR.mkdir(parents=True, exist_ok=True)

DATABASE_PATH = PROFILES_DIR / "profiles.db"
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

ASYNC_DATABASE_URL = f"sqlite+aiosqlite:///{DATABASE_PATH}"

engine = create_engine(DATABASE_URL, echo=False)
async_engine = create_async_engine(ASYNC_DATABASE_URL, echo=False)

async_session_maker = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()


def get_sync_session() -> Session:
    session = SessionLocal()
    try:
        return session
    finally:
        pass


async def init_database():
    from app.db.models import Base

    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    logger.info(f"Database initialized at {DATABASE_PATH}")
