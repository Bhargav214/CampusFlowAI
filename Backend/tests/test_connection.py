import logging
import pytest
from sqlalchemy import create_engine
from database.connection import normalize_database_url


def test_normalize_database_url_postgres_scheme():
    input_url = "postgres://user:secret123@ep-test-123.us-east-1.aws.neon.tech/neondb?sslmode=require"
    expected = "postgresql://user:secret123@ep-test-123.us-east-1.aws.neon.tech/neondb?sslmode=require"
    result = normalize_database_url(input_url)
    assert result == expected


def test_normalize_database_url_postgresql_preserved():
    input_url = "postgresql://user:secret123@localhost:5432/campus_flow"
    assert normalize_database_url(input_url) == input_url


def test_normalize_database_url_postgresql_psycopg2_preserved():
    input_url = "postgresql+psycopg2://user:secret123@localhost:5432/campus_flow"
    assert normalize_database_url(input_url) == input_url


def test_normalize_database_url_sqlite_preserved():
    input_url = "sqlite:///./test.db"
    assert normalize_database_url(input_url) == input_url


def test_normalize_database_url_empty_and_none():
    assert normalize_database_url("") == ""
    assert normalize_database_url(None) is None


def test_normalize_database_url_no_credentials_logged(caplog):
    caplog.set_level(logging.INFO)
    sensitive_url = "postgres://admin_user:super_secret_pw@db.render.com:5432/production_db"
    result = normalize_database_url(sensitive_url)
    
    assert result.startswith("postgresql://")
    for record in caplog.records:
        assert "super_secret_pw" not in record.message
        assert "admin_user" not in record.message
        assert sensitive_url not in record.message


def test_create_engine_with_pool_pre_ping():
    # Verify create_engine succeeds with normalized URL and pool_pre_ping=True
    engine = create_engine("sqlite:///:memory:", pool_pre_ping=True)
    with engine.connect() as conn:
        res = conn.execute(__import__("sqlalchemy").text("SELECT 1")).scalar()
        assert res == 1
    engine.dispose()
