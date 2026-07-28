# app/blueprints/task_routes.py
from flask import request, jsonify
from app.blueprints import task_bp
from app.services.task_service import TaskService
from app.jwt_utils import token_required

task_service = TaskService()


@task_bp.route('', methods=['GET'])
@token_required
def get_tasks():
    """Get all tasks"""
    tasks = task_service.get_all()
    return jsonify({
        'success': True,
        'data': [task.to_dict() for task in tasks],
        'count': len(tasks)
    }), 200


@task_bp.route('/<int:task_id>', methods=['GET'])
@token_required
def get_task(task_id):
    """Get task by ID"""
    task = task_service.get_by_id(task_id)
    if not task:
        return jsonify({
            'success': False,
            'message': 'Task not found'
        }), 404
    
    return jsonify({
        'success': True,
        'data': task.to_dict()
    }), 200


@task_bp.route('', methods=['POST'])
@token_required
def create_task():
    """Create a new task"""
    data = request.get_json()
    
    required_fields = ['title', 'project_id']
    for field in required_fields:
        if not data.get(field):
            return jsonify({
                'success': False,
                'message': f'{field} is required'
            }), 400
    
    try:
        task = task_service.create_task(
            title=data['title'],
            project_id=data['project_id'],
            assigned_to_id=data.get('assigned_to_id', request.user.id),
            description=data.get('description'),
            status=data.get('status', 'pending'),
            priority=data.get('priority', 'medium'),
            estimated_hours=data.get('estimated_hours'),
            due_date=data.get('due_date')
        )
        
        return jsonify({
            'success': True,
            'message': 'Task created successfully',
            'data': task.to_dict()
        }), 201
    
    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400


@task_bp.route('/<int:task_id>', methods=['PUT'])
@token_required
def update_task(task_id):
    """Update task"""
    data = request.get_json()
    
    task = task_service.get_by_id(task_id)
    if not task:
        return jsonify({
            'success': False,
            'message': 'Task not found'
        }), 404
    
    allowed_fields = ['title', 'description', 'status', 'priority', 'due_date', 
                     'estimated_hours', 'actual_hours', 'assigned_to_id']
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    
    updated_task = task_service.update(task_id, **update_data)
    
    return jsonify({
        'success': True,
        'message': 'Task updated successfully',
        'data': updated_task.to_dict()
    }), 200


@task_bp.route('/<int:task_id>', methods=['DELETE'])
@token_required
def delete_task(task_id):
    """Delete task"""
    task = task_service.get_by_id(task_id)
    if not task:
        return jsonify({
            'success': False,
            'message': 'Task not found'
        }), 404
    
    task_service.delete(task_id)
    
    return jsonify({
        'success': True,
        'message': 'Task deleted successfully'
    }), 200


@task_bp.route('/project/<int:project_id>', methods=['GET'])
@token_required
def get_project_tasks(project_id):
    """Get tasks for a specific project"""
    tasks = task_service.get_tasks_by_project(project_id)
    return jsonify({
        'success': True,
        'data': [task.to_dict() for task in tasks],
        'count': len(tasks)
    }), 200


@task_bp.route('/user/<int:user_id>', methods=['GET'])
@token_required
def get_user_tasks(user_id):
    """Get tasks assigned to a specific user"""
    tasks = task_service.get_tasks_by_user(user_id)
    return jsonify({
        'success': True,
        'data': [task.to_dict() for task in tasks],
        'count': len(tasks)
    }), 200


@task_bp.route('/<int:task_id>/assign', methods=['POST'])
@token_required
def assign_task(task_id):
    """Assign task to a user"""
    data = request.get_json()
    
    if not data or not data.get('user_id'):
        return jsonify({
            'success': False,
            'message': 'user_id is required'
        }), 400
    
    task = task_service.assign_task(task_id, data['user_id'])
    if not task:
        return jsonify({
            'success': False,
            'message': 'Task or user not found'
        }), 404
    
    return jsonify({
        'success': True,
        'message': 'Task assigned successfully',
        'data': task.to_dict()
    }), 200


@task_bp.route('/<int:task_id>/status/<string:status>', methods=['PATCH'])
@token_required
def update_task_status(task_id, status):
    """Update task status"""
    task = task_service.update_status(task_id, status)
    if not task:
        return jsonify({
            'success': False,
            'message': 'Task not found'
        }), 404
    
    return jsonify({
        'success': True,
        'message': f"Task status updated to '{status}'",
        'data': task.to_dict()
    }), 200


@task_bp.route('/overdue', methods=['GET'])
@token_required
def get_overdue_tasks():
    """Get all overdue tasks"""
    tasks = task_service.get_overdue_tasks()
    return jsonify({
        'success': True,
        'data': [task.to_dict() for task in tasks],
        'count': len(tasks)
    }), 200