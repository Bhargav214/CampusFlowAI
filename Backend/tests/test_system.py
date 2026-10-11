"""
Tests for the /health and / endpoints.
"""

import pytest


class TestSystemEndpoints:

    def test_root_returns_200(self, client, db):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data

    def test_health_returns_200_or_503(self, client, db):
        """
        /health must return 200 (db ok) or 503 (db unreachable).
        It must never return a 5xx crash or missing fields.
        """
        response = client.get("/health")
        assert response.status_code in (200, 503)

        data = response.json()
        assert "status" in data
        assert "api" in data
        assert "database" in data
        assert "version" in data
        assert data["api"] == "ok"

    def test_health_db_status_is_string(self, client, db):
        response = client.get("/health")
        data = response.json()
        assert isinstance(data["database"], str)
        assert data["database"] in ("ok", "error")
