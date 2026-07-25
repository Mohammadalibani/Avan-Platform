# app/blueprints/user_routes.py - اضافه کردن @token_required
from flask import request, jsonify
from app.blueprints import user_bp
from app.services.user_service import UserService
from app.jwt_utils import token_required, admin_required

user_service = UserService()


@user_bp.route('', methods=['GET'])
@token_required
def get_users():
    """Get all users (authenticated)"""
    users = user_service.get_all()
    return jsonify({
        'success': True,
        'data': [user.to_dict() for user in users],
        'count': len(users)
    }), 200


@user_bp.route('/<int:user_id>', methods=['GET'])
@token_required
def get_user(user_id):
    """Get user by ID"""
    user = user_service.get_by_id(user_id)
    if not user:
        return jsonify({
            'success': False,
            'message': 'User not found'
        }), 404
    
    return jsonify({
        'success': True,
        'data': user.to_dict()
    }), 200


@user_bp.route('', methods=['POST'])
def create_user():
    """Create a new user (public)"""
    data = request.get_json()
    
    required_fields = ['username', 'email', 'password']
    for field in required_fields:
        if not data.get(field):
            return jsonify({
                'success': False,
                'message': f'{field} is required'
            }), 400
    
    try:
        user = user_service.create_user(
            username=data['username'],
            email=data['email'],
            password=data['password'],
            full_name=data.get('full_name'),
            is_active=data.get('is_active', True)
        )
        
        return jsonify({
            'success': True,
            'message': 'User created successfully',
            'data': user.to_dict()
        }), 201
    
    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400


@user_bp.route('/<int:user_id>', methods=['PUT'])
@token_required
def update_user(user_id):
    """Update user (authenticated)"""
    data = request.get_json()
    
    user = user_service.get_by_id(user_id)
    if not user:
        return jsonify({
            'success': False,
            'message': 'User not found'
        }), 404
    
    # Only allow users to update themselves or admins
    if request.user.id != user_id and not request.user.has_role('admin'):
        return jsonify({
            'success': False,
            'message': 'Permission denied'
        }), 403
    
    allowed_fields = ['full_name', 'avatar', 'is_active', 'is_verified']
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    
    updated_user = user_service.update(user_id, **update_data)
    
    return jsonify({
        'success': True,
        'message': 'User updated successfully',
        'data': updated_user.to_dict()
    }), 200


@user_bp.route('/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    """Delete user (admin only)"""
    user = user_service.get_by_id(user_id)
    if not user:
        return jsonify({
            'success': False,
            'message': 'User not found'
        }), 404
    
    user_service.delete(user_id)
    
    return jsonify({
        'success': True,
        'message': 'User deleted successfully'
    }), 200


@user_bp.route('/search', methods=['GET'])
@token_required
def search_users():
    """Search users by term"""
    search_term = request.args.get('q', '')
    if not search_term:
        return jsonify({
            'success': False,
            'message': 'Search term is required'
        }), 400
    
    users = user_service.search_users(search_term)
    
    return jsonify({
        'success': True,
        'data': [user.to_dict() for user in users],
        'count': len(users)
    }), 200


@user_bp.route('/<int:user_id>/roles', methods=['POST'])
@admin_required
def assign_role(user_id):
    """Assign role to user (admin only)"""
    data = request.get_json()
    
    if not data or not data.get('role_name'):
        return jsonify({
            'success': False,
            'message': 'role_name is required'
        }), 400
    
    try:
        user = user_service.assign_role(user_id, data['role_name'])
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        return jsonify({
            'success': True,
            'message': f"Role '{data['role_name']}' assigned successfully",
            'data': user.to_dict()
        }), 200
    
    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400


@user_bp.route('/<int:user_id>/roles/<role_name>', methods=['DELETE'])
@admin_required
def remove_role(user_id, role_name):
    """Remove role from user (admin only)"""
    user = user_service.remove_role(user_id, role_name)
    if not user:
        return jsonify({
            'success': False,
            'message': 'User not found'
        }), 404
    
    return jsonify({
        'success': True,
        'message': f"Role '{role_name}' removed successfully",
        'data': user.to_dict()
    }), 200