from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator


class MarkBase(BaseModel):
    student_id: int
    subject_id: int
    exam_type: str = Field(..., max_length=50)
    marks_obtained: float = Field(..., ge=0)
    max_marks: float = Field(..., gt=0)
    grade: Optional[str] = Field(default=None, max_length=10)

    @model_validator(mode="after")
    def validate_marks(self):
        if self.marks_obtained > self.max_marks:
            raise ValueError(
                "marks_obtained cannot be greater than max_marks"
            )

        return self
class MarkCreate(MarkBase):
    pass


class MarkUpdate(BaseModel):
    student_id: Optional[int] = None
    subject_id: Optional[int] = None
    exam_type: Optional[str] = Field(
        default=None,
        max_length=50
    )
    marks_obtained: Optional[float] = Field(
        default=None,
        ge=0
    )
    max_marks: Optional[float] = Field(
        default=None,
        gt=0
    )
    grade: Optional[str] = Field(
        default=None,
        max_length=10
    )


class MarkResponse(MarkBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )