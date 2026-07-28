# app/blueprints/workflow_routes.py
from flask import request, jsonify
from app.blueprints import workflow_bp
from app.services.workflow_service import WorkflowService
from app.jwt_utils import token_required, admin_required

workflow_service = WorkflowService()


@workflow_bp.route('', methods=['GET'])
@token_required
def get_workflows():
    """Get all workflows"""
    workflows = workflow_service.get_all()
    return jsonify({
        'success': True,
        'data': [w.to_dict() for w in workflows],
        'count': len(workflows)
    }), 200


@workflow_bp.route('', methods=['POST'])
@admin_required
def create_workflow():
    """Create a new workflow"""
    data = request.get_json()
    
    if not data or not data.get('name'):
        return jsonify({
            'success': False,
            'message': 'Workflow name is required'
        }), 400
    
    try:
        workflow = workflow_service.create_workflow(
            name=data['name'],
            description=data.get('description'),
            is_active=data.get('is_active', True)
        )
        return jsonify({
            'success': True,
            'message': 'Workflow created successfully',
            'data': workflow.to_dict()
        }), 201
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400


@workflow_bp.route('/<int:workflow_id>', methods=['GET'])
@token_required
def get_workflow(workflow_id):
    """Get workflow by ID"""
    workflow = workflow_service.get_by_id(workflow_id)
    if not workflow:
        return jsonify({
            'success': False,
            'message': 'Workflow not found'
        }), 404
    
    return jsonify({
        'success': True,
        'data': workflow.to_dict()
    }), 200


@workflow_bp.route('/<int:workflow_id>/steps', methods=['POST'])
@admin_required
def add_step(workflow_id):
    """Add a step to workflow"""
    data = request.get_json()
    
    required_fields = ['name', 'sequence']
    for field in required_fields:
        if not data.get(field):
            return jsonify({
                'success': False,
                'message': f'{field} is required'
            }), 400
    
    step = workflow_service.add_step(
        workflow_id=workflow_id,
        name=data['name'],
        sequence=data['sequence'],
        action=data.get('action'),
        role_name=data.get('role_name'),
        description=data.get('description')
    )
    
    if not step:
        return jsonify({
            'success': False,
            'message': 'Workflow not found'
        }), 404
    
    return jsonify({
        'success': True,
        'message': 'Step added successfully',
        'data': step.to_dict()
    }), 201


@workflow_bp.route('/<int:workflow_id>/execute', methods=['POST'])
@token_required
def execute_workflow(workflow_id):
    """Execute workflow for a task"""
    data = request.get_json()
    
    if not data or not data.get('task_id'):
        return jsonify({
            'success': False,
            'message': 'task_id is required'
        }), 400
    
    result = workflow_service.execute_workflow(
        workflow_id=workflow_id,
        task_id=data['task_id'],
        user_id=request.user.id
    )
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 400


@workflow_bp.route('/status/<int:task_id>', methods=['GET'])
@token_required
def get_workflow_status(task_id):
    """Get workflow status for a task"""
    result = workflow_service.get_workflow_status(task_id)
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 404