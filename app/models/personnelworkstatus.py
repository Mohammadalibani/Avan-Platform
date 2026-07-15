from app.extensions import db
from flask_login import UserMixin

from datetime import datetime
class PersonnelWorkStatus(db.Model):
    __tablename__ = 'personnel_work_status'
    
    id = db.Column(db.Integer, primary_key=True)
    personnel_id = db.Column(db.Integer, db.ForeignKey('personnel.id'), nullable=False)
    period_id = db.Column(db.Integer, db.ForeignKey('work_periods.id'), nullable=False)
    
    # وضعیت‌ها: draft, unit_pending, unit_approved, dept_pending, dept_approved, org_pending, org_approved, revision
    status = db.Column(db.String(30), default='draft')
    
    # زمان‌های تایید
    unit_approved_at = db.Column(db.DateTime, nullable=True)
    dept_approved_at = db.Column(db.DateTime, nullable=True)
    org_approved_at = db.Column(db.DateTime, nullable=True)
    
    # تاییدکنندگان
    unit_approver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    dept_approver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    org_approver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    # اطلاعات اصلاح
    revision_note = db.Column(db.Text, nullable=True)
    revision_from_role = db.Column(db.String(30), nullable=True)  # dept_manager, org_manager
    revision_from_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    # روابط
    personnel = db.relationship('Personnel', backref='work_statuses')
    period = db.relationship('WorkPeriod', backref='work_statuses')
    unit_approver = db.relationship('User', foreign_keys=[unit_approver_id])
    dept_approver = db.relationship('User', foreign_keys=[dept_approver_id])
    org_approver = db.relationship('User', foreign_keys=[org_approver_id])
    
    __table_args__ = (
        db.UniqueConstraint('personnel_id', 'period_id', name='unique_personnel_period_work'),
    )