# app/models/dynamic_field.py
from app.extensions import db
from app.models.base import BaseModel

class DynamicField(BaseModel):
    """Dynamic field model"""
    __tablename__ = 'dynamic_field'
    
    title = db.Column(db.String(100), nullable=False)
    field_type = db.Column(db.String(50), default='text')
    is_required = db.Column(db.Boolean, default=False)
    is_locked = db.Column(db.Boolean, default=False)
    is_monitoring = db.Column(db.Boolean, default=False)
    is_key = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    field_order = db.Column(db.Integer, default=0)
    
    def __repr__(self):
        return f'<DynamicField {self.title}>'

class PersonnelValue(BaseModel):
    """Personnel value model"""
    __tablename__ = 'personnel_value'
    
    field_id = db.Column(db.Integer, db.ForeignKey('dynamic_field.id'))
    personnel_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    value = db.Column(db.Text)
    
    def __repr__(self):
        return f'<PersonnelValue field={self.field_id}>'