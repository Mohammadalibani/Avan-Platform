from app.extensions import db
from flask_login import UserMixin

from datetime import datetime
class WorkRevisionMessage(db.Model):
    __tablename__ = 'work_revision_messages'
    
    id = db.Column(db.Integer, primary_key=True)
    work_status_id = db.Column(db.Integer, db.ForeignKey('personnel_work_status.id'), nullable=False)
    personnel_id = db.Column(db.Integer, db.ForeignKey('personnel.id'), nullable=False)
    period_id = db.Column(db.Integer, db.ForeignKey('work_periods.id'), nullable=False)
    
    from_role = db.Column(db.String(30), nullable=False)
    from_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    to_role = db.Column(db.String(30), nullable=False)
    to_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    message = db.Column(db.Text, nullable=False)
    message_type = db.Column(db.String(30), default='general')  # approve, direct_approve, revision, general
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    # روابط
    work_status = db.relationship('PersonnelWorkStatus', backref='revision_messages')
    personnel = db.relationship('Personnel')
    period = db.relationship('WorkPeriod')
    from_user = db.relationship('User', foreign_keys=[from_user_id])
    to_user = db.relationship('User', foreign_keys=[to_user_id])