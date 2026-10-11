from __future__ import annotations
from typing import TYPE_CHECKING
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Boolean, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.base import Base

if TYPE_CHECKING:
    from models.faculty import Faculty
    from models.student import Student
    from models.subject import Subject


department_subject_association = Table(
    "department_subject_association",
    Base.metadata,
    Column("department_id", Integer, ForeignKey("departments.id"), primary_key=True),
    Column("subject_id", Integer, ForeignKey("subjects.id"), primary_key=True),
)


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    department_code: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)
    department_name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    head_of_department_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("faculty.id", use_alter=True, name="fk_department_head_faculty"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    head_of_department: Mapped[Faculty | None] = relationship(
        "Faculty",
        foreign_keys=[head_of_department_id],
    )
    students: Mapped[list[Student]] = relationship("Student", back_populates="department_rel")
    faculty_members: Mapped[list[Faculty]] = relationship(
        "Faculty",
        foreign_keys="Faculty.department_id",
        back_populates="department_rel",
    )
    subjects: Mapped[list[Subject]] = relationship(
        "Subject",
        secondary=department_subject_association,
        back_populates="departments",
    )
