from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.api.v1 import api_v1_bp
from app.api.decorators import admin_required, personnel_access_required
from app.models import (
    Personnel, Department, Unit, DynamicField, 
    PersonnelValue, WorkPeriod, User, DepartmentManager, UnitSupervisor
)
from app.extensions import db
from datetime import datetime
import jdatetime

# ============================================================
# توابع کمکی
# ============================================================

def get_personnel_with_values(personnel, include_period=False):
    """دریافت اطلاعات پرسنل همراه با مقادیر داینامیک"""
    department = Department.query.get(personnel.department_id)
    unit = Unit.query.get(personnel.unit_id)
    period = WorkPeriod.query.get(personnel.period_id) if personnel.period_id else None
    
    # دریافت فیلدهای داینامیک
    dynamic_fields = DynamicField.query.filter_by(is_active=True).all()
    
    values = {}
    for v in PersonnelValue.query.filter_by(personnel_id=personnel.id).all():
        field = DynamicField.query.get(v.field_id)
        if field:
            if v.value_text:
                values[field.title] = v.value_text
            elif v.value_number is not None:
                values[field.title] = v.value_number
            elif v.value_date:
                values[field.title] = v.value_date
    
    result = {
        'id': personnel.id,
        'national_code': personnel.national_code,
        'first_name': personnel.first_name or '',
        'last_name': personnel.last_name or '',
        'full_name': personnel.get_full_name(),
        'phone': personnel.phone or '',
        'position': personnel.position or '',
        'department_id': personnel.department_id,
        'department_name': department.name if department else '-',
        'unit_id': personnel.unit_id,
        'unit_name': unit.name if unit else '-',
        'hire_date': personnel.hire_date or '',
        'is_deleted': personnel.is_deleted,
        'created_at': personnel.created_at.strftime('%Y/%m/%d') if personnel.created_at else '',
        'updated_at': personnel.updated_at.strftime('%Y/%m/%d') if personnel.updated_at else '',
        'values': values
    }
    
    if include_period:
        result['period_id'] = personnel.period_id
        result['period_title'] = period.title if period else '-'
    
    return result


# ============================================================
# APIهای اصلی
# ============================================================

