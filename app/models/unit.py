from app.extensions import db
from flask_login import UserMixin

from datetime import datetime
class Unit(db.Model):
    __tablename__ = 'units'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=False)
    description = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    is_active = db.Column(db.Boolean, default=True)
    needs_approval = db.Column(db.Boolean, default=True)
    department = db.relationship('Department', backref='units')
    
    def get_jalali_created_date(self):
        import jdatetime
        return jdatetime.datetime.fromgregorian(datetime=self.created_at).strftime('%Y/%m/%d')
        