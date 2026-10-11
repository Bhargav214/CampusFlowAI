from dotenv import load_dotenv
load_dotenv()

from database.connection import engine
from database.base import Base
import models  # This forces all models to register

print("Registered tables in SQLAlchemy:", Base.metadata.tables.keys())

print("Creating tables in Postgres...")
Base.metadata.create_all(bind=engine)
print("Done!")