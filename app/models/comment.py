# app/models/comment.py
from app.extensions import db
from app.models.base import BaseModel

class Comment(BaseModel):
    """Comment model"""
    __tablename__ = 'comment'
    
    content = db.Column(db.Text, nullable=False)
    
    # Foreign Keys
    task_id = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Relationships
    task = db.relationship('Task', back_populates='comments')
    author = db.relationship('User', back_populates='comments')
    
    def to_dict(self, exclude=None):
        """Convert comment to dictionary"""
        data = super().to_dict(exclude=exclude)
        data['author_name'] = self.author.full_name if self.author else None
        data['task_title'] = self.task.title if self.task else None
        return data
    
    def __repr__(self):
        return f'<Comment by {self.author_id} on Task {self.task_id}>'