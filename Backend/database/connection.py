import os
import logging

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

logger = logging.getLogger(__name__)

def normalize_database_url(url: str) -> str:
    """
    Normalizes database connection URLs for SQLAlchemy compatibility.
    Hosted providers (Render, Supabase, Neon) often export URLs starting with
    'postgres://', which SQLAlchemy 2.0+ does not support. Converts to 'postgresql://'.
    Preserves 'postgresql://', 'postgresql+psycopg2://', 'sqlite://', etc.
    Does not log credentials or the full database URL.
    """
    if not url:
        return url
    if url.startswith("postgres://"):
        logger.info("Normalizing DATABASE_URL scheme from 'postgres://' to 'postgresql://'")
        return "postgresql://" + url[len("postgres://"):]
    return url


# DATABASE_URL must be set in production via environment variable.
# The fallback below is for LOCAL DEVELOPMENT only and must never be
# used with a production database.
raw_database_url = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:root@localhost:5432/campus_flow"
)

if raw_database_url == "postgresql://postgres:root@localhost:5432/campus_flow":
    logger.warning(
        "DATABASE_URL is using the default local development value. "
        "Set DATABASE_URL in your environment for production."
    )

DATABASE_URL = normalize_database_url(raw_database_url)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()