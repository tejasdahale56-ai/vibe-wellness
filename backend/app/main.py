from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, engine, ensure_firebase_uid_schema
from . import models

from .api.biometrics import router as biometrics_router
from .api.meals import router as meals_router
from .api.experiments import router as experiments_router
from .api.patterns import router as patterns_router
from .api.insights import router as insights_router
from .api.dashboard import router as dashboard_router
from .api.analytics import router as analytics_router
from .api.chat import router as chat_router
from .api.auth import router as auth_router


Base.metadata.create_all(bind=engine)
ensure_firebase_uid_schema()


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(biometrics_router)
app.include_router(meals_router)
app.include_router(experiments_router)
app.include_router(patterns_router)
app.include_router(insights_router)
app.include_router(dashboard_router)
app.include_router(analytics_router)
app.include_router(chat_router)
app.include_router(auth_router)


@app.get("/")
def root():
    return {
        "message": "VIBE Wellness API is running",
        "status": "ok",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
    }
