# app/models/__init__.py
from app.models.user import User
from app.models.role import Role
from app.models.permission import Permission
from app.models.project import Project
from app.models.task import Task
from app.models.comment import Comment
from app.models.notification import Notification
from app.models.attachment import Attachment
from app.models.workflow import Workflow, WorkflowStep
from app.models.report import Report
from app.models.dynamic_field import DynamicField, PersonnelValue
from app.models.setting import Setting
from app.models.department import Department
from app.models.department_manager import DepartmentManager
from app.models.unit import Unit
from app.models.unit_supervisor import UnitSupervisor  # ← اضافه کنید
from app.models.work_period import WorkPeriod
from app.models.personnel import Personnel, PersonnelAssignment, PersonnelWorkStatus, WorkRevisionMessage

__all__ = [
    'User',
    'Role',
    'Permission',
    'Project',
    'Task',
    'Comment',
    'Notification',
    'Attachment',
    'Workflow',
    'WorkflowStep',
    'Report',
    'DynamicField',
    'PersonnelValue',
    'Setting',
    'Department',
    'DepartmentManager',
    'Unit',
    'UnitSupervisor',  # ← اضافه کنید
    'WorkPeriod',
    'Personnel',
    'PersonnelAssignment',
    'PersonnelWorkStatus',
    'WorkRevisionMessage',
]