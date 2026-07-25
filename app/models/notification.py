# app/models/notification.py
from app.extensions import db
from app.models.base import BaseModel

class Notification(BaseModel):
    """Notification model"""
    __tablename__ = 'notification'
    
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(50))
    is_read = db.Column(db.Boolean, default=False)
    link = db.Column(db.String(500))
    
    # Foreign Keys
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Relationships
    user = db.relationship('User', back_populates='notifications')
    
    def mark_as_read(self):
        """Mark notification as read"""
        self.is_read = True
        self.save()
    
    def to_dict(self, exclude=None):
        """Convert notification to dictionary"""
        data = super().to_dict(exclude=exclude)
        data['user_name'] = self.user.full_name if self.user else None
        return data
    
    def __repr__(self):
        return f'<Notification for User {self.user_id}>'