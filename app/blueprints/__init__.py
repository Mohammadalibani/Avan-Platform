# app/blueprints/__init__.py
from flask import Blueprint

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')
user_bp = Blueprint('user', __name__, url_prefix='/api/users')
project_bp = Blueprint('project', __name__, url_prefix='/api/projects')
task_bp = Blueprint('task', __name__, url_prefix='/api/tasks')
workflow_bp = Blueprint('workflow', __name__, url_prefix='/api/workflows')
notification_bp = Blueprint('notification', __name__, url_prefix='/api/notifications')
reporting_bp = Blueprint('reporting', __name__, url_prefix='/api/reporting')

__all__ = [
    'auth_bp',
    'user_bp',
    'project_bp',
    'task_bp',
    'workflow_bp',
    'notification_bp',
    'reporting_bp'
]