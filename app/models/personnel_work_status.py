# app/models/personnel_work_status.py
from datetime import datetime
from app.extensions import db

class PersonnelWorkStatus(db.Model):
    __tablename__ = 'personnel_work_status'
    
    id = db.Column(db.Integer, primary_key=True)
    personnel_id = db.Column(db.Integer, db.ForeignKey('personnel.id'), nullable=False)
    period_id = db.Column(db.Integer, db.ForeignKey('work_periods.id'), nullable=False)
    status = db.Column(db.String(30), default='draft')
    unit_approved_at = db.Column(db.DateTime, nullable=True)
    dept_approved_at = db.Column(db.DateTime, nullable=True)
    org_approved_at = db.Column(db.DateTime, nullable=True)
    unit_approver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    dept_approver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    org_approver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    revision_note = db.Column(db.Text, nullable=True)
    revision_from_role = db.Column(db.String(30), nullable=True)
    revision_from_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)