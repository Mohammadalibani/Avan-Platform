# app/models/work_period.py
from datetime import datetime
from app.extensions import db
from app.models.base import BaseModel

class WorkPeriod(BaseModel):
    """مدل دوره‌های کاری"""
    __tablename__ = 'work_periods'
    
    title = db.Column(db.String(100), nullable=False)
    start_date = db.Column(db.String(20), nullable=False)
    end_date = db.Column(db.String(20), nullable=False)
    deadline = db.Column(db.String(20), nullable=True)
    display_order = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'start_date': self.start_date,
            'end_date': self.end_date,
            'deadline': self.deadline,
            'display_order': self.display_order,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
    
    def __repr__(self):
        return f'<WorkPeriod {self.title}>'