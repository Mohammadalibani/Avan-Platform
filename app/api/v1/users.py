from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.api.v1 import api_v1_bp
from app.api.decorators import admin_required
from app.models import User, Personnel, Department, Unit
from app.extensions import db
from werkzeug.security import generate_password_hash
from datetime import datetime
import re

@api_v1_bp.route('/users', methods=['GET'])
@jwt_required()
@admin_required
def get_users():
    """
    دریافت لیست کاربران (فقط ادمین)
    ---
    Query Parameters:
        page: int (پیش‌فرض 1)
        per_page: int (پیش‌فرض 25)
        search: str (جستجو در نام، کد ملی)
        role: str (فیلتر بر اساس نقش)
        status: str (active, inactive, pending)
    """
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 25, type=int)
    search = request.args.get('search', '').strip()
    role = request.args.get('role', '').strip()
    status = request.args.get('status', '').strip()
    
    query = User.query
    
    if search:
        query = query.filter(
            db.or_(
                User.national_code.contains(search),
                User.first_name.contains(search),
                User.last_name.contains(search),
                User.personnel_code.contains(search)
            )
        )
    
    if role:
        query = query.filter_by(role=role)
    
    if status == 'active':
        query = query.filter_by(is_active=True, is_approved=True)
    elif status == 'inactive':
        query = query.filter_by(is_active=False)
    elif status == 'pending':
        query = query.filter_by(is_approved=False, is_active=True)
    
    pagination = query.order_by(User.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    users = []
    for u in pagination.items:
        personnel = Personnel.query.filter_by(national_code=u.national_code, is_deleted=False).first()
        department_name = personnel.department.name if personnel and personnel.department else '-'
        unit_name = personnel.unit.name if personnel and personnel.unit else '-'
        
        users.append({
            'id': u.id,
            'national_code': u.national_code,
            'first_name': u.first_name,
            'last_name': u.last_name,
            'full_name': u.get_full_name(),
            'phone': u.phone or '',
            'role': u.role,
            'role_persian': u.get_role_persian(),
            'personnel_code': u.personnel_code or '',
            'is_active': u.is_active,
            'is_approved': u.is_approved,
            'department_name': department_name,
            'unit_name': unit_name,
            'created_at': u.get_jalali_created_date(),
            'last_login': u.last_login.strftime('%Y/%m/%d %H:%M') if u.last_login else None
        })
    
    return jsonify({
        'users': users,
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages
    }), 200


@api_v1_bp.route('/users/<int:user_id>', methods=['GET'])
@jwt_required()
@admin_required
def get_user(user_id):
    """
    دریافت اطلاعات یک کاربر (فقط ادمین)
    """
    user = User.query.get_or_404(user_id)
    personnel = Personnel.query.filter_by(national_code=user.national_code, is_deleted=False).first()
    
    return jsonify({
        'id': user.id,
        'national_code': user.national_code,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'full_name': user.get_full_name(),
        'phone': user.phone or '',
        'role': user.role,
        'role_persian': user.get_role_persian(),
        'personnel_code': user.personnel_code or '',
        'is_active': user.is_active,
        'is_approved': user.is_approved,
        'profile_picture': user.profile_picture,
        'department_name': personnel.department.name if personnel and personnel.department else '-',
        'unit_name': personnel.unit.name if personnel and personnel.unit else '-',
        'position': personnel.position if personnel else '-',
        'created_at': user.get_jalali_created_date(),
        'last_login': user.last_login.strftime('%Y/%m/%d %H:%M') if user.last_login else 'هرگز'
    }), 200


@api_v1_bp.route('/users', methods=['POST'])
@jwt_required()
@admin_required
def create_user():
    """
    ایجاد کاربر جدید (فقط ادمین)
    ---
    Request Body:
        national_code: str (10 رقم)
        first_name: str
        last_name: str
        phone: str (اختیاری)
        role: str (پیش‌فرض subordinate)
        password: str (اختیاری، در صورت نبود 4 رقم آخر کد ملی)
    """
    data = request.get_json()
    
    national_code = data.get('national_code', '').strip()
    first_name = data.get('first_name', '').strip()
    last_name = data.get('last_name', '').strip()
    phone = data.get('phone', '').strip()
    role = data.get('role', 'subordinate')
    password = data.get('password', '').strip()
    
    # اعتبارسنجی
    if not national_code or not first_name or not last_name:
        return jsonify({'error': 'کد ملی، نام و نام خانوادگی الزامی است'}), 400
    
    if not re.match(r'^\d{10}$', national_code):
        return jsonify({'error': 'کد ملی باید 10 رقم باشد'}), 400
    
    if User.query.filter_by(national_code=national_code).first():
        return jsonify({'error': 'این کد ملی قبلاً ثبت شده است'}), 400
    
    if not password:
        password = national_code[-4:]
    
    if len(password) < 4:
        return jsonify({'error': 'رمز عبور حداقل 4 کاراکتر باشد'}), 400
    
    # ایجاد کاربر
    user = User(
        national_code=national_code,
        username=national_code,
        first_name=first_name,
        last_name=last_name,
        phone=phone if phone else None,
        role=role,
        is_active=True,
        is_approved=True
    )
    user.set_password(password)
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': f'کاربر {first_name} {last_name} با موفقیت ایجاد شد',
        'user_id': user.id,
        'password': password  # فقط برای نمایش در پاسخ
    }), 201


@api_v1_bp.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_user(user_id):
    """
    ویرایش کاربر (فقط ادمین)
    """
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    
    if 'first_name' in data:
        user.first_name = data['first_name'].strip()
    if 'last_name' in data:
        user.last_name = data['last_name'].strip()
    if 'phone' in data:
        user.phone = data['phone'].strip()
    if 'role' in data:
        user.role = data['role']
    if 'is_active' in data:
        user.is_active = data['is_active']
    if 'is_approved' in data:
        user.is_approved = data['is_approved']
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'اطلاعات کاربر با موفقیت به‌روزرسانی شد'
    }), 200


@api_v1_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_user(user_id):
    """
    حذف کاربر (فقط ادمین)
    """
    user = User.query.get_or_404(user_id)
    
    if user.id == get_jwt_identity():
        return jsonify({'error': 'نمی‌توانید خود را حذف کنید'}), 400
    
    try:
        # حذف روابط
        DepartmentManager.query.filter_by(user_id=user_id).delete()
        UnitSupervisor.query.filter_by(user_id=user_id).delete()
        
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'کاربر با موفقیت حذف شد'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@api_v1_bp.route('/users/<int:user_id>/reset-password', methods=['POST'])
@jwt_required()
@admin_required
def reset_password(user_id):
    """
    ریست رمز عبور کاربر (فقط ادمین)
    """
    user = User.query.get_or_404(user_id)
    new_password = user.national_code[-4:]
    user.set_password(new_password)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': f'رمز عبور با موفقیت به {new_password} تغییر یافت',
        'new_password': new_password
    }), 200