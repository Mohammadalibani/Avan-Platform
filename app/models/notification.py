# app/models/notification.py
from datetime import datetime
from app.extensions import db

class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    notification_type = db.Column(db.String(30), default='workflow')
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    link = db.Column(db.String(500), nullable=True)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    # فیلدهای اضافی
    request_id = db.Column(db.Integer, nullable=True)
    request_type = db.Column(db.String(20), nullable=True)
    personnel_national_code = db.Column(db.String(10), nullable=True)
    personnel_full_name = db.Column(db.String(100), nullable=True)
    admin_note = db.Column(db.Text, nullable=True)