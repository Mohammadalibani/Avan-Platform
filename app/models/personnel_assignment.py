# app/models/personnel_assignment.py
from datetime import datetime
from app.extensions import db

class PersonnelAssignment(db.Model):
    __tablename__ = 'personnel_assignments'
    
    id = db.Column(db.Integer, primary_key=True)
    personnel_id = db.Column(db.Integer, db.ForeignKey('personnel.id'), nullable=False)
    unit_id = db.Column(db.Integer, db.ForeignKey('units.id'), nullable=False)
    period_id = db.Column(db.Integer, db.ForeignKey('work_periods.id'), nullable=True)
    assignment_type = db.Column(db.String(30), default='initial')
    start_date = db.Column(db.String(20), nullable=False)
    end_date = db.Column(db.String(20), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    description = db.Column(db.Text, nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    # Relationships
    creator = db.relationship('User', foreign_keys=[created_by], backref='created_assignments')
    unit = db.relationship('Unit', backref='assignments')
    period = db.relationship('WorkPeriod', backref='assignments')