@api_v1_bp.route('/personnel', methods=['GET'])
@jwt_required()
def get_personnel_list():
    """
    دریافت لیست پرسنل با فیلترهای مختلف
    """
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 25, type=int)
    search = request.args.get('search', '').strip()
    department_id = request.args.get('department_id', type=int)
    unit_id = request.args.get('unit_id', type=int)
    period_id = request.args.get('period_id', type=int)
    include_deleted = request.args.get('include_deleted', 'false').lower() == 'true'
    
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    query = Personnel.query
    
    # محدودیت دسترسی بر اساس نقش
    if user.role == 'subordinate':
        # کاربر عادی فقط خودش را می‌بیند
        query = query.filter_by(national_code=user.national_code)
    elif user.role == 'unit_supervisor':
        # سرپرست واحد فقط پرسنل واحد خود را می‌بیند
        supervisor = UnitSupervisor.query.filter_by(user_id=current_user_id).first()
        if supervisor:
            query = query.filter_by(unit_id=supervisor.unit_id)
        else:
            return jsonify({'personnel': [], 'total': 0, 'pages': 0}), 200
    elif user.role == 'dept_manager':
        # مدیر اداره فقط پرسنل اداره خود را می‌بیند
        dept_manager = DepartmentManager.query.filter_by(user_id=current_user_id).first()
        if dept_manager:
            query = query.filter_by(department_id=dept_manager.department_id)
        else:
            return jsonify({'personnel': [], 'total': 0, 'pages': 0}), 200
    
    # فیلترهای جستجو
    if not include_deleted:
        query = query.filter_by(is_deleted=False)
    
    if search:
        query = query.filter(
            db.or_(
                Personnel.national_code.contains(search),
                Personnel.first_name.contains(search),
                Personnel.last_name.contains(search),
                Personnel.phone.contains(search)
            )
        )
    
    if department_id:
        query = query.filter_by(department_id=department_id)
    
    if unit_id:
        query = query.filter_by(unit_id=unit_id)
    
    if period_id:
        query = query.filter_by(period_id=period_id)
    
    pagination = query.order_by(Personnel.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    result = [get_personnel_with_values(p, include_period=True) for p in pagination.items]
    
    return jsonify({
        'personnel': result,
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages
    }), 200


@api_v1_bp.route('/personnel/<int:pid>', methods=['GET'])
@jwt_required()
@personnel_access_required
def get_personnel(pid):
    """
    دریافت اطلاعات یک پرسنل
    """
    p = Personnel.query.get_or_404(pid)
    return jsonify(get_personnel_with_values(p, include_period=True)), 200


@api_v1_bp.route('/personnel', methods=['POST'])
@jwt_required()
@admin_required
def create_personnel():
    """
    ایجاد پرسنل جدید (فقط ادمین)
    """
    data = request.get_json()
    
    national_code = data.get('national_code', '').strip()
    first_name = data.get('first_name', '').strip()
    last_name = data.get('last_name', '').strip()
    phone = data.get('phone', '').strip()
    position = data.get('position', '').strip()
    department_id = data.get('department_id')
    unit_id = data.get('unit_id')
    period_id = data.get('period_id')
    hire_date = data.get('hire_date', '').strip()
    dynamic_values = data.get('dynamic_values', {})
    
    # اعتبارسنجی
    if not national_code or not first_name or not last_name:
        return jsonify({'error': 'کد ملی، نام و نام خانوادگی الزامی است'}), 400
    
    if not national_code.isdigit() or len(national_code) != 10:
        return jsonify({'error': 'کد ملی باید 10 رقم باشد'}), 400
    
    if Personnel.query.filter_by(national_code=national_code, is_deleted=False).first():
        return jsonify({'error': 'این کد ملی قبلاً ثبت شده است'}), 400
    
    if department_id and not Department.query.get(department_id):
        return jsonify({'error': 'اداره یافت نشد'}), 404
    
    if unit_id and not Unit.query.get(unit_id):
        return jsonify({'error': 'واحد یافت نشد'}), 404
    
    # ایجاد پرسنل
    personnel = Personnel(
        national_code=national_code,
        first_name=first_name,
        last_name=last_name,
        phone=phone if phone else None,
        position=position if position else None,
        department_id=department_id,
        unit_id=unit_id,
        period_id=period_id,
        hire_date=hire_date if hire_date else None
    )
    
    db.session.add(personnel)
    db.session.flush()
    
    # ذخیره مقادیر داینامیک
    dynamic_fields = DynamicField.query.filter_by(is_active=True).all()
    for field in dynamic_fields:
        value = dynamic_values.get(str(field.id))
        if value and str(value).strip():
            pv = PersonnelValue(
                personnel_id=personnel.id,
                field_id=field.id,
                period_id=period_id,
                value_text=value if field.field_type == 'text' else None,
                value_number=float(value) if field.field_type in ['number', 'decimal'] and value else None,
                value_date=value if field.field_type == 'date' else None
            )
            db.session.add(pv)
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': f'پرسنل {first_name} {last_name} با موفقیت ایجاد شد',
        'personnel_id': personnel.id
    }), 201


