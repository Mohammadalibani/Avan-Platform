# app/models/attachment.py
from app.extensions import db
from app.models.base import BaseModel

class Attachment(BaseModel):
    """Attachment model"""
    __tablename__ = 'attachment'
    
    filename = db.Column(db.String(200), nullable=False)
    filepath = db.Column(db.String(500), nullable=False)
    filesize = db.Column(db.Integer)
    file_type = db.Column(db.String(50))
    
    # Foreign Keys
    task_id = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=False)
    uploaded_by_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    
    # Relationships
    task = db.relationship('Task', back_populates='attachments')
    uploaded_by = db.relationship('User')
    
    def to_dict(self, exclude=None):
        """Convert attachment to dictionary"""
        data = super().to_dict(exclude=exclude)
        data['task_title'] = self.task.title if self.task else None
        data['uploader_name'] = self.uploaded_by.full_name if self.uploaded_by else None
        return data
    
    def __repr__(self):
        return f'<Attachment {self.filename}>'