# app/services/notification_service.py
from typing import Optional, List, Dict
from app.services.base_service import BaseService
from app.models.notification import Notification
from app.models.user import User
from app.extensions import db
from datetime import datetime


class NotificationService(BaseService):
    """Service for Notification operations"""
    
    def __init__(self):
        super().__init__(Notification)
    
    def create_notification(self, user_id: int, title: str, message: str, 
                           notification_type: str = 'info', link: str = None) -> Notification:
        """Create a new notification for a user"""
        user = User.query.get(user_id)
        if not user:
            raise ValueError(f"User with ID {user_id} does not exist")
        
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=notification_type,
            link=link,
            is_read=False
        )
        notification.save()
        return notification
    
    def get_user_notifications(self, user_id: int, unread_only: bool = False) -> List[Notification]:
        """Get all notifications for a user"""
        query = Notification.query.filter_by(user_id=user_id)
        if unread_only:
            query = query.filter_by(is_read=False)
        return query.order_by(Notification.created_at.desc()).all()
    
    def mark_as_read(self, notification_id: int) -> Optional[Notification]:
        """Mark a notification as read"""
        notification = self.get_by_id(notification_id)
        if notification:
            notification.mark_as_read()
        return notification
    
    def mark_all_as_read(self, user_id: int) -> int:
        """Mark all notifications as read for a user"""
        notifications = Notification.query.filter_by(
            user_id=user_id, 
            is_read=False
        ).all()
        
        count = len(notifications)
        for notification in notifications:
            notification.mark_as_read()
        
        return count
    
    def delete_notification(self, notification_id: int) -> bool:
        """Delete a notification"""
        notification = self.get_by_id(notification_id)
        if not notification:
            return False
        
        notification.delete()
        return True
    
    def delete_all_for_user(self, user_id: int) -> int:
        """Delete all notifications for a user"""
        notifications = Notification.query.filter_by(user_id=user_id).all()
        count = len(notifications)
        
        for notification in notifications:
            notification.delete()
        
        return count
    
    def get_unread_count(self, user_id: int) -> int:
        """Get unread notification count for a user"""
        return Notification.query.filter_by(
            user_id=user_id, 
            is_read=False
        ).count()
    
    def send_task_notification(self, task_id: int, user_id: int, action: str) -> Notification:
        """Send notification about task changes"""
        from app.models.task import Task
        
        task = Task.query.get(task_id)
        if not task:
            raise ValueError(f"Task with ID {task_id} does not exist")
        
        title = f"Task: {task.title}"
        message = f"Task '{task.title}' has been {action}"
        link = f"/tasks/{task_id}"
        
        return self.create_notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type='task',
            link=link
        )
    
    def send_project_notification(self, project_id: int, user_id: int, action: str) -> Notification:
        """Send notification about project changes"""
        from app.models.project import Project
        
        project = Project.query.get(project_id)
        if not project:
            raise ValueError(f"Project with ID {project_id} does not exist")
        
        title = f"Project: {project.name}"
        message = f"Project '{project.name}' has been {action}"
        link = f"/projects/{project_id}"
        
        return self.create_notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type='project',
            link=link
        )
    
    def send_workflow_notification(self, task_id: int, user_id: int, step_name: str) -> Notification:
        """Send notification about workflow progress"""
        from app.models.task import Task
        
        task = Task.query.get(task_id)
        if not task:
            raise ValueError(f"Task with ID {task_id} does not exist")
        
        title = f"Workflow Update: {task.title}"
        message = f"Task '{task.title}' reached step: {step_name}"
        link = f"/tasks/{task_id}"
        
        return self.create_notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type='workflow',
            link=link
        )