from database.connection import SessionLocal
from models.user import User
from auth.security import hash_password


db = SessionLocal()

admin = User(
    email="admin@campusflow.com",
    hashed_password=hash_password("Admin@123"),
    role="admin"
)

db.add(admin)
db.commit()

print("Admin created successfully!")

db.close()