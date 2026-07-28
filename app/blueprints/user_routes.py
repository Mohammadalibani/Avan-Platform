# app/blueprints/user_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.user import User
from app.decorators import role_required

# ===== تعریف Blueprint =====
user_bp = Blueprint('user', __name__, url_prefix='/api/users')


# ==================== دریافت لیست کاربران ====================
@user_bp.route('', methods=['GET'])
@jwt_required()
def get_users():
    """دریافت لیست کاربران"""
    try:
        # دریافت پارامترهای صفحه‌بندی و فیلتر
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 25, type=int)
        search = request.args.get('search', '')
        role = request.args.get('role', '')
        
        query = User.query
        
        if search:
            query = query.filter(
                db.or_(
                    User.username.ilike(f'%{search}%'),
                    User.full_name.ilike(f'%{search}%'),
                    User.email.ilike(f'%{search}%'),
                    User.national_code.ilike(f'%{search}%')
                )
            )
        
        if role:
            query = query.filter_by(role=role)
        
        paginated = query.paginate(page=page, per_page=per_page, error_out=False)
        
        users = []
        for u in paginated.items:
            users.append({
                'id': u.id,
                'username': u.username,
                'email': u.email,
                'full_name': u.full_name,
                'national_code': getattr(u, 'national_code', ''),
                'phone': getattr(u, 'phone', ''),
                'role': getattr(u, 'role', 'subordinate'),
                'role_persian': _get_role_persian(getattr(u, 'role', 'subordinate')),
                'is_active': u.is_active,
                'is_approved': getattr(u, 'is_approved', True),
                'is_profile_complete': getattr(u, 'is_profile_complete', False),
                'personnel_code': getattr(u, 'personnel_code', ''),
                'avatar': getattr(u, 'avatar', ''),
                'created_at': u.created_at.isoformat() if u.created_at else None,
                'last_login': u.last_login.isoformat() if u.last_login else None,
            })
        
        return jsonify({
            'success': True,
            'data': {
                'users': users,
                'total': paginated.total,
                'page': page,
                'per_page': per_page,
                'pages': paginated.pages
            }
        }), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500


# ==================== دریافت اطلاعات یک کاربر ====================
@user_bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    """دریافت اطلاعات یک کاربر"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'success': False, 'message': 'کاربر یافت نشد'}), 404
        
        return jsonify({
            'success': True,
            'data': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': user.full_name,
                'national_code': getattr(user, 'national_code', ''),
                'phone': getattr(user, 'phone', ''),
                'role': getattr(user, 'role', 'subordinate'),
                'role_persian': _get_role_persian(getattr(user, 'role', 'subordinate')),
                'is_active': user.is_active,
                'is_approved': getattr(user, 'is_approved', True),
                'is_profile_complete': getattr(user, 'is_profile_complete', False),
                'personnel_code': getattr(user, 'personnel_code', ''),
                'avatar': getattr(user, 'avatar', ''),
                'created_at': user.created_at.isoformat() if user.created_at else None,
                'last_login': user.last_login.isoformat() if user.last_login else None,
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ==================== ایجاد کاربر جدید ====================
@user_bp.route('', methods=['POST'])
@jwt_required()
@role_required('admin')
def create_user():
    """ایجاد کاربر جدید"""
    try:
        data = request.get_json()
        
        # اعتبارسنجی
        if not data.get('username'):
            return jsonify({'success': False, 'message': 'نام کاربری الزامی است'}), 400
        if not data.get('password'):
            return jsonify({'success': False, 'message': 'رمز عبور الزامی است'}), 400
        if not data.get('email'):
            return jsonify({'success': False, 'message': 'ایمیل الزامی است'}), 400
        
        # بررسی تکراری نبودن
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'success': False, 'message': 'نام کاربری تکراری است'}), 400
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'success': False, 'message': 'ایمیل تکراری است'}), 400
        
        # ایجاد کاربر
        user = User(
            username=data['username'],
            email=data['email'],
            full_name=data.get('full_name', ''),
            national_code=data.get('national_code', ''),
            phone=data.get('phone', ''),
            role=data.get('role', 'subordinate'),
            personnel_code=data.get('personnel_code', ''),
            is_active=data.get('is_active', True),
            is_approved=data.get('is_approved', False),
            is_profile_complete=False
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'کاربر با موفقیت ایجاد شد',
            'data': {'id': user.id}
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# ==================== به‌روزرسانی کاربر ====================
@user_bp.route('/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    """به‌روزرسانی کاربر"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'success': False, 'message': 'کاربر یافت نشد'}), 404
        
        data = request.get_json()
        
        # بررسی دسترسی: فقط خود کاربر یا ادمین
        current_user_id = get_jwt_identity()
        if current_user_id != user_id:
            current_user = User.query.get(current_user_id)
            if not current_user or current_user.role != 'admin':
                return jsonify({'success': False, 'message': 'دسترسی غیرمجاز'}), 403
        
        # به‌روزرسانی فیلدها
        if 'full_name' in data:
            user.full_name = data['full_name']
        if 'phone' in data:
            user.phone = data['phone']
        if 'email' in data:
            user.email = data['email']
        if 'national_code' in data:
            # بررسی تکراری نبودن
            existing = User.query.filter(
                User.national_code == data['national_code'], 
                User.id != user_id
            ).first()
            if existing:
                return jsonify({'success': False, 'message': 'کد ملی تکراری است'}), 400
            user.national_code = data['national_code']
        if 'personnel_code' in data:
            user.personnel_code = data['personnel_code']
        if 'role' in data and current_user.role == 'admin':
            user.role = data['role']
        if 'is_active' in data and current_user.role == 'admin':
            user.is_active = data['is_active']
        if 'is_approved' in data and current_user.role == 'admin':
            user.is_approved = data['is_approved']
        if 'is_profile_complete' in data:
            user.is_profile_complete = data['is_profile_complete']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'کاربر با موفقیت به‌روزرسانی شد'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# ==================== تغییر رمز عبور ====================
