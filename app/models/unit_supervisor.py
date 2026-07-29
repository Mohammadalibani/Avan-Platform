# app/models/unit_supervisor.py
from app.extensions import db
from app.models.base import BaseModel

class UnitSupervisor(BaseModel):
    """سرپرستان واحد"""
    __tablename__ = 'unit_supervisors'
    
    unit_id = db.Column(db.Integer, db.ForeignKey('units.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    def __repr__(self):
        return f'<UnitSupervisor unit={self.unit_id} user={self.user_id}>'