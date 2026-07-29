# app/blueprints/profile_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.user import User
import os
from datetime import datetime
from werkzeug.utils import secure_filename

profile_bp = Blueprint('profile', __name__, url_prefix='/api/profile')

UPLOAD_FOLDER = 'static/uploads'
AVATAR_FOLDER = os.path.join(UPLOAD_FOLDER, 'avatars')
os.makedirs(AVATAR_FOLDER, exist_ok=True)


@profile_bp.route('/avatar', methods=['POST'])
@jwt_required()
def upload_avatar():
    """آپلود عکس پروفایل"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'success': False, 'message': 'کاربر یافت نشد'}), 404
        
        if 'avatar' not in request.files:
            return jsonify({'success': False, 'message': 'فایل انتخاب نشده است'}), 400
        
        file = request.files['avatar']
        if file.filename == '':
            return jsonify({'success': False, 'message': 'فایل انتخاب نشده است'}), 400
        
        # اعتبارسنجی
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
        ext = file.filename.rsplit('.', 1)[1].lower()
        if ext not in allowed_extensions:
            return jsonify({'success': False, 'message': 'فرمت فایل مجاز نیست'}), 400
        
        # بررسی حجم (۵ مگابایت)
        file.seek(0, 2)
        file_size = file.tell()
        file.seek(0)
        if file_size > 5 * 1024 * 1024:
            return jsonify({'success': False, 'message': 'حجم فایل باید کمتر از ۵ مگابایت باشد'}), 400
        
        # حذف عکس قبلی اگر وجود دارد
        if user.avatar:
            old_path = user.avatar.replace('/static/', '')
            old_full_path = os.path.join(os.getcwd(), old_path)
            if os.path.exists(old_full_path):
                os.remove(old_full_path)
        
        # ذخیره عکس جدید با کد ملی
        filename = f"{user.national_code}_{int(datetime.now().timestamp())}.{ext}"
        filepath = os.path.join(AVATAR_FOLDER, filename)
        file.save(filepath)
        
        # به‌روزرسانی در دیتابیس
        user.avatar = f'/static/uploads/avatars/{filename}'
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {'avatar': user.avatar}
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@profile_bp.route('/avatar', methods=['DELETE'])
@jwt_required()
def delete_avatar():
    """حذف عکس پروفایل"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'success': False, 'message': 'کاربر یافت نشد'}), 404
        
        if user.avatar:
            old_path = user.avatar.replace('/static/', '')
            old_full_path = os.path.join(os.getcwd(), old_path)
            if os.path.exists(old_full_path):
                os.remove(old_full_path)
            user.avatar = None
            db.session.commit()
        
        return jsonify({'success': True, 'message': 'عکس پروفایل حذف شد'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

# app/blueprints/profile_routes.py
@profile_bp.route('/complete', methods=['POST'])
@jwt_required()
def complete_profile():
    """تکمیل اطلاعات پروفایل توسط کاربر"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'success': False, 'message': 'کاربر یافت نشد'}), 404
        
        data = request.get_json()
        
        # به‌روزرسانی اطلاعات
        if 'full_name' in data:
            user.full_name = data['full_name']
        if 'phone' in data:
            user.phone = data['phone']
        if 'national_code' in data:
            user.national_code = data['national_code']
        if 'personnel_code' in data:
            user.personnel_code = data['personnel_code']
        
        # علامت‌گذاری به عنوان تکمیل شده
        user.is_profile_complete = True
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'اطلاعات با موفقیت تکمیل شد',
            'data': {
                'id': user.id,
                'full_name': user.full_name,
                'phone': user.phone,
                'national_code': user.national_code,
                'personnel_code': user.personnel_code,
                'is_profile_complete': user.is_profile_complete
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500