from database.base import Base
from .attendance import Attendance
from .department import Department
from .faculty import Faculty
from .marks import Mark
from .student import Student
from .subject import Subject
from .user import User
from .parent_student import ParentStudentLink
from .notification import ParentNotification

__all__ = ["Attendance", "Department", "Faculty", "Mark", "Student", "Subject", "User", "ParentStudentLink", "ParentNotification"]

