# app/models/personnel_value.py
from datetime import datetime
from app.extensions import db

class PersonnelValue(db.Model):
    __tablename__ = 'personnel_values'
    
    id = db.Column(db.Integer, primary_key=True)
    personnel_id = db.Column(db.Integer, db.ForeignKey('personnel.id'), nullable=False)
    field_id = db.Column(db.Integer, db.ForeignKey('dynamic_fields.id'), nullable=False)
    period_id = db.Column(db.Integer, nullable=True)
    value_text = db.Column(db.Text, nullable=True)
    value_number = db.Column(db.Float, nullable=True)
    value_date = db.Column(db.String(20), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    field = db.relationship('DynamicField', backref='values', lazy=True)