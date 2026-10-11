from __future__ import annotations
from typing import TYPE_CHECKING
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.base import Base

if TYPE_CHECKING:
    from models.user import User
    from models.student import Student


class ParentNotification(Base):
    __tablename__ = "parent_notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    parent_user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    student_id: Mapped[int] = mapped_column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    message: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(50), default="general", nullable=False)  # attendance_warning, marks_update, risk_change, general
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    parent_user: Mapped["User"] = relationship("User", foreign_keys=[parent_user_id])
    student: Mapped["Student"] = relationship("Student", foreign_keys=[student_id])
