# app/services/task_service.py
from typing import Optional, List, Dict
from datetime import datetime
from app.services.base_service import BaseService
from app.models.task import Task
from app.models.project import Project
from app.models.user import User


class TaskService(BaseService):
    """Service for Task model operations"""
    
    def __init__(self):
        super().__init__(Task)
    
    def create_task(self, title: str, project_id: int, assigned_to_id: int = None,
                   description: str = None, **kwargs) -> Task:
        """Create a new task"""
        # Check if project exists
        project = Project.query.get(project_id)
        if not project:
            raise ValueError(f"Project with ID {project_id} does not exist")
        
        # Check if assigned user exists
        if assigned_to_id:
            user = User.query.get(assigned_to_id)
            if not user:
                raise ValueError(f"User with ID {assigned_to_id} does not exist")
        
        task = Task(
            title=title,
            project_id=project_id,
            assigned_to_id=assigned_to_id,
            description=description,
            **kwargs
        )
        task.save()
        return task
    
    def get_tasks_by_project(self, project_id: int) -> List[Task]:
        """Get all tasks for a project"""
        return Task.query.filter_by(project_id=project_id).all()
    
    def get_tasks_by_user(self, user_id: int) -> List[Task]:
        """Get all tasks assigned to a user"""
        return Task.query.filter_by(assigned_to_id=user_id).all()
    
    def get_tasks_by_status(self, status: str) -> List[Task]:
        """Get tasks by status"""
        return Task.query.filter_by(status=status).all()
    
    def update_status(self, task_id: int, status: str) -> Optional[Task]:
        """Update task status"""
        task = self.get_by_id(task_id)
        if task:
            task.status = status
            if status == 'completed':
                task.actual_hours = task.estimated_hours or 0
            task.save()
        return task
    
    def assign_task(self, task_id: int, user_id: int) -> Optional[Task]:
        """Assign task to a user"""
        task = self.get_by_id(task_id)
        user = User.query.get(user_id)
        
        if not task or not user:
            return None
        
        task.assigned_to_id = user_id
        task.save()
        return task
    
    def get_overdue_tasks(self) -> List[Task]:
        """Get all overdue tasks"""
        now = datetime.utcnow()
        return Task.query.filter(
            Task.due_date < now,
            Task.status != 'completed'
        ).all()
    
    def get_task_statistics(self, project_id: int = None) -> Dict:
        """Get task statistics"""
        query = Task.query
        
        if project_id:
            query = query.filter_by(project_id=project_id)
        
        total = query.count()
        completed = query.filter_by(status='completed').count()
        pending = query.filter_by(status='pending').count()
        in_progress = query.filter_by(status='in_progress').count()
        
        return {
            'total': total,
            'completed': completed,
            'pending': pending,
            'in_progress': in_progress,
            'completion_rate': (completed / total * 100) if total > 0 else 0
        }
    
    def get_subtasks(self, task_id: int) -> List[Task]:
        """Get all subtasks of a task"""
        task = self.get_by_id(task_id)
        if task:
            return task.subtasks if task.subtasks else []
        return []