# app/models/personnel.py
from datetime import datetime
import jdatetime
from app.extensions import db


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
    period_id = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    is_deleted = db.Column(db.Boolean, default=False)
    
    # Relationships - فقط یک طرف backref داشته باشه
    department = db.relationship('Department', lazy=True)
    unit = db.relationship('Unit', backref='personnel_items', lazy=True)
    values = db.relationship('PersonnelValue', backref='personnel', lazy=True)
    work_statuses = db.relationship('PersonnelWorkStatus', backref='personnel', lazy=True)
    assignments = db.relationship('PersonnelAssignment', backref='personnel', lazy=True)
    
    def get_full_name(self):
        return f"{self.first_name or ''} {self.last_name or ''}".strip()
    
    def get_jalali_created_date(self):
        if self.created_at:
            return jdatetime.datetime.fromgregorian(datetime=self.created_at).strftime('%Y/%m/%d')
        return ''
    
    def get_value(self, field_title):
        for v in self.values:
            if v.field and v.field.title == field_title:
                return v.value_text or v.value_number or v.value_date or ''
        return ''
    
    def is_complete(self):
        if not self.first_name or not self.last_name:
            return False
        return True
    
    def to_dict(self):
        return {
            'id': self.id,
            'national_code': self.national_code,
            'first_name': self.first_name or '',
            'last_name': self.last_name or '',
            'full_name': self.get_full_name(),
            'phone': self.phone or '',
            'position': self.position or '',
            'department_id': self.department_id,
            'unit_id': self.unit_id,
            'period_id': self.period_id,
            'created_at': self.get_jalali_created_date(),
            'is_deleted': self.is_deleted
        }
    
    def __repr__(self):
        return f"<Personnel {self.national_code} - {self.get_full_name()}>"