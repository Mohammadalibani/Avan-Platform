# app/models/user.py
from datetime import datetime
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
import jdatetime

from app.extensions import db, login_manager


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


class User(UserMixin, db.Model):
    """مدل کاربران سیستم"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    national_code = db.Column(db.String(10), unique=True, nullable=False)
    username = db.Column(db.String(10), unique=True, nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    password_hash = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(30), nullable=False, default='subordinate')
    personnel_code = db.Column(db.String(20), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    is_approved = db.Column(db.Boolean, default=False)
    profile_picture = db.Column(db.String(200), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    last_login = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    documents = db.relationship('UserDocument', foreign_keys='UserDocument.user_id', backref='user', lazy=True)
    sent_requests = db.relationship('Request', foreign_keys='Request.requester_id', backref='requester', lazy=True)
    received_requests = db.relationship('Request', foreign_keys='Request.unit_supervisor_id', backref='unit_supervisor', lazy=True)
    notifications = db.relationship('Notification', backref='user', lazy=True)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()
    
    def get_jalali_created_date(self):
        if self.created_at:
            return jdatetime.datetime.fromgregorian(datetime=self.created_at).strftime('%Y/%m/%d')
        return ''
    
    def get_role_persian(self):
        roles = {
            'admin': 'مدیر کل سیستم',
            'org_manager': 'مدیر سازمان',
            'dept_manager': 'مدیر اداره',
            'hr_manager': 'مدیر منابع انسانی',
            'unit_supervisor': 'سرپرست واحد',
            'subordinate': 'کاربر عادی'
        }
        return roles.get(self.role, 'نامشخص')
    
    def is_online(self):
        """بررسی آنلاین بودن کاربر (آخرین ورود در 15 دقیقه اخیر)"""
        if not self.last_login:
            return False
        from datetime import timedelta
        return (datetime.now() - self.last_login) < timedelta(minutes=15)
    
    def to_dict(self):
        return {
            'id': self.id,
            'national_code': self.national_code,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': self.get_full_name(),
            'phone': self.phone or '',
            'role': self.role,
            'role_persian': self.get_role_persian(),
            'personnel_code': self.personnel_code,
            'is_active': self.is_active,
            'is_approved': self.is_approved,
            'profile_picture': self.profile_picture,
            'created_at': self.get_jalali_created_date(),
            'last_login': self.last_login.strftime('%Y/%m/%d %H:%M') if self.last_login else None,
            'is_online': self.is_online()
        }
    
    def __repr__(self):
        return f"<User {self.national_code} - {self.get_full_name()}>"