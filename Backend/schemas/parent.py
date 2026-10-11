from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ParentLinkCreate(BaseModel):
    parent_email: Optional[EmailStr] = None
    parent_user_id: Optional[int] = None
    student_id: int
    relationship_type: str = Field("parent", min_length=2, max_length=50)


class ParentLinkStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(approved|revoked|pending)$")


class ParentStudentSummary(BaseModel):
    student_id: int
    roll_number: str
    first_name: str
    last_name: str
    email: str
    department: Optional[str] = None
    semester: Optional[int] = None
    relationship_type: str
    link_status: str
    attendance_percentage: float
    academic_percentage: float
    risk_level: str

    model_config = ConfigDict(from_attributes=True)


class ParentNotificationResponse(BaseModel):
    id: int
    student_id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ParentCreateAccountRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    student_id: Optional[int] = None
    relationship_type: str = Field("parent", min_length=2, max_length=50)
