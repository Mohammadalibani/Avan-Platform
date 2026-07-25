# app/repositories/task_repository.py
from typing import Optional, List, Dict
from datetime import datetime
from app.repositories.base_repository import BaseRepository
from app.models.task import Task
from app.extensions import db


class TaskRepository(BaseRepository):
    """Repository for Task model operations"""
    
    def __init__(self):
        super().__init__(Task)
    
    def get_tasks_by_project(self, project_id: int) -> List[Task]:
        """Get all tasks for a project"""
        return Task.query.filter_by(project_id=project_id).all()
    
    def get_tasks_by_user(self, user_id: int) -> List[Task]:
        """Get all tasks assigned to a user"""
        return Task.query.filter_by(assigned_to_id=user_id).all()
    
    def get_tasks_by_status(self, status: str) -> List[Task]:
        """Get tasks by status"""
        return Task.query.filter_by(status=status).all()
    
    def get_overdue_tasks(self) -> List[Task]:
        """Get all overdue tasks"""
        now = datetime.utcnow()
        return Task.query.filter(
            Task.due_date < now,
            Task.status != 'completed'
        ).all()
    
    def get_tasks_by_priority(self, priority: str) -> List[Task]:
        """Get tasks by priority"""
        return Task.query.filter_by(priority=priority).all()
    
    def get_subtasks(self, task_id: int) -> List[Task]:
        """Get all subtasks of a task"""
        task = self.get_by_id(task_id)
        if task:
            return task.subtasks if task.subtasks else []
        return []
    
    def get_task_with_details(self, task_id: int) -> Optional[Task]:
        """Get task with all relationships loaded"""
        return Task.query.options(
            db.joinedload(Task.project),
            db.joinedload(Task.assigned_to),
            db.joinedload(Task.comments),
            db.joinedload(Task.attachments)
        ).filter_by(id=task_id).first()
    
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
    
    def update_status(self, task_id: int, status: str) -> Optional[Task]:
        """Update task status"""
        task = self.get_by_id(task_id)
        if task:
            task.status = status
            if status == 'completed':
                task.actual_hours = task.estimated_hours or 0
                task.completed_at = datetime.utcnow()
            db.session.commit()
        return task