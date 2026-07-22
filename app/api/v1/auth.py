from flask import request, jsonify
from flask_jwt_extended import (
    create_access_token, 
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    set_access_cookies,
    set_refresh_cookies,
    unset_jwt_cookies
)
from app.api.v1 import api_v1_bp
from app.models import User
from app.extensions import db
from datetime import datetime, timedelta
import re

@api_v1_bp.route('/auth/login', methods=['POST'])
def login():
    """
    ورود کاربر و دریافت JWT Token
    ---
    Request Body:
        username: str (کد ملی)
        password: str (رمز عبور)
    Response:
        access_token: str
        refresh_token: str
        user: dict
    """
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'داده ارسال نشده است'}), 400
    
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    
    if not username or not password:
        return jsonify({'error': 'کد ملی و رمز عبور الزامی است'}), 400
    
    # پیدا کردن کاربر
    user = User.query.filter_by(username=username).first()
    
    if not user:
        return jsonify({'error': 'کد ملی یا رمز عبور اشتباه است'}), 401
    
    if not user.check_password(password):
        return jsonify({'error': 'کد ملی یا رمز عبور اشتباه است'}), 401
    
    if not user.is_active:
        return jsonify({'error': 'حساب کاربری شما غیرفعال است'}), 403
    
    if not user.is_approved:
        return jsonify({'error': 'حساب کاربری شما هنوز تأیید نشده است'}), 403
    
    # به‌روزرسانی آخرین ورود
    user.last_login = datetime.now()
    db.session.commit()
    
    # ایجاد توکن‌ها
    access_token = create_access_token(
        identity=user.id,
        expires_delta=timedelta(hours=24)
    )
    refresh_token = create_refresh_token(
        identity=user.id,
        expires_delta=timedelta(days=30)
    )
    
    return jsonify({
        'success': True,
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': {
            'id': user.id,
            'national_code': user.national_code,
            'full_name': user.get_full_name(),
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'role_persian': user.get_role_persian(),
            'phone': user.phone or '',
            'is_active': user.is_active,
            'is_approved': user.is_approved,
            'profile_picture': user.profile_picture
        }
    }), 200


@api_v1_bp.route('/auth/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """
    دریافت توکن جدید با استفاده از Refresh Token
    """
    current_user_id = get_jwt_identity()
    new_access_token = create_access_token(
        identity=current_user_id,
        expires_delta=timedelta(hours=24)
    )
    
    return jsonify({
        'access_token': new_access_token
    }), 200


@api_v1_bp.route('/auth/logout', methods=['POST'])
@jwt_required()
def logout():
    """
    خروج از سیستم (سمت کلاینت باید توکن را حذف کند)
    """
    return jsonify({
        'success': True,
        'message': 'با موفقیت خارج شدید'
    }), 200


@api_v1_bp.route('/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """
    دریافت اطلاعات کاربر جاری
    """
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'error': 'کاربر یافت نشد'}), 404
    
    return jsonify({
        'id': user.id,
        'national_code': user.national_code,
        'full_name': user.get_full_name(),
        'first_name': user.first_name,
        'last_name': user.last_name,
        'role': user.role,
        'role_persian': user.get_role_persian(),
        'phone': user.phone or '',
        'personnel_code': user.personnel_code or '',
        'is_active': user.is_active,
        'is_approved': user.is_approved,
        'profile_picture': user.profile_picture,
        'created_at': user.get_jalali_created_date(),
        'last_login': user.last_login.strftime('%Y/%m/%d %H:%M') if user.last_login else None
    }), 200