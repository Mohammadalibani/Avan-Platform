# app/models/user.py
from datetime import datetime
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from app.extensions import db
from app.models.base import BaseModel

# Association table for user roles
user_roles = db.Table('user_roles',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('role_id', db.Integer, db.ForeignKey('role.id'), primary_key=True)
)

class User(UserMixin, BaseModel):
    """User model"""
    __tablename__ = 'user'
    
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    full_name = db.Column(db.String(100))
    avatar = db.Column(db.String(200))
    is_active = db.Column(db.Boolean, default=True)
    is_verified = db.Column(db.Boolean, default=False)
    last_login = db.Column(db.DateTime)
    
    # Relationships
    roles = db.relationship('Role', secondary=user_roles, back_populates='users', lazy='dynamic')
    projects = db.relationship('Project', back_populates='owner', lazy='dynamic')
    tasks = db.relationship('Task', back_populates='assigned_to', lazy='dynamic')
    comments = db.relationship('Comment', back_populates='author', lazy='dynamic')
    notifications = db.relationship('Notification', back_populates='user', lazy='dynamic')
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check password against hash"""
        return check_password_hash(self.password_hash, password)
    
    def has_role(self, role_name):
        """Check if user has specific role"""
        return self.roles.filter_by(name=role_name).first() is not None
    
    def has_permission(self, permission_name):
        """Check if user has specific permission through roles"""
        for role in self.roles:
            if role.has_permission(permission_name):
                return True
        return False
    
    def to_dict(self, exclude=None):
        """Convert user to dictionary (override to exclude sensitive data)"""
        if exclude is None:
            exclude = ['password_hash']
        data = super().to_dict(exclude=exclude)
        data['roles'] = [role.name for role in self.roles]
        return data
    
    def __repr__(self):
        return f'<User {self.username}>'