@user_bp.route('/<int:user_id>/change-password', methods=['POST'])
@jwt_required()
def change_password(user_id):
    """تغییر رمز عبور کاربر"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'success': False, 'message': 'کاربر یافت نشد'}), 404
        
        data = request.get_json()
        
        # بررسی دسترسی
        current_user_id = get_jwt_identity()
        if current_user_id != user_id:
            current_user = User.query.get(current_user_id)
            if not current_user or current_user.role != 'admin':
                return jsonify({'success': False, 'message': 'دسترسی غیرمجاز'}), 403
        
        # اگر کاربر خودش در حال تغییر است، رمز قدیم را بررسی کن
        if current_user_id == user_id:
            if not data.get('old_password'):
                return jsonify({'success': False, 'message': 'رمز عبور فعلی الزامی است'}), 400
            if not user.check_password(data['old_password']):
                return jsonify({'success': False, 'message': 'رمز عبور فعلی اشتباه است'}), 400
        
        if not data.get('new_password'):
            return jsonify({'success': False, 'message': 'رمز عبور جدید الزامی است'}), 400
        
        user.set_password(data['new_password'])
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'رمز عبور با موفقیت تغییر کرد'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# ==================== تایید کاربر توسط ادمین ====================
@user_bp.route('/<int:user_id>/approve', methods=['POST'])
@jwt_required()
@role_required('admin')
def approve_user(user_id):
    """تایید کاربر توسط ادمین"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'success': False, 'message': 'کاربر یافت نشد'}), 404
        
        user.is_approved = True
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'کاربر با موفقیت تایید شد'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# ==================== کاربر فعلی ====================
@user_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """دریافت اطلاعات کاربر فعلی"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'success': False, 'message': 'کاربر یافت نشد'}), 404
        
        return jsonify({
            'success': True,
            'data': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': user.full_name,
                'national_code': getattr(user, 'national_code', ''),
                'phone': getattr(user, 'phone', ''),
                'role': getattr(user, 'role', 'subordinate'),
                'role_persian': _get_role_persian(getattr(user, 'role', 'subordinate')),
                'is_active': user.is_active,
                'is_approved': getattr(user, 'is_approved', True),
                'is_profile_complete': getattr(user, 'is_profile_complete', False),
                'personnel_code': getattr(user, 'personnel_code', ''),
                'avatar': getattr(user, 'avatar', ''),
                'created_at': user.created_at.isoformat() if user.created_at else None,
                'last_login': user.last_login.isoformat() if user.last_login else None,
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ==================== توابع کمکی ====================
def _get_role_persian(role):
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