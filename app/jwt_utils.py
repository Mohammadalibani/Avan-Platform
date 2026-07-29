# app/jwt_utils.py
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from datetime import timedelta
from functools import wraps
from flask import jsonify, request
from app.models.user import User

def generate_token(user_id, expires_in=3600):
    """Generate JWT token using flask-jwt-extended"""
    # identity باید string باشد
    access_token = create_access_token(
        identity=str(user_id),
        expires_delta=timedelta(seconds=expires_in)
    )
    return access_token

def token_required(f):
    """Decorator to protect routes using flask-jwt-extended"""
    @wraps(f)
    @jwt_required()  # استفاده از jwt_required واقعی
    def decorated(*args, **kwargs):
        try:
            # دریافت user_id از توکن
            user_id = get_jwt_identity()
            user = User.query.get(int(user_id))
            
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
        except Exception as e:
            return jsonify({
                'success': False,
                'message': str(e)
            }), 401
    
    return decorated

def admin_required(f):
    """Decorator to check if user is admin"""
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        user = request.user
        if user.role != 'admin':
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
            # TODO: پیاده‌سازی سیستم مجوزها
            return f(*args, **kwargs)
        return decorated
    return decorator