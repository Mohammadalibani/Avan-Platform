# app/models/global_announcement.py
from datetime import datetime
from app.extensions import db

class GlobalAnnouncement(db.Model):
    __tablename__ = 'global_announcements'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=True)
    message = db.Column(db.Text, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    priority = db.Column(db.Integer, default=0)
    bg_color = db.Column(db.String(100), default='rgba(59, 130, 246, 0.12)')
    border_color = db.Column(db.String(100), default='rgba(59, 130, 246, 0.3)')
    text_color = db.Column(db.String(20), default='#1e293b')
    icon = db.Column(db.String(50), default='📢')
    start_date = db.Column(db.String(20), nullable=True)
    end_date = db.Column(db.String(20), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    # Relationships
    creator = db.relationship('User', foreign_keys=[created_by], backref='created_announcements')
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'message': self.message,
            'is_active': self.is_active,
            'priority': self.priority,
            'bg_color': self.bg_color,
            'border_color': self.border_color,
            'text_color': self.text_color,
            'icon': self.icon,
            'start_date': self.start_date,
            'end_date': self.end_date,
            'created_at': self.created_at.strftime('%Y/%m/%d %H:%M') if self.created_at else '',
            'created_by': self.creator.get_full_name() if self.creator else 'سیستم'
        }