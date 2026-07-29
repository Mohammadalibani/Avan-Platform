# app/repositories/project_repository.py
from typing import Optional, List, Dict, Tuple
from app.repositories.base_repository import BaseRepository
from app.models.project import Project
from app.models.user import User
from app.models.task import Task
from app.extensions import db
from sqlalchemy import select, or_, func


class ProjectRepository(BaseRepository):
    """Repository for Project model operations with optimized queries"""
    
    def __init__(self):
        super().__init__(Project)
    
    def get_by_code(self, code: str) -> Optional[Project]:
        """Get project by code"""
        return Project.query.filter_by(code=code).first()
    
    def get_user_projects(self, user_id: int, page: int = 1, per_page: int = 20) -> Tuple[List[Project], int]:
        """Get all projects for a user with pagination"""
        query = Project.query.filter(
            or_(
                Project.owner_id == user_id,
                Project.tasks.any(assigned_to_id=user_id)
            )
        ).distinct()
        
        total = query.count()
        items = query.offset((page - 1) * per_page).limit(per_page).all()
        return items, total
    
    def get_projects_by_status(self, status: str, page: int = 1, per_page: int = 20) -> Tuple[List[Project], int]:
        """Get projects by status with pagination"""
        query = Project.query.filter_by(status=status)
        total = query.count()
        items = query.offset((page - 1) * per_page).limit(per_page).all()
        return items, total
    
    def get_projects_with_owner(self, page: int = 1, per_page: int = 20) -> Tuple[List[Project], int]:
        """Get all projects with owner loaded (eager loading)"""
        query = Project.query.options(db.joinedload(Project.owner))
        total = query.count()
        items = query.offset((page - 1) * per_page).limit(per_page).all()
        return items, total
    
    def get_project_with_tasks(self, project_id: int) -> Optional[Project]:
        """Get project with tasks (simple approach - no eager loading on dynamic)"""
        project = Project.query.options(
            db.joinedload(Project.owner)
        ).filter_by(id=project_id).first()
        
        if project:
            # Force load tasks
            _ = project.tasks.all()
        return project
    
    def get_project_statistics(self, project_id: int) -> Dict:
        """Get project statistics"""
        project = self.get_by_id(project_id)
        if not project:
            return {}
        
        total_tasks = project.tasks.count()
        completed_tasks = project.tasks.filter_by(status='completed').count()
        
        return {
            'project_id': project_id,
            'project_name': project.name,
            'project_code': project.code,
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'pending_tasks': total_tasks - completed_tasks,
            'progress': int((completed_tasks / total_tasks * 100)) if total_tasks > 0 else 0,
            'status': project.status,
            'owner_name': project.owner.full_name if project.owner else None
        }
    
    def get_project_summary(self, project_id: int) -> Optional[Dict]:
        """Get project summary with only needed fields (optimized)"""
        result = db.session.execute(
            select(
                Project.id,
                Project.name,
                Project.code,
                Project.status,
                Project.priority,
                User.full_name.label('owner_name')
            )
            .join(User, Project.owner_id == User.id)
            .where(Project.id == project_id)
        ).first()
        
        if result:
            return {
                'id': result.id,
                'name': result.name,
                'code': result.code,
                'status': result.status,
                'priority': result.priority,
                'owner_name': result.owner_name
            }
        return None
    
    def search_projects(self, search_term: str, page: int = 1, per_page: int = 20) -> Tuple[List[Project], int]:
        """Search projects by name or code"""
        query = Project.query.filter(
            or_(
                Project.name.ilike(f'%{search_term}%'),
                Project.code.ilike(f'%{search_term}%')
            )
        )
        total = query.count()
        items = query.offset((page - 1) * per_page).limit(per_page).all()
        return items, total
    
    def get_active_projects_count(self) -> int:
        """Get count of active projects"""
        return Project.query.filter_by(status='active').count()
    
    def get_project_progress_summary(self) -> List[Dict]:
        """Get progress summary for all projects"""
        projects = Project.query.all()
        result = []
        
        for project in projects:
            total = project.tasks.count()
            completed = project.tasks.filter_by(status='completed').count()
            
            result.append({
                'project_id': project.id,
                'project_name': project.name,
                'project_code': project.code,
                'total_tasks': total,
                'completed_tasks': completed,
                'progress': int((completed / total * 100)) if total > 0 else 0,
                'status': project.status
            })
        
        return result
    
    def get_project_with_comments(self, project_id: int) -> Optional[Project]:
        """Get project with tasks and comments loaded"""
        project = Project.query.options(
            db.joinedload(Project.owner)
        ).filter_by(id=project_id).first()
        
        if project:
            _ = project.tasks.all()
        return project
    
    def bulk_update_status(self, project_ids: List[int], status: str) -> int:
        """Bulk update project status"""
        if not project_ids:
            return 0
        
        return Project.query.filter(Project.id.in_(project_ids)).update(
            {'status': status},
            synchronize_session=False
        )
    
    def get_projects_by_owner(self, owner_id: int, page: int = 1, per_page: int = 20) -> Tuple[List[Project], int]:
        """Get projects by owner with pagination"""
        query = Project.query.filter_by(owner_id=owner_id)
        total = query.count()
        items = query.offset((page - 1) * per_page).limit(per_page).all()
        return items, total
    
    def get_task_count_by_project(self, project_id: int) -> int:
        """Get task count for a project (optimized)"""
        return Task.query.filter_by(project_id=project_id).count()
    
    def get_completed_task_count_by_project(self, project_id: int) -> int:
        """Get completed task count for a project (optimized)"""
        return Task.query.filter_by(project_id=project_id, status='completed').count()