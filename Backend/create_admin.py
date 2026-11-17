"""
CampusFlow AI — One-Time Administrator Account Provisioning Script
=================================================================

Safely creates an administrator user in the target database without
hardcoding credentials, altering schemas, or modifying academic data.

Requirements satisfied:
1. Reuses existing SQLAlchemy configuration, normalize_database_url, and User model.
2. Connects ONLY when an external connection URL is explicitly provided via
   the PRODUCTION_DATABASE_URL or DATABASE_URL environment variable.
3. Securely prompts for email and password (using getpass); never prints secrets.
4. Uses auth.security.hash_password() for identical password hashing.
5. Idempotent: Checks whether the email already exists and halts safely without overwriting.
6. Does not seed any student, faculty, attendance, or academic data.
7. Wrapped in explicit transaction management with rollback on any failure.
"""

import os
import sys
import re
import getpass
from urllib.parse import urlparse

# Ensure the Backend directory is in Python's import search path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if SCRIPT_DIR not in sys.path:
    sys.path.insert(0, SCRIPT_DIR)

from dotenv import load_dotenv
# Load local .env only for fallback application variables (e.g., SECRET_KEY)
load_dotenv(os.path.join(SCRIPT_DIR, ".env"))
os.environ.setdefault("SECRET_KEY", "temporary-provisioning-key")

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database.connection import normalize_database_url
from models.user import User
from auth.security import hash_password


EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def mask_url_host(url: str) -> str:
    """Extracts host and db name safely without printing credentials."""
    try:
        parsed = urlparse(url)
        host = parsed.hostname or "unknown-host"
        port = f":{parsed.port}" if parsed.port else ""
        db_name = parsed.path.lstrip("/") or "unknown-db"
        return f"{host}{port} (database: {db_name})"
    except Exception:
        return "masked-host"


def main():
    print("=" * 65)
    print(" CampusFlow AI — Administrator Provisioning Utility")
    print("=" * 65)

    # 1. Check for explicitly provided external database URL
    raw_url = os.environ.get("PRODUCTION_DATABASE_URL") or os.environ.get("DATABASE_URL")

    if not raw_url:
        print("\n[ERROR] No database URL found in environment variables.")
        print("To provision the production administrator, provide the external URL via:")
        print('  $env:PRODUCTION_DATABASE_URL = "postgres://..."')
        print("  python create_admin.py\n")
        sys.exit(1)

    # Guard against accidental execution on local default when expecting production
    lower_url = raw_url.lower()
    if "localhost" in lower_url or "127.0.0.1" in lower_url:
        print("\n[BLOCKED] The provided DATABASE_URL points to localhost/127.0.0.1.")
        print("This provisioning script is configured for remote/production databases.")
        print("Please provide the external database connection string from Render.")
        sys.exit(1)

    masked_target = mask_url_host(raw_url)
    print(f"\n[INFO] Target database: {masked_target}")

    # 2. Secure interactive prompts
    print("\n--- Enter Admin Credentials ---")
    admin_email = input("Admin Email: ").strip().lower()

    if not admin_email or not EMAIL_REGEX.match(admin_email):
        print("[ERROR] Invalid email address format.")
        sys.exit(1)

    admin_password = getpass.getpass("Admin Password (min 8 chars): ")
    if len(admin_password) < 8:
        print("[ERROR] Password must be at least 8 characters long.")
        sys.exit(1)

    confirm_password = getpass.getpass("Confirm Admin Password: ")
    if admin_password != confirm_password:
        print("[ERROR] Passwords do not match.")
        sys.exit(1)

    # 3. Establish database connection using existing normalization & pooling
    target_url = normalize_database_url(raw_url)
    print("\n[INFO] Connecting to database...")

    try:
        engine = create_engine(target_url, pool_pre_ping=True)
        Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        session = Session()
    except Exception as exc:
        print(f"[ERROR] Failed to initialize database connection: {exc.__class__.__name__}")
        sys.exit(1)

    # 4. Check whether admin account already exists (Idempotent check)
    try:
        existing_user = session.query(User).filter(User.email == admin_email).first()
        if existing_user:
            print(f"\n[INFO] An account with email '{admin_email}' already exists in this database.")
            print(f"[INFO] Existing user ID: {existing_user.id} | Role: {existing_user.role} | Active: {existing_user.is_active}")
            print("[INFO] Safety rule triggered: No changes were made and the existing password was NOT modified.")
            print("\nNext step: You can log in directly using this email and its existing password at:")
            print("  https://campus-flow-ai-eight.vercel.app")
            session.close()
            engine.dispose()
            return

        # 5. Hash password and insert the new administrator
        print("[INFO] Account does not exist. Creating administrator...")
        hashed = hash_password(admin_password)

        new_admin = User(
            email=admin_email,
            hashed_password=hashed,
            role="admin",
            is_active=True
        )

        session.add(new_admin)
        session.commit()
        session.refresh(new_admin)

        print("\n" + "=" * 65)
        print(f"[SUCCESS] Admin user '{new_admin.email}' created successfully!")
        print(f"[SUCCESS] Role: '{new_admin.role}' | User ID: {new_admin.id}")
        print("=" * 65)
        print("\nNext step: You can now log in at:")
        print("  https://campus-flow-ai-eight.vercel.app")

    except Exception as exc:
        session.rollback()
        print(f"\n[ERROR] Database transaction failed. All changes rolled back.")
        print(f"[ERROR] Reason: {exc.__class__.__name__}")
        sys.exit(1)
    finally:
        session.close()
        engine.dispose()


if __name__ == "__main__":
    main()