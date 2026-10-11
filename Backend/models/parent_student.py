from __future__ import annotations
from typing import TYPE_CHECKING
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.base import Base

if TYPE_CHECKING:
    from models.user import User
    from models.student import Student


class ParentStudentLink(Base):
    __tablename__ = "parent_student_links"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    parent_user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    student_id: Mapped[int] = mapped_column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    relationship_type: Mapped[str] = mapped_column(String(50), default="parent", nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)  # pending, approved, revoked
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    approved_by: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)

    parent_user: Mapped["User"] = relationship("User", foreign_keys=[parent_user_id])
    student: Mapped["Student"] = relationship("Student", foreign_keys=[student_id])
    approver: Mapped["User | None"] = relationship("User", foreign_keys=[approved_by])
