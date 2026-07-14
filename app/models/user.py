from datetime import datetime
from app.extensions import db
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
import jdatetime

class User(UserMixin, db.Model):
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
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"
    
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