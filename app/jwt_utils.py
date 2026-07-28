# app/jwt_utils.py
import jwt
from datetime import datetime, timedelta
from flask import current_app, request, jsonify
from functools import wraps
from app.models.user import User

def generate_token(user_id, expires_in=3600):
    """Generate JWT token for user"""
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(seconds=expires_in),
        'iat': datetime.utcnow()
    }
    token = jwt.encode(
        payload,
        current_app.config['SECRET_KEY'],
        algorithm='HS256'
    )
    return token

def decode_token(token):
    """Decode JWT token"""
    try:
        payload = jwt.decode(
            token,
            current_app.config['SECRET_KEY'],
            algorithms=['HS256']
        )
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def token_required(f):
    """Decorator to protect routes with JWT"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({
                'success': False,
                'message': 'Token is missing'
            }), 401
        
        payload = decode_token(token)
        if not payload:
            return jsonify({
                'success': False,
                'message': 'Invalid or expired token'
            }), 401
        
        # Get user from database
        user = User.query.get(payload['user_id'])
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 401
        
        if not user.is_active:
            return jsonify({
                'success': False,
                'message': 'User account is deactivated'
            }), 401
        
        # Add user to request context
        request.user = user
        request.user_id = user.id
        
        return f(*args, **kwargs)
    
    return decorated

def admin_required(f):
    """Decorator to check if user is admin"""
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        user = request.user
        if not user.has_role('admin'):
            return jsonify({
                'success': False,
                'message': 'Admin access required'
            }), 403
        return f(*args, **kwargs)
    return decorated

def permission_required(permission_name):
    """Decorator to check if user has specific permission"""
    def decorator(f):
        @wraps(f)
        @token_required
        def decorated(*args, **kwargs):
            user = request.user
            if not user.has_permission(permission_name):
                return jsonify({
                    'success': False,
                    'message': f'Permission "{permission_name}" required'
                }), 403
            return f(*args, **kwargs)
        return decorated
    return decorator