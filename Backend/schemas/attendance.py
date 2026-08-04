from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class AttendanceBase(BaseModel):
    student_id: int
    subject_id: int
    date: datetime
    status: str = Field(..., max_length=20)
    remarks: Optional[str] = Field(default=None, max_length=255)


class AttendanceCreate(AttendanceBase):
    pass


class AttendanceUpdate(BaseModel):
    student_id: Optional[int] = None
    subject_id: Optional[int] = None
    date: Optional[datetime] = None
    status: Optional[str] = Field(default=None, max_length=20)
    remarks: Optional[str] = Field(default=None, max_length=255)


class AttendanceRead(AttendanceBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
