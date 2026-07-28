# app/services/project_service.py
from typing import Optional, List, Dict
from app.services.base_service import BaseService
from app.models.project import Project
from app.models.user import User


class ProjectService(BaseService):
    """Service for Project model operations"""
    
    def __init__(self):
        super().__init__(Project)
    
    def create_project(self, name: str, code: str, owner_id: int, 
                      description: str = None, **kwargs) -> Project:
        """Create a new project"""
        # Check if project code exists
        if self.get_by_code(code):
            raise ValueError(f"Project code '{code}' already exists")
        
        # Check if owner exists
        owner = User.query.get(owner_id)
        if not owner:
            raise ValueError(f"User with ID {owner_id} does not exist")
        
        project = Project(
            name=name,
            code=code,
            owner_id=owner_id,
            description=description,
            **kwargs
        )
        project.save()
        return project
    
    def get_by_code(self, code: str) -> Optional[Project]:
        """Get project by code"""
        return Project.query.filter_by(code=code).first()
    
    def get_user_projects(self, user_id: int) -> List[Project]:
        """Get all projects for a user"""
        from sqlalchemy import or_
        return Project.query.filter(
            or_(
                Project.owner_id == user_id,
                Project.tasks.any(assigned_to_id=user_id)
            )
        ).distinct().all()
    
    def get_projects_by_status(self, status: str) -> List[Project]:
        """Get projects by status"""
        return Project.query.filter_by(status=status).all()
    
    def update_status(self, project_id: int, status: str) -> Optional[Project]:
        """Update project status"""
        project = self.get_by_id(project_id)
        if project:
            project.status = status
            project.save()
        return project
    
    def get_statistics(self, project_id: int) -> Dict:
        """Get project statistics"""
        project = self.get_by_id(project_id)
        if not project:
            return {}
        
        total_tasks = project.get_task_count()
        completed_tasks = project.get_completed_tasks()
        progress = project.get_progress()
        
        return {
            'project_id': project_id,
            'project_name': project.name,
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'pending_tasks': total_tasks - completed_tasks,
            'progress': progress,
            'owner': project.owner.full_name if project.owner else None,
            'status': project.status
        }
    
    def get_projects_with_owner(self) -> List[Dict]:
        """Get all projects with owner details"""
        projects = self.get_all()
        result = []
        for project in projects:
            data = project.to_dict()
            if project.owner:
                data['owner_info'] = {
                    'id': project.owner.id,
                    'username': project.owner.username,
                    'full_name': project.owner.full_name,
                    'email': project.owner.email
                }
            result.append(data)
        return result