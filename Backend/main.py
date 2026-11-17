from dotenv import load_dotenv
load_dotenv()

import os
import time
import uuid
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from api.auth import router as auth_router
from api.subject import router as subject_router
from api.faculty import router as faculty_router
from api.student import router as student_router
from api.attendance import router as attendance_router
from api.marks import router as marks_router
from api.etl import router as etl_router
from api.analytics import router as analytics_router
from api.reports import router as reports_router
from api.department import router as department_router
from api.parent import router as parent_router

from database.connection import engine
from database.base import Base
from database.migrations import apply_schema_migrations
from models import *
from analytics.ml.predict import load_model_bundle, is_model_loaded

# ──────────────────────────────────────────────────────────────
# Logging setup
# ──────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("campusflow")


# ──────────────────────────────────────────────────────────────
# Lifespan Management (FastAPI Modern Startup & Shutdown)
# ──────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan context manager:
    1. Initializes database tables and applies migrations safely
    2. Pre-caches ML risk model bundle in memory for instant inference
    """
    logger.info("Initializing database schemas and checking migrations...")
    try:
        Base.metadata.create_all(bind=engine)
        apply_schema_migrations()
    except Exception as exc:
        logger.error(f"Error during DB initialization: {exc}")

    logger.info("Preloading ML risk prediction model into memory...")
    try:
        bundle = load_model_bundle()
        if bundle:
            logger.info("ML risk model loaded and ready in memory.")
        else:
            logger.warning("ML risk model could not be loaded; falling back to heuristic evaluation.")
    except Exception as exc:
        logger.error(f"Failed to preload ML model during startup: {exc}")

    yield

    logger.info("CampusFlow AI API shutting down gracefully.")


# ──────────────────────────────────────────────────────────────
# FastAPI application
# ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="CampusFlow AI API",
    description="Intelligent Campus Data Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)


# ──────────────────────────────────────────────────────────────
# CORS — origins loaded from environment variable
# Set CORS_ORIGINS=https://your-frontend.com in production
# ──────────────────────────────────────────────────────────────

_cors_env = os.environ.get(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173"
)
CORS_ORIGINS = [origin.strip() for origin in _cors_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────────────────────
# Request logging middleware
# Logs: request_id | method | path | status | duration_ms | user_id
# ──────────────────────────────────────────────────────────────

@app.middleware("http")
async def log_requests(request: Request, call_next):
    request_id = str(uuid.uuid4())[:8]
    start = time.perf_counter()

    # Attach request_id so downstream handlers can reference it
    request.state.request_id = request_id

    # Try to extract user sub from JWT without a full decode (no secret needed)
    user_id = "-"
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        try:
            import base64, json as _json
            parts = auth_header.split(".")
            if len(parts) == 3:
                padded = parts[1] + "=" * (-len(parts[1]) % 4)
                payload = _json.loads(base64.urlsafe_b64decode(padded))
                user_id = str(payload.get("sub", "-"))
        except Exception:
            pass

    logger.info(
        f"[{request_id}] --> {request.method} {request.url.path} | user={user_id}"
    )

    try:
        response = await call_next(request)
    except Exception as exc:
        duration_ms = (time.perf_counter() - start) * 1000
        logger.error(
            f"[{request_id}] <-- 500 INTERNAL ERROR | {duration_ms:.1f}ms | {exc}"
        )
        raise

    duration_ms = (time.perf_counter() - start) * 1000
    logger.info(
        f"[{request_id}] <-- {response.status_code} | {duration_ms:.1f}ms"
    )

    response.headers["X-Request-ID"] = request_id
    return response


# ──────────────────────────────────────────────────────────────
# Global exception handler
# Returns a consistent JSON error envelope for unhandled exceptions.
# ──────────────────────────────────────────────────────────────

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    request_id = getattr(request.state, "request_id", "unknown")
    logger.error(
        f"[{request_id}] Unhandled exception: {exc}", exc_info=True
    )
    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_server_error",
            "detail": "An unexpected error occurred.",
            "request_id": request_id,
        },
    )


# ──────────────────────────────────────────────────────────────
# Routers
# ──────────────────────────────────────────────────────────────

app.include_router(auth_router)
app.include_router(student_router)
app.include_router(faculty_router)
app.include_router(subject_router)
app.include_router(attendance_router)
app.include_router(marks_router)
app.include_router(etl_router)
app.include_router(analytics_router)
app.include_router(reports_router)
app.include_router(department_router)
app.include_router(parent_router)


# ──────────────────────────────────────────────────────────────
# Root & Health endpoints
# ──────────────────────────────────────────────────────────────

@app.get("/", tags=["System"])
def root():
    return {"message": "CampusFlow AI API is running"}


@app.get("/health", tags=["System"])
def health():
    """
    Health check endpoint for load balancers, uptime monitors, and deployment pipelines.
    Returns HTTP 200 when the API is running and the database engine is reachable.
    Reports connectivity to database and ML model pre-load status.
    """
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception as exc:
        logger.error(f"Health check DB error: {exc}")
        db_status = "error"

    ml_status = "loaded" if is_model_loaded() else "unavailable"

    payload = {
        "status": "ok" if db_status == "ok" else "degraded",
        "api": "ok",
        "database": db_status,
        "ml_model": ml_status,
        "version": "1.0.0"
    }
    status_code = 200 if db_status == "ok" else 503
    return JSONResponse(content=payload, status_code=status_code)