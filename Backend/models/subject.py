from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from models.faculty import Faculty
    from models.student import Student
    from models.marks import Mark
    from models.attendence import Attendance
    
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Table, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.base import Base


student_subject_association = Table(
    "student_subject_association",
    Base.metadata,
    Column("student_id", Integer, ForeignKey("students.id"), primary_key=True),
    Column("subject_id", Integer, ForeignKey("subjects.id"), primary_key=True),
)


class Subject(Base):
    __tablename__ = "subjects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    subject_code: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    department: Mapped[str | None] = mapped_column(String(100), nullable=True)
    semester: Mapped[int | None] = mapped_column(Integer, nullable=True)
    credit_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    faculty_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("faculty.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    faculty: Mapped["Faculty | None"] = relationship(back_populates="subjects")
    students: Mapped[list["Student"]] = relationship(
        secondary=student_subject_association,
        back_populates="subjects",
    )
    marks: Mapped[list["Mark"]] = relationship(back_populates="subject", cascade="all, delete-orphan")
    attendances: Mapped[list["Attendance"]] = relationship(
        back_populates="subject",
        cascade="all, delete-orphan",
    )
