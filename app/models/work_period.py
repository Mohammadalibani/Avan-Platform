# app/models/work_period.py
from datetime import datetime
from app.extensions import db

class WorkPeriod(db.Model):
    __tablename__ = 'work_periods'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    start_date = db.Column(db.String(20), nullable=False)
    end_date = db.Column(db.String(20), nullable=False)
    deadline = db.Column(db.String(20), nullable=True)
    display_order = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    # Relationships
    work_statuses = db.relationship('PersonnelWorkStatus', backref='period', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'start_date': self.start_date,
            'end_date': self.end_date,
            'deadline': self.deadline,
            'display_order': self.display_order,
            'is_active': self.is_active,
            'created_at': self.created_at.strftime('%Y/%m/%d') if self.created_at else ''
        }