# app/models/role.py
from app.extensions import db
from app.models.base import BaseModel

# Association table for role permissions
role_permissions = db.Table('role_permissions',
    db.Column('role_id', db.Integer, db.ForeignKey('role.id'), primary_key=True),
    db.Column('permission_id', db.Integer, db.ForeignKey('permission.id'), primary_key=True)
)

class Role(BaseModel):
    """Role model"""
    __tablename__ = 'role'
    
    name = db.Column(db.String(80), unique=True, nullable=False)
    description = db.Column(db.String(200))
    is_default = db.Column(db.Boolean, default=False)
    
    # Relationships
    users = db.relationship('User', secondary='user_roles', back_populates='roles', lazy='dynamic')
    permissions = db.relationship('Permission', secondary=role_permissions, back_populates='roles', lazy='dynamic')
    
    def has_permission(self, permission_name):
        """Check if role has specific permission"""
        return self.permissions.filter_by(name=permission_name).first() is not None
    
    def add_permission(self, permission):
        """Add permission to role"""
        if not self.has_permission(permission.name):
            self.permissions.append(permission)
            self.save()
    
    def remove_permission(self, permission):
        """Remove permission from role"""
        if self.has_permission(permission.name):
            self.permissions.remove(permission)
            self.save()
    
    def to_dict(self, exclude=None):
        """Convert role to dictionary"""
        data = super().to_dict(exclude=exclude)
        data['permissions'] = [perm.name for perm in self.permissions]
        data['user_count'] = self.users.count()
        return data
    
    def __repr__(self):
        return f'<Role {self.name}>'