from app.extensions import db
from flask_login import UserMixin

from datetime import datetime
class Department(db.Model):
    __tablename__ = 'departments'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    color = db.Column(db.String(7), default='#3498db')
    description = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    is_active = db.Column(db.Boolean, default=True)
    
    def get_jalali_created_date(self):
        import jdatetime
        return jdatetime.datetime.fromgregorian(datetime=self.created_at).strftime('%Y/%m/%d')
        