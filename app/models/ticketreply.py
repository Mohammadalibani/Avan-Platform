from app.extensions import db
from flask_login import UserMixin

from datetime import datetime
class TicketReply(db.Model):
    __tablename__ = 'ticket_replies'
    
    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey('tickets.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_admin_reply = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    ticket = db.relationship('Ticket', backref='replies')
    user = db.relationship('User', backref='ticket_replies')