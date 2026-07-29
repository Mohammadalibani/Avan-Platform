# app/blueprints/auth_routes.py
from flask import request, jsonify
from app.blueprints import auth_bp
from app.services.auth_service import AuthService
from app.jwt_utils import generate_token, token_required

auth_service = AuthService()

def get_role_persian(role):
    """دریافت نقش به فارسی"""
    roles_map = {
        'admin': 'مدیر کل سیستم',
        'org_manager': 'مدیر سازمان',
        'dept_manager': 'مدیر اداره',
        'hr_manager': 'مدیر منابع انسانی',
        'unit_supervisor': 'سرپرست واحد',
        'subordinate': 'کاربر عادی'
    }
    return roles_map.get(role, role)

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({
                'success': False,
                'message': 'Username and password are required'
            }), 400
        
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
        
        if not user.is_approved:
            return jsonify({
                'success': False,
                'message': 'حساب کاربری شما در انتظار تایید ادمین است. لطفاً صبر کنید.',
                'code': 'pending_approval'
            }), 403
        
        # ===== تولید توکن با flask-jwt-extended =====
        token = generate_token(user.id)
        auth_service.user_service.update_last_login(user.id)
        
        user_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'full_name': user.full_name,
            'national_code': user.national_code,
            'phone': user.phone,
            'role': getattr(user, 'role', 'subordinate'),
            'role_persian': get_role_persian(getattr(user, 'role', 'subordinate')),
            'avatar': user.avatar,
            'is_active': user.is_active,
            'is_approved': user.is_approved,
            'is_profile_complete': getattr(user, 'is_profile_complete', False),
            'personnel_code': user.personnel_code,
            'created_at': user.created_at.isoformat() if user.created_at else None,
            'last_login': user.last_login.isoformat() if user.last_login else None,
        }
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'data': {
                'token': token,
                'user': user_data
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Login error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

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
    
    user_data = {
        'id': user.id,
        'username': user.username,
        'email': getattr(user, 'email', ''),
        'full_name': getattr(user, 'full_name', user.username),
        'role': getattr(user, 'role', 'subordinate'),
        'role_persian': get_role_persian(getattr(user, 'role', 'subordinate')),
        'is_active': user.is_active,
        'is_approved': getattr(user, 'is_approved', True),
        'personnel_code': getattr(user, 'personnel_code', ''),
        'created_at': user.created_at.isoformat() if hasattr(user, 'created_at') and user.created_at else None,
        'last_login': user.last_login.isoformat() if hasattr(user, 'last_login') and user.last_login else None,
    }
    
    return jsonify({
        'success': True,
        'data': user_data
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