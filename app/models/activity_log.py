# app/models/activity_log.py
from datetime import datetime
import jdatetime
from app.extensions import db

class ActivityLog(db.Model):
    __tablename__ = 'activity_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    user_name = db.Column(db.String(100), nullable=True)
    message = db.Column(db.Text, nullable=False)
    badge = db.Column(db.String(50), nullable=True)
    log_type = db.Column(db.String(30), default='info')
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    # Relationships
    user = db.relationship('User', foreign_keys=[user_id], backref='activity_logs')
    
    def get_jalali_date(self):
        if self.created_at:
            return jdatetime.datetime.fromgregorian(datetime=self.created_at).strftime('%Y/%m/%d %H:%M:%S')
        return ''