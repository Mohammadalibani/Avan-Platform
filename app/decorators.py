# app/decorators.py
from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity
from app.models.user import User

def role_required(*roles):
    """دکوریتور برای محدودیت دسترسی بر اساس نقش"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                current_user_id = get_jwt_identity()
                user = User.query.get(current_user_id)
                
                if not user:
                    return jsonify({'error': 'User not found'}), 404
                
                # اگر نقش کاربر در لیست نقش‌های مجاز باشد
                if user.role in roles:
                    return f(*args, **kwargs)
                else:
                    return jsonify({'error': 'Permission denied'}), 403
            except Exception as e:
                return jsonify({'error': str(e)}), 401
        
        return decorated_function
    return decorator


def login_required(f):
    """دکوریتور برای بررسی احراز هویت (جایگزین JWT)"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            
            if not user:
                return jsonify({'error': 'Unauthorized'}), 401
            
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({'error': str(e)}), 401
    
    return decorated_function