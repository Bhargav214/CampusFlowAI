from sqlalchemy.orm import Session

from models.student import Student
from models.user import User

from auth.security import hash_password


def create_student(
    db: Session,
    data
):

    existing_user = db.query(User).filter(
        User.email == data.email
    ).first()

    if existing_user:
        raise ValueError("Email already registered")

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        role="student"
    )

    db.add(user)
    db.flush()

    student = Student(
        user_id=user.id,
        roll_number=data.roll_number,
        first_name=data.first_name,
        last_name=data.last_name,
        email=data.email,
        phone=data.phone,
        department=data.department,
        semester=data.semester,
        address=data.address,
    )

    db.add(student)

    db.commit()

    db.refresh(student)

    return student


def get_students(db: Session):

    return db.query(Student).all()


def get_student(
    db: Session,
    student_id: int
):

    return db.query(Student).filter(
        Student.id == student_id
    ).first()


def delete_student(
    db: Session,
    student: Student
):

    if student.user_id:
        user = db.query(User).filter(
            User.id == student.user_id
        ).first()

        if user:
            db.delete(user)

    db.delete(student)
    db.commit()