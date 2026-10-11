from sqlalchemy.orm import Session

from models.faculty import Faculty
from models.user import User

from auth.security import hash_password


def create_faculty(
    db: Session,
    data
):

    # Check whether email already exists
    existing_user = db.query(User).filter(
        User.email == data.email
    ).first()

    if existing_user:
        raise ValueError(
            "Email already registered"
        )

    # Check faculty ID
    existing_faculty = db.query(Faculty).filter(
        Faculty.faculty_id == data.faculty_id
    ).first()

    if existing_faculty:
        raise ValueError(
            "Faculty ID already exists"
        )

    # Create login account
    user = User(
        email=data.email,
        hashed_password=hash_password(
            data.password
        ),
        role="faculty"
    )

    db.add(user)

    # Get generated user ID
    db.flush()

    # Create faculty profile
    faculty = Faculty(
        user_id=user.id,
        faculty_id=data.faculty_id,
        first_name=data.first_name,
        last_name=data.last_name,
        email=data.email,
        phone=data.phone,
        department=data.department,
        designation=data.designation
    )

    db.add(faculty)

    db.commit()

    db.refresh(faculty)

    return faculty


def get_faculties(db: Session):

    return db.query(Faculty).all()


def get_faculty(
    db: Session,
    faculty_id: int
):

    return db.query(Faculty).filter(
        Faculty.id == faculty_id
    ).first()


def delete_faculty(
    db: Session,
    faculty: Faculty
):

    if faculty.user_id:

        user = db.query(User).filter(
            User.id == faculty.user_id
        ).first()

        if user:
            db.delete(user)

    db.delete(faculty)

    db.commit()