from app.extensions import db
from flask_login import UserMixin

from datetime import datetime
class Personnel(db.Model):
    __tablename__ = 'personnel'
    
    id = db.Column(db.Integer, primary_key=True)
    national_code = db.Column(db.String(10), unique=True, nullable=False)
    first_name = db.Column(db.String(50), nullable=True)
    last_name = db.Column(db.String(50), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    position = db.Column(db.String(100), nullable=True)
    hire_date = db.Column(db.String(20), nullable=True)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=True)
    unit_id = db.Column(db.Integer, db.ForeignKey('units.id'), nullable=False)
    period_id = db.Column(db.Integer, nullable=True)  # ← این خط را اضافه کن
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    is_deleted = db.Column(db.Boolean, default=False)
    
    department = db.relationship('Department', backref='personnel_list')
    unit = db.relationship('Unit', backref='personnel_list')
    
    def get_full_name(self):
        return f"{self.first_name or ''} {self.last_name or ''}".strip()