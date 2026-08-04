from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class SubjectBase(BaseModel):
    subject_code: str = Field(..., max_length=30)
    name: str = Field(..., max_length=100)
    department: Optional[str] = Field(default=None, max_length=100)
    semester: Optional[int] = Field(default=None, ge=1, le=12)
    credit_hours: Optional[float] = Field(default=None, ge=0)
    faculty_id: Optional[int] = None


class SubjectCreate(SubjectBase):
    pass


class SubjectUpdate(BaseModel):
    subject_code: Optional[str] = Field(default=None, max_length=30)
    name: Optional[str] = Field(default=None, max_length=100)
    department: Optional[str] = Field(default=None, max_length=100)
    semester: Optional[int] = Field(default=None, ge=1, le=12)
    credit_hours: Optional[float] = Field(default=None, ge=0)
    faculty_id: Optional[int] = None


class SubjectRead(SubjectBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
