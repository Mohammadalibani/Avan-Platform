from datetime import datetime
from app.extensions import db
from flask_login import UserMixin
import jdatetime

class WorkPeriod(db.Model):
    __tablename__ = 'work_periods'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    start_date = db.Column(db.String(20), nullable=False)
    end_date = db.Column(db.String(20), nullable=False)
    deadline = db.Column(db.String(20), nullable=True)
    display_order = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    def get_jalali_created_date(self):
        if self.created_at:
            return jdatetime.datetime.fromgregorian(datetime=self.created_at).strftime('%Y/%m/%d')
        return ''