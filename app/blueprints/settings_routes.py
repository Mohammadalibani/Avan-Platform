# app/blueprints/settings_routes.py
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.decorators import role_required
from app.models.setting import Setting
from app.models.user import User
from app.models.notification import Notification
import os
import shutil
from datetime import datetime
from werkzeug.utils import secure_filename

settings_bp = Blueprint('settings', __name__, url_prefix='/api/settings')

# پوشه‌ها
UPLOAD_FOLDER = 'static/uploads'
AVATAR_FOLDER = os.path.join(UPLOAD_FOLDER, 'avatars')
LOGO_FOLDER = os.path.join(UPLOAD_FOLDER, 'logos')
BACKUP_FOLDER = 'backups'
os.makedirs(AVATAR_FOLDER, exist_ok=True)
os.makedirs(LOGO_FOLDER, exist_ok=True)
os.makedirs(BACKUP_FOLDER, exist_ok=True)


# ==================== تنظیمات ظاهر ====================
@settings_bp.route('/appearance', methods=['GET'])
@jwt_required()
def get_appearance():
    """دریافت تنظیمات ظاهر"""
    try:
        appearance = Setting.get('appearance', {
            'header_title': 'سامانه آوان',
            'header_color': '#1890ff',
            'header_text_color': '#ffffff',
            'logo': None,
        })
        return jsonify({'success': True, 'data': appearance}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@settings_bp.route('/appearance', methods=['PUT'])
@jwt_required()
@role_required('admin')
def update_appearance():
    """به‌روزرسانی تنظیمات ظاهر"""
    try:
        data = request.get_json()
        appearance = Setting.get('appearance', {})
        appearance.update(data)
        Setting.set('appearance', appearance)
        return jsonify({'success': True, 'message': 'تنظیمات ظاهر به‌روزرسانی شد'}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ==================== آپلود لوگو ====================
@settings_bp.route('/upload-logo', methods=['POST'])
@jwt_required()
@role_required('admin')
def upload_logo():
    """آپلود لوگو"""
    try:
        if 'logo' not in request.files:
            return jsonify({'success': False, 'message': 'فایل انتخاب نشده است'}), 400
        
        file = request.files['logo']
        if file.filename == '':
            return jsonify({'success': False, 'message': 'فایل انتخاب نشده است'}), 400
        
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'svg'}
        ext = file.filename.rsplit('.', 1)[1].lower()
        if ext not in allowed_extensions:
            return jsonify({'success': False, 'message': 'فرمت فایل مجاز نیست'}), 400
        
        # حذف لوگوی قبلی
        appearance = Setting.get('appearance', {})
        if appearance.get('logo'):
            old_logo = appearance['logo'].replace('/static/uploads/logos/', '')
            old_path = os.path.join(LOGO_FOLDER, old_logo)
            if os.path.exists(old_path):
                os.remove(old_path)
        
        filename = secure_filename(f"logo_{int(datetime.now().timestamp())}.{ext}")
        filepath = os.path.join(LOGO_FOLDER, filename)
        file.save(filepath)
        
        appearance['logo'] = f'/static/uploads/logos/{filename}'
        Setting.set('appearance', appearance)
        
        return jsonify({
            'success': True,
            'data': {'logo': f'/static/uploads/logos/{filename}'}
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ==================== تنظیمات شبکه ====================
@settings_bp.route('/network', methods=['GET'])
@jwt_required()
def get_network():
    """دریافت تنظیمات شبکه"""
    try:
        network = Setting.get('network', {
            'base_url': 'localhost',
            'port': 5000,
        })
        return jsonify({'success': True, 'data': network}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@settings_bp.route('/network', methods=['PUT'])
@jwt_required()
@role_required('admin')
def update_network():
    """به‌روزرسانی تنظیمات شبکه"""
    try:
        data = request.get_json()
        network = Setting.get('network', {})
        network.update(data)
        Setting.set('network', network)
        return jsonify({'success': True, 'message': 'تنظیمات شبکه به‌روزرسانی شد'}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ==================== مدیریت بکاپ ====================
@settings_bp.route('/backup', methods=['GET'])
@jwt_required()
@role_required('admin')
def get_backup():
    """دریافت لیست بکاپ‌ها"""
    try:
        backup = Setting.get('backup', {
            'auto_backup_time': '23:00',
        })
        
        # لیست فایل‌های بکاپ
        backup_files = []
        if os.path.exists(BACKUP_FOLDER):
            for f in os.listdir(BACKUP_FOLDER):
                if f.endswith('.db'):
                    file_path = os.path.join(BACKUP_FOLDER, f)
                    backup_files.append({
                        'filename': f,
                        'size': os.path.getsize(file_path),
                        'created_at': datetime.fromtimestamp(os.path.getctime(file_path)).isoformat(),
                    })
        
        backup['backups'] = sorted(backup_files, key=lambda x: x['created_at'], reverse=True)
        
        return jsonify({'success': True, 'data': backup}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@settings_bp.route('/backup', methods=['PUT'])
@jwt_required()
@role_required('admin')
def update_backup():
    """به‌روزرسانی تنظیمات بکاپ"""
    try:
        data = request.get_json()
        backup = Setting.get('backup', {})
        backup.update(data)
        Setting.set('backup', backup)
        return jsonify({'success': True, 'message': 'تنظیمات بکاپ به‌روزرسانی شد'}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@settings_bp.route('/backup/create', methods=['POST'])
@jwt_required()
@role_required('admin')
def create_backup():
    """ایجاد بکاپ دستی"""
    try:
        db_path = 'instance/avan_system.db'
        if not os.path.exists(db_path):
            return jsonify({'success': False, 'message': 'فایل دیتابیس یافت نشد'}), 404
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_name = f"avan_backup_{timestamp}.db"
        backup_path = os.path.join(BACKUP_FOLDER, backup_name)
        
        shutil.copy2(db_path, backup_path)
        
        return jsonify({
            'success': True,
            'message': 'بکاپ با موفقیت ایجاد شد',
            'data': {'filename': backup_name}
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@settings_bp.route('/backup/<filename>', methods=['GET'])
@jwt_required()
@role_required('admin')
def download_backup(filename):
    """دانلود فایل بکاپ"""
    try:
        file_path = os.path.join(BACKUP_FOLDER, filename)
        if not os.path.exists(file_path):
            return jsonify({'success': False, 'message': 'فایل یافت نشد'}), 404
        
        return send_file(
            file_path,
            as_attachment=True,
            download_name=filename,
            mimetype='application/octet-stream'
        )
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@settings_bp.route('/backup/<filename>', methods=['DELETE'])
@jwt_required()
@role_required('admin')
def delete_backup(filename):
    """حذف فایل بکاپ"""
    try:
        file_path = os.path.join(BACKUP_FOLDER, filename)
        if not os.path.exists(file_path):
            return jsonify({'success': False, 'message': 'فایل یافت نشد'}), 404
        
        os.remove(file_path)
        return jsonify({'success': True, 'message': 'بکاپ با موفقیت حذف شد'}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500