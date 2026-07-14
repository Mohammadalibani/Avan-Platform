from app.extensions import db
from flask_login import UserMixin

from datetime import datetime
class UnitPersonnelRequest(db.Model):
    __tablename__ = 'unit_personnel_requests'
    
    id = db.Column(db.Integer, primary_key=True)
    unit_id = db.Column(db.Integer, db.ForeignKey('units.id'), nullable=False)
    requester_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    request_type = db.Column(db.String(20), nullable=False)
    target_personnel_id = db.Column(db.Integer, nullable=True)  # این خط مهم است
    data = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default='pending')
    admin_note = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    reviewed_at = db.Column(db.DateTime, nullable=True)