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
    
    # ===== فیلدهای اصلی =====
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    full_name = db.Column(db.String(100))
    avatar = db.Column(db.String(200))
    role = db.Column(db.String(50), default='subordinate')
    
    # ===== فیلدهای جدید =====
    national_code = db.Column(db.String(10), unique=True, nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    personnel_code = db.Column(db.String(20), nullable=True)
    
    # ===== فیلدهای وضعیت =====
    is_active = db.Column(db.Boolean, default=True)
    is_approved = db.Column(db.Boolean, default=False)
    is_profile_complete = db.Column(db.Boolean, default=False)
    is_verified = db.Column(db.Boolean, default=False)
    last_login = db.Column(db.DateTime)
    
    # ===== روابط =====
    roles = db.relationship('Role', secondary=user_roles, back_populates='users', lazy='dynamic')
    projects = db.relationship('Project', back_populates='owner', lazy='dynamic')
    tasks = db.relationship('Task', back_populates='assigned_to', lazy='dynamic')
    comments = db.relationship('Comment', back_populates='author', lazy='dynamic')
    notifications = db.relationship('Notification', back_populates='user', lazy='dynamic')
    
    # ===== متدهای احراز هویت =====
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check password against hash"""
        return check_password_hash(self.password_hash, password)
    
    # ===== متدهای نقش =====
    def has_role(self, role_name):
        """Check if user has specific role"""
        return self.roles.filter_by(name=role_name).first() is not None
    
    def has_permission(self, permission_name):
        """Check if user has specific permission through roles"""
        for role in self.roles:
            if role.has_permission(permission_name):
                return True
        return False
    
    def get_role_persian(self):
        """Get Persian role name"""
        roles_map = {
            'admin': 'مدیر کل سیستم',
            'org_manager': 'مدیر سازمان',
            'dept_manager': 'مدیر اداره',
            'hr_manager': 'مدیر منابع انسانی',
            'unit_supervisor': 'سرپرست واحد',
            'subordinate': 'کاربر عادی'
        }
        return roles_map.get(self.role, self.role)
    
    def get_full_name(self):
        """Get full name"""
        return self.full_name or self.username
    
    # ===== متد تبدیل به دیکشنری =====
    def to_dict(self, exclude=None):
        """Convert user to dictionary"""
        if exclude is None:
            exclude = ['password_hash']
        
        data = {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'full_name': self.full_name,
            'national_code': self.national_code,
            'phone': self.phone,
            'avatar': self.avatar,
            'role': self.role,
            'role_persian': self.get_role_persian(),
            'is_active': self.is_active,
            'is_approved': self.is_approved,
            'is_profile_complete': self.is_profile_complete,
            'is_verified': self.is_verified,
            'personnel_code': self.personnel_code,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
        }
        return data
    
    def __repr__(self):
        return f'<User {self.username}>'