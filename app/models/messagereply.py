from app.extensions import db
from flask_login import UserMixin

from datetime import datetime
class MessageReply(db.Model):
    __tablename__ = 'message_replies'
    id = db.Column(db.Integer, primary_key=True)
    message_id = db.Column(db.Integer, db.ForeignKey('messages.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    message_rel = db.relationship('Message', backref='replies')
    user = db.relationship('User')