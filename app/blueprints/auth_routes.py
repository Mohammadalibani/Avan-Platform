# app/blueprints/auth_routes.py
from flask import request, jsonify
from app.blueprints import auth_bp
from app.services.auth_service import AuthService
from app.jwt_utils import generate_token, token_required

auth_service = AuthService()


@auth_bp.route('/login', methods=['POST'])
def login():
    """User login with JWT"""
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({
            'success': False,
            'message': 'Username and password are required'
        }), 400
    
    # Authenticate user
    user = auth_service.user_service.authenticate(
        data['username'],
        data['password']
    )
    
    if not user:
        return jsonify({
            'success': False,
            'message': 'Invalid username or password'
        }), 401
    
    if not user.is_active:
        return jsonify({
            'success': False,
            'message': 'Account is deactivated'
        }), 401
    
    # Generate JWT token
    token = generate_token(user.id)
    
    # Update last login
    auth_service.user_service.update_last_login(user.id)
    
    return jsonify({
        'success': True,
        'message': 'Login successful',
        'data': {
            'token': token,
            'user': user.to_dict()
        }
    }), 200


@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout():
    """User logout (client-side token removal)"""
    return jsonify({
        'success': True,
        'message': 'Logout successful'
    }), 200


@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user():
    """Get current logged-in user"""
    user = request.user
    return jsonify({
        'success': True,
        'data': user.to_dict()
    }), 200


@auth_bp.route('/refresh', methods=['POST'])
@token_required
def refresh_token():
    """Refresh JWT token"""
    user = request.user
    new_token = generate_token(user.id)
    
    return jsonify({
        'success': True,
        'data': {
            'token': new_token
        }
    }), 200


@auth_bp.route('/change-password', methods=['POST'])
@token_required
def change_password():
    """Change user password"""
    data = request.get_json()
    
    if not data or not data.get('old_password') or not data.get('new_password'):
        return jsonify({
            'success': False,
            'message': 'Old and new password are required'
        }), 400
    
    user = request.user
    result = auth_service.change_password(
        user_id=user.id,
        old_password=data['old_password'],
        new_password=data['new_password']
    )
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 400


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Request password reset"""
    data = request.get_json()
    
    if not data or not data.get('email'):
        return jsonify({
            'success': False,
            'message': 'Email is required'
        }), 400
    
    result = auth_service.reset_password(data['email'])
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 404