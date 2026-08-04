from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class StudentBase(BaseModel):
    roll_number: str = Field(..., max_length=30)
    first_name: str = Field(..., max_length=50)
    last_name: str = Field(..., max_length=50)
    email: str = Field(..., max_length=100)
    phone: Optional[str] = Field(default=None, max_length=20)
    department: Optional[str] = Field(default=None, max_length=100)
    semester: Optional[int] = Field(default=None, ge=1, le=12)
    address: Optional[str] = Field(default=None, max_length=255)


class StudentCreate(StudentBase):
    user_id: Optional[int] = None


class StudentUpdate(BaseModel):
    roll_number: Optional[str] = Field(default=None, max_length=30)
    first_name: Optional[str] = Field(default=None, max_length=50)
    last_name: Optional[str] = Field(default=None, max_length=50)
    email: Optional[str] = Field(default=None, max_length=100)
    phone: Optional[str] = Field(default=None, max_length=20)
    department: Optional[str] = Field(default=None, max_length=100)
    semester: Optional[int] = Field(default=None, ge=1, le=12)
    address: Optional[str] = Field(default=None, max_length=255)
    user_id: Optional[int] = None


class StudentRead(StudentBase):
    id: int
    user_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
