# app/models/permission.py
from app.extensions import db
from app.models.base import BaseModel

class Permission(BaseModel):
    """Permission model"""
    __tablename__ = 'permission'
    
    name = db.Column(db.String(80), unique=True, nullable=False)
    description = db.Column(db.String(200))
    resource = db.Column(db.String(80))
    action = db.Column(db.String(80))
    
    # Relationships
    roles = db.relationship('Role', secondary='role_permissions', back_populates='permissions', lazy='dynamic')
    
    def to_dict(self, exclude=None):
        """Convert permission to dictionary"""
        data = super().to_dict(exclude=exclude)
        data['role_count'] = self.roles.count()
        return data
    
    def __repr__(self):
        return f'<Permission {self.name}>'