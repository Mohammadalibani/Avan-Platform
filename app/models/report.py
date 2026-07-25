# app/models/report.py
from app.extensions import db
from app.models.base import BaseModel

class Report(BaseModel):
    """Report model"""
    __tablename__ = 'report'
    
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    type = db.Column(db.String(50))
    format = db.Column(db.String(20), default='pdf')
    parameters = db.Column(db.Text)  # JSON string
    filepath = db.Column(db.String(500))
    generated_at = db.Column(db.DateTime)
    
    # Foreign Keys
    generated_by_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    
    # Relationships
    generated_by = db.relationship('User')
    
    def to_dict(self, exclude=None):
        """Convert report to dictionary"""
        data = super().to_dict(exclude=exclude)
        data['generated_by_name'] = self.generated_by.full_name if self.generated_by else None
        return data
    
    def __repr__(self):
        return f'<Report {self.name}>'