@api_v1_bp.route('/personnel/<int:pid>', methods=['PUT'])
@jwt_required()
@personnel_access_required
def update_personnel(pid):
    """
    ویرایش پرسنل
    """
    p = Personnel.query.get_or_404(pid)
    data = request.get_json()
    
    # به‌روزرسانی فیلدهای اصلی
    if 'first_name' in data:
        p.first_name = data['first_name'].strip()
    if 'last_name' in data:
        p.last_name = data['last_name'].strip()
    if 'phone' in data:
        p.phone = data['phone'].strip()
    if 'position' in data:
        p.position = data['position'].strip()
    if 'department_id' in data:
        if not Department.query.get(data['department_id']):
            return jsonify({'error': 'اداره یافت نشد'}), 404
        p.department_id = data['department_id']
    if 'unit_id' in data:
        if not Unit.query.get(data['unit_id']):
            return jsonify({'error': 'واحد یافت نشد'}), 404
        p.unit_id = data['unit_id']
    if 'period_id' in data:
        p.period_id = data['period_id']
    if 'hire_date' in data:
        p.hire_date = data['hire_date'].strip()
    
    p.updated_at = datetime.now()
    
    db.session.commit()
    
    # به‌روزرسانی مقادیر داینامیک
    dynamic_values = data.get('dynamic_values', {})
    if dynamic_values:
        dynamic_fields = DynamicField.query.filter_by(is_active=True).all()
        for field in dynamic_fields:
            value = dynamic_values.get(str(field.id))
            if value is not None and str(value).strip():
                pv = PersonnelValue.query.filter_by(
                    personnel_id=pid,
                    field_id=field.id,
                    period_id=p.period_id
                ).first()
                
                if pv:
                    if field.field_type == 'text':
                        pv.value_text = str(value)
                    elif field.field_type in ['number', 'decimal']:
                        try:
                            pv.value_number = float(value)
                        except:
                            pv.value_text = str(value)
                    elif field.field_type == 'date':
                        pv.value_date = str(value)
                    pv.updated_at = datetime.now()
                else:
                    pv = PersonnelValue(
                        personnel_id=pid,
                        field_id=field.id,
                        period_id=p.period_id,
                        value_text=value if field.field_type == 'text' else None,
                        value_number=float(value) if field.field_type in ['number', 'decimal'] and value else None,
                        value_date=value if field.field_type == 'date' else None
                    )
                    db.session.add(pv)
            else:
                # اگر مقدار خالی است، مقدار قبلی را حذف کنیم
                PersonnelValue.query.filter_by(
                    personnel_id=pid,
                    field_id=field.id,
                    period_id=p.period_id
                ).delete()
        
        db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'اطلاعات پرسنل با موفقیت به‌روزرسانی شد'
    }), 200


@api_v1_bp.route('/personnel/<int:pid>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_personnel(pid):
    """
    حذف نرم پرسنل (فقط ادمین)
    """
    p = Personnel.query.get_or_404(pid)
    p.is_deleted = True
    p.updated_at = datetime.now()
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'پرسنل با موفقیت حذف شد'
    }), 200


@api_v1_bp.route('/personnel/<int:pid>/restore', methods=['POST'])
@jwt_required()
@admin_required
def restore_personnel(pid):
    """
    بازیابی پرسنل حذف شده (فقط ادمین)
    """
    p = Personnel.query.get_or_404(pid)
    p.is_deleted = False
    p.updated_at = datetime.now()
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'پرسنل با موفقیت بازیابی شد'
    }), 200


@api_v1_bp.route('/personnel/search', methods=['GET'])
@jwt_required()
def search_personnel():
    """
    جستجوی سریع پرسنل برای استفاده در dropdown‌ها
    """
    query = request.args.get('q', '').strip()
    limit = request.args.get('limit', 20, type=int)
    
    if not query or len(query) < 2:
        return jsonify({'results': []}), 200
    
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    base_query = Personnel.query.filter_by(is_deleted=False)
    
    # محدودیت دسترسی
    if user.role == 'unit_supervisor':
        supervisor = UnitSupervisor.query.filter_by(user_id=current_user_id).first()
        if supervisor:
            base_query = base_query.filter_by(unit_id=supervisor.unit_id)
    elif user.role == 'dept_manager':
        dept_manager = DepartmentManager.query.filter_by(user_id=current_user_id).first()
        if dept_manager:
            base_query = base_query.filter_by(department_id=dept_manager.department_id)
    
    results = base_query.filter(
        db.or_(
            Personnel.national_code.contains(query),
            Personnel.first_name.contains(query),
            Personnel.last_name.contains(query)
        )
    ).limit(limit).all()
    
    return jsonify({
        'results': [{
            'id': p.id,
            'national_code': p.national_code,
            'full_name': p.get_full_name(),
            'first_name': p.first_name,
            'last_name': p.last_name
        } for p in results]
    }), 200