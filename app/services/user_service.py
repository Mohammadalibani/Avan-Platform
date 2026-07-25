# app/services/user_service.py
from typing import Optional, List, Dict, Any
from flask_login import login_user, logout_user, current_user
from app.services.base_service import BaseService
from app.models.user import User
from app.models.role import Role
from app.extensions import db


class UserService(BaseService):
    """Service for User model operations"""
    
    def __init__(self):
        super().__init__(User)
    
    def create_user(self, username: str, email: str, password: str, 
                   full_name: str = None, **kwargs) -> User:
        """Create a new user with password hashing"""
        # Check if user exists
        if self.get_by_username(username):
            raise ValueError(f"Username '{username}' already exists")
        
        if self.get_by_email(email):
            raise ValueError(f"Email '{email}' already exists")
        
        user = User(
            username=username,
            email=email,
            full_name=full_name or username,
            **kwargs
        )
        user.set_password(password)
        user.save()
        return user
    
    def get_by_username(self, username: str) -> Optional[User]:
        """Get user by username"""
        return User.query.filter_by(username=username).first()
    
    def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        return User.query.filter_by(email=email).first()
    
    def authenticate(self, username: str, password: str) -> Optional[User]:
        """Authenticate user by username and password"""
        user = self.get_by_username(username)
        if user and user.check_password(password) and user.is_active:
            return user
        return None
    
    def login_user(self, user: User, remember: bool = False) -> bool:
        """Login a user"""
        return login_user(user, remember=remember)
    
    def logout_user(self):
        """Logout current user"""
        logout_user()
    
    def get_current_user(self) -> Optional[User]:
        """Get currently logged-in user"""
        return current_user if current_user.is_authenticated else None
    
    def assign_role(self, user_id: int, role_name: str) -> Optional[User]:
        """Assign a role to user"""
        user = self.get_by_id(user_id)
        if not user:
            return None
        
        role = Role.query.filter_by(name=role_name).first()
        if not role:
            raise ValueError(f"Role '{role_name}' does not exist")
        
        if role not in user.roles:
            user.roles.append(role)
            user.save()
        
        return user
    
    def remove_role(self, user_id: int, role_name: str) -> Optional[User]:
        """Remove a role from user"""
        user = self.get_by_id(user_id)
        if not user:
            return None
        
        role = Role.query.filter_by(name=role_name).first()
        if role and role in user.roles:
            user.roles.remove(role)
            user.save()
        
        return user
    
    def has_permission(self, user_id: int, permission_name: str) -> bool:
        """Check if user has a specific permission"""
        user = self.get_by_id(user_id)
        if not user:
            return False
        return user.has_permission(permission_name)
    
    def update_last_login(self, user_id: int) -> Optional[User]:
        """Update user's last login timestamp"""
        from datetime import datetime
        user = self.get_by_id(user_id)
        if user:
            user.last_login = datetime.utcnow()
            user.save()
        return user
    
    def get_active_users(self) -> List[User]:
        """Get all active users"""
        return User.query.filter_by(is_active=True).all()
    
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