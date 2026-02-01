import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import cluster, model, metrics, logs, profiles
from app.db.database import init_database
from app.services.profile_service import seed_default_profiles

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database...")
    await init_database()

    logger.info("Seeding default profiles...")
    from app.db.database import async_session_maker

    async with async_session_maker() as session:
        await seed_default_profiles(session)

    logger.info("Startup complete!")
    yield
    logger.info("Shutting down...")


app = FastAPI(
    title="Spark vLLM Dashboard API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cluster.router, prefix="/api")
app.include_router(model.router, prefix="/api")
app.include_router(metrics.router, prefix="/api")
app.include_router(logs.router, prefix="/api")
app.include_router(profiles.router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "Spark vLLM Dashboard API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
