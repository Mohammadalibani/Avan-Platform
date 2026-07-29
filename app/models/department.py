# app/models/department.py
from datetime import datetime
from app.extensions import db
from app.models.base import BaseModel

class Department(BaseModel):
    """مدل دپارتمان"""
    __tablename__ = 'departments'
    
    name = db.Column(db.String(100), nullable=False, unique=True)
    color = db.Column(db.String(7), default='#3498db')
    description = db.Column(db.String(500), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'color': self.color,
            'description': self.description,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
    
    def __repr__(self):
        return f'<Department {self.name}>'