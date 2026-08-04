from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., max_length=100)
    role: str = Field(default="student", max_length=20)


class UserCreate(UserBase):
    password_hash: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    username: Optional[str] = Field(default=None, min_length=3, max_length=50)
    email: Optional[str] = Field(default=None, max_length=100)
    role: Optional[str] = Field(default=None, max_length=20)
    password_hash: Optional[str] = Field(default=None, min_length=6)


class UserRead(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


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


class FacultyBase(BaseModel):
    faculty_id: str = Field(..., max_length=30)
    first_name: str = Field(..., max_length=50)
    last_name: str = Field(..., max_length=50)
    email: str = Field(..., max_length=100)
    phone: Optional[str] = Field(default=None, max_length=20)
    department: Optional[str] = Field(default=None, max_length=100)
    designation: Optional[str] = Field(default=None, max_length=100)


class FacultyCreate(FacultyBase):
    user_id: Optional[int] = None


class FacultyUpdate(BaseModel):
    faculty_id: Optional[str] = Field(default=None, max_length=30)
    first_name: Optional[str] = Field(default=None, max_length=50)
    last_name: Optional[str] = Field(default=None, max_length=50)
    email: Optional[str] = Field(default=None, max_length=100)
    phone: Optional[str] = Field(default=None, max_length=20)
    department: Optional[str] = Field(default=None, max_length=100)
    designation: Optional[str] = Field(default=None, max_length=100)
    user_id: Optional[int] = None


class FacultyRead(FacultyBase):
    id: int
    user_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


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
