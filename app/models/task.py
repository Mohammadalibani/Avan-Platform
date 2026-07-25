# app/models/task.py
from app.extensions import db
from app.models.base import BaseModel

class Task(BaseModel):
    """Task model"""
    __tablename__ = 'task'
    
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String(20), default='pending')
    priority = db.Column(db.String(20), default='medium')
    due_date = db.Column(db.DateTime)
    estimated_hours = db.Column(db.Float)
    actual_hours = db.Column(db.Float)
    
    # Foreign Keys
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    assigned_to_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    parent_task_id = db.Column(db.Integer, db.ForeignKey('task.id'))
    
    # Relationships
    project = db.relationship('Project', back_populates='tasks')
    assigned_to = db.relationship('User', back_populates='tasks')
    parent_task = db.relationship('Task', remote_side='Task.id', backref='subtasks')
    comments = db.relationship('Comment', back_populates='task', lazy='dynamic', cascade='all, delete-orphan')
    attachments = db.relationship('Attachment', back_populates='task', lazy='dynamic', cascade='all, delete-orphan')
    
    def is_overdue(self):
        """Check if task is overdue"""
        from datetime import datetime
        if self.due_date and self.status != 'completed':
            return datetime.utcnow() > self.due_date
        return False
    
    def get_subtask_count(self):
        """Get number of subtasks"""
        return len(self.subtasks) if self.subtasks else 0
    
    def to_dict(self, exclude=None):
        """Convert task to dictionary"""
        data = super().to_dict(exclude=exclude)
        data['is_overdue'] = self.is_overdue()
        data['subtask_count'] = self.get_subtask_count()
        data['assigned_to_name'] = self.assigned_to.full_name if self.assigned_to else None
        data['project_name'] = self.project.name if self.project else None
        return data
    
    def __repr__(self):
        return f'<Task {self.title}>'