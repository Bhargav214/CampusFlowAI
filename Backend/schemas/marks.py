from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class MarkBase(BaseModel):
    student_id: int
    subject_id: int
    exam_type: str = Field(..., max_length=50)
    marks_obtained: float = Field(..., ge=0)
    max_marks: float = Field(..., ge=0)
    grade: Optional[str] = Field(default=None, max_length=10)


class MarkCreate(MarkBase):
    pass


class MarkUpdate(BaseModel):
    student_id: Optional[int] = None
    subject_id: Optional[int] = None
    exam_type: Optional[str] = Field(default=None, max_length=50)
    marks_obtained: Optional[float] = Field(default=None, ge=0)
    max_marks: Optional[float] = Field(default=None, ge=0)
    grade: Optional[str] = Field(default=None, max_length=10)


class MarkRead(MarkBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
