# app/models/dynamic_field.py
from datetime import datetime
from app.extensions import db

class DynamicField(db.Model):
    __tablename__ = 'dynamic_fields'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    field_type = db.Column(db.String(20), nullable=False)
    is_required = db.Column(db.Boolean, default=False)
    is_locked = db.Column(db.Boolean, default=False)
    is_monitoring = db.Column(db.Boolean, default=False)
    is_key = db.Column(db.Boolean, default=False)
    field_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.now)
    is_active = db.Column(db.Boolean, default=True)