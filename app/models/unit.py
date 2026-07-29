# app/models/unit.py
from datetime import datetime
from app.extensions import db
from app.models.base import BaseModel

class Unit(BaseModel):
    """مدل واحدها"""
    __tablename__ = 'units'
    
    name = db.Column(db.String(100), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=False)
    description = db.Column(db.String(500), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    needs_approval = db.Column(db.Boolean, default=True)
    
    department = db.relationship('Department', backref='units')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'department_id': self.department_id,
            'description': self.description,
            'is_active': self.is_active,
            'needs_approval': self.needs_approval,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
    
    def __repr__(self):
        return f'<Unit {self.name}>'