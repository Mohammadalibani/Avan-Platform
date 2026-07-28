# app/blueprints/admin_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.decorators import role_required

# فقط از مدل User استفاده می‌کنیم
from app.models.user import User

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')


# ==================== کاربران ====================
@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    """دریافت لیست کاربران"""
    try:
        # دریافت همه کاربران
        users = User.query.all()
        
        result = []
        for u in users:
            result.append({
                'id': u.id,
                'username': u.username,
                'email': u.email,
                'full_name': u.full_name,
                'role': getattr(u, 'role', 'subordinate'),
                'is_active': u.is_active,
                'created_at': u.created_at.isoformat() if u.created_at else None,
            })
        
        return jsonify({
            'success': True,
            'data': {
                'users': result,
                'total': len(result)
            }
        }), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    """دریافت آمار"""
    try:
        return jsonify({
            'success': True,
            'data': {
                'total_users': User.query.count(),
                'total_personnel': 0,
                'total_departments': 0,
                'total_units': 0,
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# app/blueprints/admin_routes.py
@admin_bp.route('/users/<int:user_id>/approve', methods=['POST'])
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

# ==================== فیلدهای پویا ====================

@admin_bp.route('/fields', methods=['GET'])
@jwt_required()
@role_required('admin')
def get_fields():
    """دریافت لیست فیلدهای پویا"""
    try:
        fields = DynamicField.query.order_by(DynamicField.field_order).all()
        result = []
        for f in fields:
            result.append({
                'id': f.id,
                'title': f.title,
                'field_type': f.field_type,
                'is_required': f.is_required,
                'is_locked': f.is_locked,
                'is_monitoring': f.is_monitoring,
                'is_key': f.is_key,
                'field_order': f.field_order,
                'is_active': f.is_active,
                'created_at': f.created_at.isoformat() if f.created_at else None,
            })
        return jsonify({'success': True, 'data': result}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/fields', methods=['POST'])
@jwt_required()
@role_required('admin')
def create_field():
    """ایجاد فیلد جدید"""
    try:
        data = request.get_json()
        
        if not data.get('title'):
            return jsonify({'success': False, 'message': 'عنوان فیلد الزامی است'}), 400
        
        field = DynamicField(
            title=data['title'],
            field_type=data.get('field_type', 'text'),
            is_required=data.get('is_required', False),
            is_locked=data.get('is_locked', False),
            is_monitoring=data.get('is_monitoring', False),
            is_key=data.get('is_key', False),
            is_active=data.get('is_active', True),
            field_order=DynamicField.query.count() + 1
        )
        db.session.add(field)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'فیلد با موفقیت ایجاد شد',
            'data': {'id': field.id}
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/fields/<int:field_id>', methods=['PUT'])
@jwt_required()
@role_required('admin')
def update_field(field_id):
    """به‌روزرسانی فیلد"""
    try:
        field = DynamicField.query.get(field_id)
        if not field:
            return jsonify({'success': False, 'message': 'فیلد یافت نشد'}), 404
        
        data = request.get_json()
        
        if 'title' in data:
            field.title = data['title']
        if 'field_type' in data:
            field.field_type = data['field_type']
        if 'is_required' in data:
            field.is_required = data['is_required']
        if 'is_locked' in data:
            field.is_locked = data['is_locked']
        if 'is_monitoring' in data:
            field.is_monitoring = data['is_monitoring']
        if 'is_key' in data:
            field.is_key = data['is_key']
        if 'is_active' in data:
            field.is_active = data['is_active']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'فیلد با موفقیت به‌روزرسانی شد'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/fields/<int:field_id>', methods=['DELETE'])
@jwt_required()
@role_required('admin')
def delete_field(field_id):
    """حذف فیلد"""
    try:
        field = DynamicField.query.get(field_id)
        if not field:
            return jsonify({'success': False, 'message': 'فیلد یافت نشد'}), 404
        
        # بررسی اینکه فیلد در حال استفاده نیست
        if PersonnelValue.query.filter_by(field_id=field_id).first():
            return jsonify({
                'success': False,
                'message': 'این فیلد در حال استفاده است و قابل حذف نیست'
            }), 400
        
        db.session.delete(field)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'فیلد با موفقیت حذف شد'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/fields/reorder', methods=['POST'])
@jwt_required()
@role_required('admin')
def reorder_fields():
    """تغییر ترتیب فیلدها"""
    try:
        data = request.get_json()
        field_ids = data.get('field_ids', [])
        
        for index, field_id in enumerate(field_ids):
            field = DynamicField.query.get(field_id)
            if field:
                field.field_order = index + 1
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'ترتیب فیلدها با موفقیت تغییر کرد'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500