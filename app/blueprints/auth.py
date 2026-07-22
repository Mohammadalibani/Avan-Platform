# app/blueprints/auth.py
from flask import Blueprint, render_template, redirect, url_for, request, flash, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from flask_jwt_extended import create_access_token, create_refresh_token
from app.models import User
from app.extensions import db

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

# ========== صفحه لاگین (HTML) ==========
@auth_bp.route('/login', methods=['GET'])
def login_page():
    return render_template('login.html')

# ========== API لاگین (JSON) ==========
@auth_bp.route('/login', methods=['POST'])
def login():
    """API لاگین برای فرانت‌اند React"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'داده ارسال نشده است'}), 400
    
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    
    if not username or not password:
        return jsonify({'error': 'کد ملی و رمز عبور الزامی است'}), 400
    
    # پیدا کردن کاربر
    user = User.query.filter_by(username=username).first()
    
    # بررسی کاربر و رمز عبور
    if not user or not user.check_password(password):
        return jsonify({'error': 'کد ملی یا رمز عبور اشتباه است'}), 401
    
    if not user.is_active or not user.is_approved:
        return jsonify({'error': 'حساب کاربری شما فعال نیست'}), 403
    
    # تولید توکن JWT
    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)
    
    # بروزرسانی آخرین لاگین
    user.last_login = db.func.now()
    db.session.commit()
    
    return jsonify({
        'success': True,
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': {
            'id': user.id,
            'national_code': user.national_code,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'full_name': user.get_full_name(),
            'role': user.role,
            'role_persian': user.get_role_persian(),
            'phone': user.phone or '',
            'is_active': user.is_active,
            'is_approved': user.is_approved,
            'profile_picture': user.profile_picture
        }
    }), 200