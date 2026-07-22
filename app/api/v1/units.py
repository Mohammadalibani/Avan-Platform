from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.api.v1 import api_v1_bp
from app.api.decorators import admin_required
from app.models import Unit, Department, UnitSupervisor, User
from app.extensions import db

@api_v1_bp.route('/units', methods=['GET'])
@jwt_required()
def get_units():
    """
    دریافت لیست واحدها
    """
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 25, type=int)
    department_id = request.args.get('department_id', type=int)
    search = request.args.get('search', '').strip()
    
    query = Unit.query.filter_by(is_active=True)
    
    if department_id:
        query = query.filter_by(department_id=department_id)
    
    if search:
        query = query.filter(Unit.name.contains(search))
    
    pagination = query.order_by(Unit.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    result = []
    for unit in pagination.items:
        dept = Department.query.get(unit.department_id)
        supervisors_count = UnitSupervisor.query.filter_by(unit_id=unit.id).count()
        
        # دریافت نام سرپرستان
        supervisors = db.session.query(User).join(
            UnitSupervisor, UnitSupervisor.user_id == User.id
        ).filter(UnitSupervisor.unit_id == unit.id).all()
        supervisors_names = [s.get_full_name() for s in supervisors]
        supervisors_ids = [s.id for s in supervisors]
        
        result.append({
            'id': unit.id,
            'name': unit.name,
            'department_id': unit.department_id,
            'department_name': dept.name if dept else '-',
            'description': unit.description,
            'supervisors_count': supervisors_count,
            'supervisors': supervisors_names,
            'supervisor_ids': supervisors_ids,
            'needs_approval': unit.needs_approval,
            'created_at': unit.created_at.strftime('%Y/%m/%d') if unit.created_at else '',
            'is_active': unit.is_active
        })
    
    return jsonify({
        'units': result,
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages
    }), 200


@api_v1_bp.route('/units/<int:unit_id>', methods=['GET'])
@jwt_required()
def get_unit(unit_id):
    """
    دریافت اطلاعات یک واحد
    """
    unit = Unit.query.get_or_404(unit_id)
    dept = Department.query.get(unit.department_id)
    
    supervisors = db.session.query(User).join(
        UnitSupervisor, UnitSupervisor.user_id == User.id
    ).filter(UnitSupervisor.unit_id == unit_id).all()
    supervisors_names = [s.get_full_name() for s in supervisors]
    supervisors_ids = [s.id for s in supervisors]
    
    return jsonify({
        'id': unit.id,
        'name': unit.name,
        'department_id': unit.department_id,
        'department_name': dept.name if dept else '-',
        'description': unit.description,
        'supervisors': supervisors_names,
        'supervisor_ids': supervisors_ids,
        'needs_approval': unit.needs_approval,
        'created_at': unit.created_at.strftime('%Y/%m/%d') if unit.created_at else '',
        'is_active': unit.is_active
    }), 200


@api_v1_bp.route('/units', methods=['POST'])
@jwt_required()
@admin_required
def create_unit():
    """
    ایجاد واحد جدید (فقط ادمین)
    """
    data = request.get_json()
    
    name = data.get('name', '').strip()
    department_id = data.get('department_id')
    description = data.get('description', '').strip()
    supervisor_ids = data.get('supervisor_ids', [])
    needs_approval = data.get('needs_approval', True)
    
    if not name:
        return jsonify({'error': 'نام واحد الزامی است'}), 400
    
    if not department_id:
        return jsonify({'error': 'اداره الزامی است'}), 400
    
    if not Department.query.get(department_id):
        return jsonify({'error': 'اداره یافت نشد'}), 404
    
    unit = Unit(
        name=name,
        department_id=department_id,
        description=description,
        needs_approval=needs_approval,
        is_active=True
    )
    db.session.add(unit)
    db.session.flush()
    
    # اضافه کردن سرپرستان
    for user_id in supervisor_ids:
        us = UnitSupervisor(unit_id=unit.id, user_id=user_id)
        db.session.add(us)
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': f'واحد {name} با موفقیت ایجاد شد',
        'unit_id': unit.id
    }), 201


@api_v1_bp.route('/units/<int:unit_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_unit(unit_id):
    """
    ویرایش واحد (فقط ادمین)
    """
    unit = Unit.query.get_or_404(unit_id)
    data = request.get_json()
    
    if 'name' in data:
        unit.name = data['name'].strip()
    
    if 'department_id' in data:
        if not Department.query.get(data['department_id']):
            return jsonify({'error': 'اداره یافت نشد'}), 404
        unit.department_id = data['department_id']
    
    if 'description' in data:
        unit.description = data['description'].strip()
    
    if 'needs_approval' in data:
        unit.needs_approval = data['needs_approval']
    
    if 'is_active' in data:
        unit.is_active = data['is_active']
    
    # به‌روزرسانی سرپرستان
    if 'supervisor_ids' in data:
        UnitSupervisor.query.filter_by(unit_id=unit_id).delete()
        for user_id in data['supervisor_ids']:
            us = UnitSupervisor(unit_id=unit_id, user_id=user_id)
            db.session.add(us)
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'اطلاعات واحد با موفقیت به‌روزرسانی شد'
    }), 200


@api_v1_bp.route('/units/<int:unit_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_unit(unit_id):
    """
    حذف واحد (فقط ادمین)
    """
    unit = Unit.query.get_or_404(unit_id)
    
    # حذف سرپرستان
    UnitSupervisor.query.filter_by(unit_id=unit_id).delete()
    
    unit.is_active = False
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'واحد با موفقیت غیرفعال شد'
    }), 200
    
@api_v1_bp.route('/units-all', methods=['GET'])
@jwt_required()
def get_all_units():
    units = Unit.query.filter_by(is_active=True).all()
    return jsonify([{
        'id': u.id,
        'name': u.name,
        'department_id': u.department_id
    } for u in units])