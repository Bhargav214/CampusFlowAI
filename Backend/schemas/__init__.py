from .attendance import AttendanceCreate, AttendanceResponse, AttendanceUpdate
from .faculty import FacultyCreate, FacultyRead, FacultyUpdate
from .marks import MarkCreate, MarkResponse, MarkUpdate
from .student import StudentCreate, StudentRead, StudentUpdate
from .subject import SubjectCreate, SubjectRead, SubjectUpdate
from .user import UserCreate, UserRead, UserUpdate

__all__ = [
    "AttendanceCreate",
    "AttendanceResponse",
    "AttendanceUpdate",
    "FacultyCreate",
    "FacultyRead",
    "FacultyUpdate",
    "MarkCreate",
    "MarkRead",
    "MarkUpdate",
    "StudentCreate",
    "StudentRead",
    "StudentUpdate",
    "SubjectCreate",
    "SubjectRead",
    "SubjectUpdate",
    "UserCreate",
    "UserRead",
    "UserUpdate",
]
