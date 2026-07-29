# app/models/project.py
from app.extensions import db
from app.models.base import BaseModel


class Project(BaseModel):
    __tablename__ = 'project'
    
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    code = db.Column(db.String(50), unique=True, nullable=False)
    status = db.Column(db.String(20), default='active')
    start_date = db.Column(db.DateTime)
    end_date = db.Column(db.DateTime)
    priority = db.Column(db.String(20), default='medium')
    
    # Foreign Keys
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Relationships
    owner = db.relationship('User', back_populates='projects', lazy='joined')
    tasks = db.relationship('Task', back_populates='project', lazy='dynamic', cascade='all, delete-orphan')
    
    def get_task_count(self):
        """Get total task count"""
        return self.tasks.count()
    
    def get_completed_tasks(self):
        """Get completed tasks"""
        return self.tasks.filter_by(status='completed').count()
    
    def get_progress(self):
        """Calculate project progress percentage"""
        total = self.get_task_count()
        if total == 0:
            return 0
        completed = self.get_completed_tasks()
        return int((completed / total) * 100)
    
    def to_dict(self, exclude=None):
        data = super().to_dict(exclude=exclude)
        data['progress'] = self.get_progress()
        data['task_count'] = self.get_task_count()
        data['owner_name'] = self.owner.full_name if self.owner else None
        return data