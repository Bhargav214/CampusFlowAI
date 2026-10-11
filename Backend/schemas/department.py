from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class HeadOfDepartmentBrief(BaseModel):
    id: int
    faculty_id: str
    first_name: str
    last_name: str
    email: str

    model_config = ConfigDict(from_attributes=True)


class DepartmentCreate(BaseModel):
    department_code: str = Field(..., min_length=2, max_length=30)
    department_name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=255)
    head_of_department_id: Optional[int] = None
    is_active: bool = True


class DepartmentUpdate(BaseModel):
    department_code: Optional[str] = Field(None, min_length=2, max_length=30)
    department_name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=255)
    head_of_department_id: Optional[int] = None
    is_active: Optional[bool] = None


class DepartmentStatusUpdate(BaseModel):
    is_active: bool


class DepartmentResponse(BaseModel):
    id: int
    department_code: str
    department_name: str
    description: Optional[str] = None
    head_of_department_id: Optional[int] = None
    head_of_department: Optional[HeadOfDepartmentBrief] = None
    is_active: bool
    student_count: int = 0
    faculty_count: int = 0
    subject_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DepartmentDashboardResponse(BaseModel):
    department_id: int
    department_code: str
    department_name: str
    total_students: int
    total_faculty: int
    total_subjects: int
    average_attendance: float
    average_marks: float
    risk_distribution: dict
