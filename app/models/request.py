# app/models/request.py
from datetime import datetime
import json
from app.extensions import db

class Request(db.Model):
    __tablename__ = 'requests'
    
    id = db.Column(db.Integer, primary_key=True)
    request_type = db.Column(db.String(50), nullable=False)
    requester_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    unit_supervisor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    status = db.Column(db.String(30), default='pending_unit')
    request_date = db.Column(db.DateTime, default=datetime.now)
    reviewed_at = db.Column(db.DateTime, nullable=True)
    revision_note = db.Column(db.Text, nullable=True)
    reject_reason = db.Column(db.Text, nullable=True)
    extra_data = db.Column(db.Text, nullable=True)
    attachment = db.Column(db.String(500), nullable=True)
    attachment_filename = db.Column(db.String(200), nullable=True)
    
    def get_extra_data(self):
        if self.extra_data:
            return json.loads(self.extra_data)
        return {}
    
    def set_extra_data(self, data):
        self.extra_data = json.dumps(data, ensure_ascii=False)
    
    def to_dict(self):
        extra = self.get_extra_data()
        return {
            'id': self.id,
            'request_type': self.request_type,
            'requester_id': self.requester_id,
            'status': self.status,
            'request_date': self.request_date.strftime('%Y/%m/%d %H:%M') if self.request_date else '',
            'reviewed_at': self.reviewed_at.strftime('%Y/%m/%d %H:%M') if self.reviewed_at else None,
            'revision_note': self.revision_note,
            'reject_reason': self.reject_reason,
            'extra_data': extra,
            'has_attachment': bool(self.attachment)
        }