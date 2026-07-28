# app/services/reporting_service.py
from typing import Dict, List, Any
from datetime import datetime, timedelta
from sqlalchemy import func, and_, or_
from app.extensions import db
from app.models.user import User
from app.models.project import Project
from app.models.task import Task
from app.models.comment import Comment


class ReportingService:
    """Service for generating reports and analytics"""
    
    def get_project_stats(self, project_id: int = None) -> Dict:
        """Get statistics for a project or all projects"""
        query = Project.query
        
        if project_id:
            query = query.filter_by(id=project_id)
        
        projects = query.all()
        
        total_projects = len(projects)
        total_tasks = 0
        completed_tasks = 0
        total_comments = 0
        
        for project in projects:
            total_tasks += project.get_task_count()
            completed_tasks += project.get_completed_tasks()
            total_comments += Comment.query.filter_by(task_id=project.id).count()
        
        return {
            'total_projects': total_projects,
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'pending_tasks': total_tasks - completed_tasks,
            'completion_rate': (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0,
            'total_comments': total_comments,
            'projects': [p.to_dict() for p in projects]
        }
    
    def get_user_stats(self, user_id: int = None) -> Dict:
        """Get statistics for a user or all users"""
        query = User.query.filter_by(is_active=True)
        
        if user_id:
            query = query.filter_by(id=user_id)
        
        users = query.all()
        
        total_users = len(users)
        total_tasks_assigned = 0
        completed_tasks = 0
        
        for user in users:
            tasks = Task.query.filter_by(assigned_to_id=user.id).all()
            total_tasks_assigned += len(tasks)
            completed_tasks += len([t for t in tasks if t.status == 'completed'])
        
        return {
            'total_users': total_users,
            'total_tasks_assigned': total_tasks_assigned,
            'completed_tasks': completed_tasks,
            'pending_tasks': total_tasks_assigned - completed_tasks,
            'completion_rate': (completed_tasks / total_tasks_assigned * 100) if total_tasks_assigned > 0 else 0,
            'users': [u.to_dict() for u in users]
        }
    
    def get_task_stats(self, status: str = None, priority: str = None) -> Dict:
        """Get task statistics with filters"""
        query = Task.query
        
        if status:
            query = query.filter_by(status=status)
        if priority:
            query = query.filter_by(priority=priority)
        
        tasks = query.all()
        
        total = len(tasks)
        by_status = {}
        by_priority = {}
        overdue = 0
        
        for task in tasks:
            # Group by status
            by_status[task.status] = by_status.get(task.status, 0) + 1
            
            # Group by priority
            by_priority[task.priority] = by_priority.get(task.priority, 0) + 1
            
            # Check overdue
            if task.is_overdue():
                overdue += 1
        
        return {
            'total_tasks': total,
            'by_status': by_status,
            'by_priority': by_priority,
            'overdue_tasks': overdue,
            'completion_rate': (len([t for t in tasks if t.status == 'completed']) / total * 100) if total > 0 else 0
        }
    
    def get_activity_stats(self, days: int = 30) -> Dict:
        """Get activity statistics for the last N days"""
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Tasks created in the period
        tasks_created = Task.query.filter(
            Task.created_at >= start_date
        ).count()
        
        # Tasks completed in the period
        tasks_completed = Task.query.filter(
            Task.updated_at >= start_date,
            Task.status == 'completed'
        ).count()
        
        # Comments created in the period
        comments_count = Comment.query.filter(
            Comment.created_at >= start_date
        ).count()
        
        # Users created in the period
        users_created = User.query.filter(
            User.created_at >= start_date
        ).count()
        
        return {
            'period_days': days,
            'start_date': start_date.isoformat(),
            'tasks_created': tasks_created,
            'tasks_completed': tasks_completed,
            'comments_count': comments_count,
            'users_created': users_created,
            'productivity': (tasks_completed / tasks_created * 100) if tasks_created > 0 else 0
        }
    
    def get_timeline_data(self, days: int = 30) -> List[Dict]:
        """Get timeline data for charts"""
        start_date = datetime.utcnow() - timedelta(days=days)
        
        data = []
        for i in range(days):
            date = start_date + timedelta(days=i)
            next_date = date + timedelta(days=1)
            
            # Tasks created on this day
            tasks_created = Task.query.filter(
                Task.created_at >= date,
                Task.created_at < next_date
            ).count()
            
            # Tasks completed on this day
            tasks_completed = Task.query.filter(
                Task.updated_at >= date,
                Task.updated_at < next_date,
                Task.status == 'completed'
            ).count()
            
            data.append({
                'date': date.strftime('%Y-%m-%d'),
                'tasks_created': tasks_created,
                'tasks_completed': tasks_completed
            })
        
        return data
    
    def get_team_performance(self) -> List[Dict]:
        """Get team performance metrics"""
        users = User.query.filter_by(is_active=True).all()
        performance = []
        
        for user in users:
            tasks = Task.query.filter_by(assigned_to_id=user.id).all()
            total = len(tasks)
            completed = len([t for t in tasks if t.status == 'completed'])
            
            performance.append({
                'user_id': user.id,
                'username': user.username,
                'full_name': user.full_name,
                'total_tasks': total,
                'completed_tasks': completed,
                'completion_rate': (completed / total * 100) if total > 0 else 0,
                'overdue_tasks': len([t for t in tasks if t.is_overdue()])
            })
        
        # Sort by completion rate
        performance.sort(key=lambda x: x['completion_rate'], reverse=True)
        return performance
    
    def get_project_progress(self) -> List[Dict]:
        """Get progress for all projects"""
        projects = Project.query.all()
        progress_data = []
        
        for project in projects:
            progress_data.append({
                'project_id': project.id,
                'project_name': project.name,
                'project_code': project.code,
                'progress': project.get_progress(),
                'total_tasks': project.get_task_count(),
                'completed_tasks': project.get_completed_tasks(),
                'status': project.status
            })
        
        return progress_data
    
    def get_dashboard_summary(self) -> Dict:
        """Get summary for dashboard"""
        total_projects = Project.query.count()
        total_tasks = Task.query.count()
        completed_tasks = Task.query.filter_by(status='completed').count()
        total_users = User.query.filter_by(is_active=True).count()
        overdue_tasks = Task.query.filter(
            Task.due_date < datetime.utcnow(),
            Task.status != 'completed'
        ).count()
        
        # Recent activity
        recent_tasks = Task.query.order_by(Task.created_at.desc()).limit(5).all()
        recent_comments = Comment.query.order_by(Comment.created_at.desc()).limit(5).all()
        
        return {
            'total_projects': total_projects,
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'pending_tasks': total_tasks - completed_tasks,
            'total_users': total_users,
            'overdue_tasks': overdue_tasks,
            'completion_rate': (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0,
            'recent_tasks': [t.to_dict() for t in recent_tasks],
            'recent_comments': [c.to_dict() for c in recent_comments]
        }