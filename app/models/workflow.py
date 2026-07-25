# app/models/workflow.py
from app.extensions import db
from app.models.base import BaseModel

class Workflow(BaseModel):
    """Workflow model"""
    __tablename__ = 'workflow'
    
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    steps = db.relationship('WorkflowStep', back_populates='workflow', lazy='dynamic', cascade='all, delete-orphan')
    
    def get_step_count(self):
        """Get number of steps"""
        return self.steps.count()
    
    def get_ordered_steps(self):
        """Get steps ordered by sequence"""
        return self.steps.order_by(WorkflowStep.sequence).all()
    
    def to_dict(self, exclude=None):
        """Convert workflow to dictionary"""
        data = super().to_dict(exclude=exclude)
        data['step_count'] = self.get_step_count()
        data['steps'] = [step.to_dict() for step in self.get_ordered_steps()]
        return data
    
    def __repr__(self):
        return f'<Workflow {self.name}>'


class WorkflowStep(BaseModel):
    """Workflow Step model"""
    __tablename__ = 'workflow_step'
    
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    sequence = db.Column(db.Integer, nullable=False)
    action = db.Column(db.String(100))
    role_name = db.Column(db.String(80))
    
    # Foreign Keys
    workflow_id = db.Column(db.Integer, db.ForeignKey('workflow.id'), nullable=False)
    
    # Relationships
    workflow = db.relationship('Workflow', back_populates='steps')
    
    def to_dict(self, exclude=None):
        """Convert workflow step to dictionary"""
        data = super().to_dict(exclude=exclude)
        data['workflow_name'] = self.workflow.name if self.workflow else None
        return data
    
    def __repr__(self):
        return f'<WorkflowStep {self.name} (Sequence {self.sequence})>'