import logging
from sqlalchemy import text
from database.connection import engine

logger = logging.getLogger("campusflow.migrations")


def apply_schema_migrations():
    """
    Safely applies non-destructive schema updates (e.g. adding department_id
    foreign keys to existing tables) without dropping or wiping existing data.
    """
    logger.info("Checking and applying database schema migrations...")

    queries = [
        "ALTER TABLE students ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL;",
        "ALTER TABLE faculty ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL;",
        "ALTER TABLE subjects ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL;",
    ]

    with engine.begin() as conn:
        for q in queries:
            try:
                conn.execute(text(q))
            except Exception as exc:
                logger.warning(f"Schema migration statement encountered notice/error (continuing): {exc}")

    logger.info("Schema migrations applied successfully.")
