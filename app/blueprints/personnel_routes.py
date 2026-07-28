# app/blueprints/personnel_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.personnel import Personnel
from app.models.personnel_value import PersonnelValue
from app.models.dynamic_field import DynamicField
from app.models.work_period import WorkPeriod
from app.models.department import Department
from app.models.unit import Unit
from app.decorators import role_required

personnel_bp = Blueprint('personnel', __name__, url_prefix='/api/personnel')


@personnel_bp.route('/fields', methods=['GET'])
@jwt_required()
def get_personnel_fields():
    """دریافت فیلدهای پویا برای فرم پرسنل"""
    try:
        fields = DynamicField.query.filter_by(is_active=True).order_by(DynamicField.field_order).all()
        result = []
        for f in fields:
            result.append({
                'id': f.id,
                'title': f.title,
                'field_type': f.field_type,
                'is_required': f.is_required,
                'is_key': f.is_key,
                'is_locked': f.is_locked,
            })
        return jsonify({'success': True, 'data': result}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@personnel_bp.route('/<int:personnel_id>/values', methods=['GET'])
@jwt_required()
def get_personnel_values(personnel_id):
    """دریافت مقادیر فیلدهای پویا برای یک پرسنل"""
    try:
        period_id = request.args.get('period_id')
        
        query = PersonnelValue.query.filter_by(personnel_id=personnel_id)
        if period_id:
            query = query.filter_by(period_id=period_id)
        
        values = query.all()
        result = {}
        for v in values:
            field = DynamicField.query.get(v.field_id)
            if field:
                if field.field_type == 'text':
                    result[str(field.id)] = v.value_text
                elif field.field_type == 'number':
                    result[str(field.id)] = v.value_number
                elif field.field_type == 'date':
                    result[str(field.id)] = v.value_date
                elif field.field_type == 'decimal':
                    result[str(field.id)] = v.value_number
        
        return jsonify({'success': True, 'data': result}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@personnel_bp.route('/<int:personnel_id>/values', methods=['POST'])
@jwt_required()
def save_personnel_values(personnel_id):
    """ذخیره مقادیر فیلدهای پویا برای یک پرسنل"""
    try:
        data = request.get_json()
        period_id = data.get('period_id')
        values = data.get('values', {})
        
        if not period_id:
            return jsonify({'success': False, 'message': 'دوره انتخاب نشده است'}), 400
        
        # بررسی وجود پرسنل
        personnel = Personnel.query.get(personnel_id)
        if not personnel:
            return jsonify({'success': False, 'message': 'پرسنل یافت نشد'}), 404
        
        # حذف مقادیر قبلی
        PersonnelValue.query.filter_by(
            personnel_id=personnel_id,
            period_id=period_id
        ).delete()
        
        # ذخیره مقادیر جدید
        for field_id, value in values.items():
            if value is None or value == '':
                continue
            
            field = DynamicField.query.get(int(field_id))
            if not field:
                continue
            
            pv = PersonnelValue(
                personnel_id=personnel_id,
                field_id=int(field_id),
                period_id=period_id
            )
            
            if field.field_type == 'text':
                pv.value_text = str(value)
            elif field.field_type == 'number':
                pv.value_number = float(value)
            elif field.field_type == 'date':
                pv.value_date = str(value)
            elif field.field_type == 'decimal':
                pv.value_number = float(value)
            
            db.session.add(pv)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'مقادیر با موفقیت ذخیره شد'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500