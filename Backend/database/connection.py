import os
import logging

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

logger = logging.getLogger(__name__)

# DATABASE_URL must be set in production via environment variable.
# The fallback below is for LOCAL DEVELOPMENT only and must never be
# used with a production database.
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:root@localhost:5432/campus_flow"
)

if DATABASE_URL == "postgresql://postgres:root@localhost:5432/campus_flow":
    logger.warning(
        "DATABASE_URL is using the default local development value. "
        "Set DATABASE_URL in your environment for production."
    )

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()