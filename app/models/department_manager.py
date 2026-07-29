# app/models/department_manager.py
from app.extensions import db
from app.models.base import BaseModel

class DepartmentManager(BaseModel):
    """مدیران دپارتمان"""
    __tablename__ = 'department_managers'
    
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    def __repr__(self):
        return f'<DepartmentManager dept={self.department_id} user={self.user_id}>'