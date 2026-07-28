# app/repositories/user_repository.py
from typing import Optional, List
from app.repositories.base_repository import BaseRepository
from app.models.user import User
from app.extensions import db


class UserRepository(BaseRepository):
    """Repository for User model operations"""
    
    def __init__(self):
        super().__init__(User)
    
    def get_by_username(self, username: str) -> Optional[User]:
        """Get user by username"""
        return User.query.filter_by(username=username).first()
    
    def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        return User.query.filter_by(email=email).first()
    
    def get_active_users(self) -> List[User]:
        """Get all active users"""
        return User.query.filter_by(is_active=True).all()
    
    def get_users_with_roles(self) -> List[User]:
        """Get all users with their roles loaded"""
        return User.query.options(db.joinedload(User.roles)).all()
    
    def search_users(self, search_term: str) -> List[User]:
        """Search users by username, email, or full_name"""
        from sqlalchemy import or_
        return User.query.filter(
            or_(
                User.username.ilike(f'%{search_term}%'),
                User.email.ilike(f'%{search_term}%'),
                User.full_name.ilike(f'%{search_term}%')
            )
        ).all()
    
    def get_users_by_role(self, role_name: str) -> List[User]:
        """Get users with a specific role"""
        from app.models.role import Role
        return User.query.join(User.roles).filter(Role.name == role_name).all()
    
    def update_last_login(self, user_id: int) -> Optional[User]:
        """Update user's last login timestamp"""
        from datetime import datetime
        user = self.get_by_id(user_id)
        if user:
            user.last_login = datetime.utcnow()
            db.session.commit()
        return user