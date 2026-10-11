"""
CampusFlow AI — Integration Test Suite
========================================

Tests are written against an in-memory SQLite database so they run
completely isolated from your real PostgreSQL instance.

Run with:
    cd Backend
    pytest tests/ -v

Or against a specific test file:
    pytest tests/test_data_isolation.py -v
"""
