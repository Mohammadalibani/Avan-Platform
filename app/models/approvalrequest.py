from app.extensions import db
from flask_login import UserMixin

from datetime import datetime
class ApprovalRequest(db.Model):
    __tablename__ = 'approval_requests'
    id = db.Column(db.Integer, primary_key=True)
    request_type = db.Column(db.String(20), nullable=False)
    requester_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    reviewer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    target_personnel_id = db.Column(db.Integer, db.ForeignKey('personnel.id'), nullable=True)
    data = db.Column(db.Text, nullable=True)
    requester_note = db.Column(db.Text, nullable=True)
    admin_note = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.now)
    reviewed_at = db.Column(db.DateTime, nullable=True)