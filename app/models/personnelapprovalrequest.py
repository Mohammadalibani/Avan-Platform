from app.extensions import db
from flask_login import UserMixin

from datetime import datetime
class PersonnelApprovalRequest(db.Model):
    __tablename__ = 'personnel_approval_requests'
    
    id = db.Column(db.Integer, primary_key=True)
    request_type = db.Column(db.String(20), nullable=False)  # add, delete
    personnel_data = db.Column(db.Text, nullable=True)  # JSON داده‌های پرسنل (برای add)
    personnel_id = db.Column(db.Integer, db.ForeignKey('personnel.id'), nullable=True)  # برای delete
    requester_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    unit_id = db.Column(db.Integer, db.ForeignKey('units.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected
    admin_note = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    reviewed_at = db.Column(db.DateTime, nullable=True)
    
    requester = db.relationship('User', foreign_keys=[requester_id])
    unit = db.relationship('Unit')