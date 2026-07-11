# app/models/unit.py
from datetime import datetime
import jdatetime
from app.extensions import db

class Unit(db.Model):
    __tablename__ = 'units'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=False)
    description = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    is_active = db.Column(db.Boolean, default=True)
    needs_approval = db.Column(db.Boolean, default=True)
    
    # Relationships
    supervisors = db.relationship('UnitSupervisor', backref='unit', lazy=True)
    
    def get_jalali_created_date(self):
        if self.created_at:
            return jdatetime.datetime.fromgregorian(datetime=self.created_at).strftime('%Y/%m/%d')
        return ''
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'department_id': self.department_id,
            'description': self.description,
            'created_at': self.get_jalali_created_date(),
            'is_active': self.is_active,
            'needs_approval': self.needs_approval
        }


class UnitSupervisor(db.Model):
    __tablename__ = 'unit_supervisors'
    
    id = db.Column(db.Integer, primary_key=True)
    unit_id = db.Column(db.Integer, db.ForeignKey('units.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Relationships
    user = db.relationship('User', backref='supervised_units', lazy=True)