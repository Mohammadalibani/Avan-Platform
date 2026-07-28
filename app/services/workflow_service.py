# app/services/workflow_service.py (اضافه کردن متدهای جدید)
from typing import Optional, List, Dict, Any
from app.services.base_service import BaseService
from app.models.workflow import Workflow, WorkflowStep
from app.models.task import Task
from app.models.user import User
from app.extensions import db


class WorkflowService(BaseService):
    """Service for Workflow operations"""
    
    def __init__(self):
        super().__init__(Workflow)
    
    def create_workflow(self, name: str, description: str = None, **kwargs) -> Workflow:
        """Create a new workflow"""
        workflow = Workflow(
            name=name,
            description=description,
            **kwargs
        )
        workflow.save()
        return workflow
    
    def add_step(self, workflow_id: int, name: str, sequence: int, 
                 action: str = None, role_name: str = None, description: str = None) -> Optional[WorkflowStep]:
        """Add a step to workflow"""
        workflow = self.get_by_id(workflow_id)
        if not workflow:
            return None
        
        step = WorkflowStep(
            workflow_id=workflow_id,
            name=name,
            sequence=sequence,
            action=action,
            role_name=role_name,
            description=description
        )
        step.save()
        return step
    
    def get_step_by_id(self, step_id: int) -> Optional[WorkflowStep]:
        """Get a workflow step by ID"""
        return WorkflowStep.query.get(step_id)
    
    def update_step(self, step_id: int, **kwargs) -> Optional[WorkflowStep]:
        """Update a workflow step"""
        step = self.get_step_by_id(step_id)
        if not step:
            return None
        
        for key, value in kwargs.items():
            if hasattr(step, key):
                setattr(step, key, value)
        
        step.save()
        return step
    
    def delete_step(self, step_id: int) -> bool:
        """Delete a workflow step"""
        step = self.get_step_by_id(step_id)
        if not step:
            return False
        
        step.delete()
        return True
    
    def get_workflow_steps(self, workflow_id: int) -> List[WorkflowStep]:
        """Get all steps of a workflow ordered by sequence"""
        workflow = self.get_by_id(workflow_id)
        if not workflow:
            return []
        return workflow.get_ordered_steps()
    
    def execute_workflow(self, workflow_id: int, task_id: int, user_id: int) -> Dict:
        """Execute a workflow step for a task"""
        workflow = self.get_by_id(workflow_id)
        if not workflow:
            return {'success': False, 'message': 'Workflow not found'}
        
        task = Task.query.get(task_id)
        if not task:
            return {'success': False, 'message': 'Task not found'}
        
        user = User.query.get(user_id)
        if not user:
            return {'success': False, 'message': 'User not found'}
        
        # Get current step based on task status
        steps = workflow.get_ordered_steps()
        current_step_index = self._get_current_step_index(task.status, steps)
        
        if current_step_index is None:
            return {'success': False, 'message': 'No matching step found'}
        
        # Check if user has required role
        step = steps[current_step_index]
        if step.role_name and not user.has_role(step.role_name):
            return {
                'success': False, 
                'message': f'User does not have required role: {step.role_name}'
            }
        
        # Execute step action
        if step.action:
            result = self._execute_action(step.action, task, user)
            if not result['success']:
                return result
        
        # Move to next step
        next_step_index = current_step_index + 1
        if next_step_index < len(steps):
            next_step = steps[next_step_index]
            task.status = self._get_status_from_step(next_step)
        else:
            task.status = 'completed'
        
        task.save()
        
        return {
            'success': True,
            'message': f'Workflow step "{step.name}" completed successfully',
            'current_step': step.name,
            'next_step': steps[next_step_index].name if next_step_index < len(steps) else 'Completed'
        }
    
    def _get_current_step_index(self, status: str, steps: List[WorkflowStep]) -> Optional[int]:
        """Get current step index based on task status"""
        status_map = {
            'pending': 0,
            'in_progress': 1,
            'review': 2,
            'approved': 3
        }
        index = status_map.get(status, 0)
        if index < len(steps):
            return index
        return None
    
    def _get_status_from_step(self, step: WorkflowStep) -> str:
        """Get task status from step name"""
        status_map = {
            'start': 'pending',
            'process': 'in_progress',
            'review': 'review',
            'approve': 'approved'
        }
        return status_map.get(step.name.lower(), step.name.lower())
    
    def _execute_action(self, action: str, task: Task, user: User) -> Dict:
        """Execute a workflow action"""
        # This is a placeholder for actual action execution
        # You can add more actions here
        return {'success': True, 'message': 'Action executed successfully'}
    
    def get_workflow_status(self, task_id: int) -> Dict:
        """Get workflow status for a task"""
        task = Task.query.get(task_id)
        if not task:
            return {'success': False, 'message': 'Task not found'}
        
        # Find workflow for this task's project
        workflow = Workflow.query.filter_by(is_active=True).first()
        if not workflow:
            return {'success': False, 'message': 'No active workflow found'}
        
        steps = workflow.get_ordered_steps()
        current_step_index = self._get_current_step_index(task.status, steps)
        
        return {
            'success': True,
            'workflow_name': workflow.name,
            'current_status': task.status,
            'current_step': steps[current_step_index].name if current_step_index is not None else None,
            'total_steps': len(steps),
            'progress': ((current_step_index + 1) / len(steps) * 100) if current_step_index is not None else 0
        }