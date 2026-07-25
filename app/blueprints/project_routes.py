# app/blueprints/project_routes.py
from flask import request, jsonify
from app.blueprints import project_bp
from app.services.project_service import ProjectService
from app.jwt_utils import token_required, admin_required

project_service = ProjectService()


@project_bp.route('', methods=['GET'])
@token_required
def get_projects():
    """Get all projects"""
    projects = project_service.get_all()
    return jsonify({
        'success': True,
        'data': [project.to_dict() for project in projects],
        'count': len(projects)
    }), 200


@project_bp.route('/<int:project_id>', methods=['GET'])
@token_required
def get_project(project_id):
    """Get project by ID"""
    project = project_service.get_by_id(project_id)
    if not project:
        return jsonify({
            'success': False,
            'message': 'Project not found'
        }), 404
    
    return jsonify({
        'success': True,
        'data': project.to_dict()
    }), 200


@project_bp.route('', methods=['POST'])
@token_required
def create_project():
    """Create a new project"""
    data = request.get_json()
    
    required_fields = ['name', 'code']
    for field in required_fields:
        if not data.get(field):
            return jsonify({
                'success': False,
                'message': f'{field} is required'
            }), 400
    
    try:
        project = project_service.create_project(
            name=data['name'],
            code=data['code'],
            owner_id=request.user.id,  # Use current user as owner
            description=data.get('description'),
            status=data.get('status', 'active'),
            priority=data.get('priority', 'medium')
        )
        
        return jsonify({
            'success': True,
            'message': 'Project created successfully',
            'data': project.to_dict()
        }), 201
    
    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400


@project_bp.route('/<int:project_id>', methods=['PUT'])
@token_required
def update_project(project_id):
    """Update project"""
    data = request.get_json()
    
    project = project_service.get_by_id(project_id)
    if not project:
        return jsonify({
            'success': False,
            'message': 'Project not found'
        }), 404
    
    # Only owner or admin can update
    if project.owner_id != request.user.id and not request.user.has_role('admin'):
        return jsonify({
            'success': False,
            'message': 'Permission denied'
        }), 403
    
    allowed_fields = ['name', 'description', 'status', 'priority', 'start_date', 'end_date']
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    
    updated_project = project_service.update(project_id, **update_data)
    
    return jsonify({
        'success': True,
        'message': 'Project updated successfully',
        'data': updated_project.to_dict()
    }), 200


@project_bp.route('/<int:project_id>', methods=['DELETE'])
@token_required
def delete_project(project_id):
    """Delete project (owner or admin only)"""
    project = project_service.get_by_id(project_id)
    if not project:
        return jsonify({
            'success': False,
            'message': 'Project not found'
        }), 404
    
    # Only owner or admin can delete
    if project.owner_id != request.user.id and not request.user.has_role('admin'):
        return jsonify({
            'success': False,
            'message': 'Permission denied'
        }), 403
    
    project_service.delete(project_id)
    
    return jsonify({
        'success': True,
        'message': 'Project deleted successfully'
    }), 200


@project_bp.route('/<int:project_id>/statistics', methods=['GET'])
@token_required
def get_project_statistics(project_id):
    """Get project statistics"""
    stats = project_service.get_statistics(project_id)
    if not stats:
        return jsonify({
            'success': False,
            'message': 'Project not found'
        }), 404
    
    return jsonify({
        'success': True,
        'data': stats
    }), 200


@project_bp.route('/user/<int:user_id>', methods=['GET'])
@token_required
def get_user_projects(user_id):
    """Get projects for a specific user"""
    projects = project_service.get_user_projects(user_id)
    return jsonify({
        'success': True,
        'data': [project.to_dict() for project in projects],
        'count': len(projects)
    }), 200


@project_bp.route('/status/<string:status>', methods=['GET'])
@token_required
def get_projects_by_status(status):
    """Get projects by status"""
    projects = project_service.get_projects_by_status(status)
    return jsonify({
        'success': True,
        'data': [project.to_dict() for project in projects],
        'count': len(projects)
    }), 200