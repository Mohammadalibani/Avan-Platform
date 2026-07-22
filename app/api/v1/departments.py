from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.api.v1 import api_v1_bp
from app.api.decorators import admin_required, org_manager_required
from app.models import Department, DepartmentManager, Unit, User
from app.extensions import db
from datetime import datetime

@api_v1_bp.route('/departments', methods=['GET'])
@jwt_required()
def get_departments():
    """
    دریافت لیست ادارات
    """
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 25, type=int)
    search = request.args.get('search', '').strip()
    
    query = Department.query.filter_by(is_active=True)
    
    if search:
        query = query.filter(Department.name.contains(search))
    
    pagination = query.order_by(Department.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    result = []
    for dept in pagination.items:
        # تعداد مدیران
        managers_count = DepartmentManager.query.filter_by(department_id=dept.id).count()
        # تعداد واحدها
        units_count = Unit.query.filter_by(department_id=dept.id, is_active=True).count()
        
        # دریافت نام مدیران
        managers = db.session.query(User).join(
            DepartmentManager, DepartmentManager.user_id == User.id
        ).filter(DepartmentManager.department_id == dept.id).all()
        managers_names = [m.get_full_name() for m in managers]
        
        result.append({
            'id': dept.id,
            'name': dept.name,
            'color': dept.color,
            'description': dept.description,
            'managers_count': managers_count,
            'units_count': units_count,
            'managers': managers_names,
            'created_at': dept.created_at.strftime('%Y/%m/%d') if dept.created_at else '',
            'is_active': dept.is_active
        })
    
    return jsonify({
        'departments': result,
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages
    }), 200


@api_v1_bp.route('/departments/<int:dept_id>', methods=['GET'])
@jwt_required()
def get_department(dept_id):
    """
    دریافت اطلاعات یک اداره
    """
    dept = Department.query.get_or_404(dept_id)
    
    # تعداد مدیران
    managers_count = DepartmentManager.query.filter_by(department_id=dept_id).count()
    units_count = Unit.query.filter_by(department_id=dept_id, is_active=True).count()
    
    # دریافت نام مدیران
    managers = db.session.query(User).join(
        DepartmentManager, DepartmentManager.user_id == User.id
    ).filter(DepartmentManager.department_id == dept_id).all()
    managers_names = [m.get_full_name() for m in managers]
    managers_ids = [m.id for m in managers]
    
    return jsonify({
        'id': dept.id,
        'name': dept.name,
        'color': dept.color,
        'description': dept.description,
        'managers_count': managers_count,
        'units_count': units_count,
        'managers': managers_names,
        'manager_ids': managers_ids,
        'created_at': dept.created_at.strftime('%Y/%m/%d') if dept.created_at else '',
        'is_active': dept.is_active
    }), 200


@api_v1_bp.route('/departments', methods=['POST'])
@jwt_required()
@admin_required
def create_department():
    """
    ایجاد اداره جدید (فقط ادمین)
    """
    data = request.get_json()
    
    name = data.get('name', '').strip()
    color = data.get('color', '#3498db')
    description = data.get('description', '').strip()
    manager_ids = data.get('manager_ids', [])
    
    if not name:
        return jsonify({'error': 'نام اداره الزامی است'}), 400
    
    if Department.query.filter_by(name=name).first():
        return jsonify({'error': 'این اداره قبلاً ثبت شده است'}), 400
    
    dept = Department(
        name=name,
        color=color,
        description=description,
        is_active=True
    )
    db.session.add(dept)
    db.session.flush()
    
    # اضافه کردن مدیران
    for user_id in manager_ids:
        dm = DepartmentManager(department_id=dept.id, user_id=user_id)
        db.session.add(dm)
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': f'اداره {name} با موفقیت ایجاد شد',
        'department_id': dept.id
    }), 201


@api_v1_bp.route('/departments/<int:dept_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_department(dept_id):
    """
    ویرایش اداره (فقط ادمین)
    """
    dept = Department.query.get_or_404(dept_id)
    data = request.get_json()
    
    if 'name' in data:
        name = data['name'].strip()
        if name and name != dept.name:
            if Department.query.filter_by(name=name).first():
                return jsonify({'error': 'این نام قبلاً ثبت شده است'}), 400
            dept.name = name
    
    if 'color' in data:
        dept.color = data['color']
    
    if 'description' in data:
        dept.description = data['description'].strip()
    
    if 'is_active' in data:
        dept.is_active = data['is_active']
    
    # به‌روزرسانی مدیران
    if 'manager_ids' in data:
        # حذف مدیران قبلی
        DepartmentManager.query.filter_by(department_id=dept_id).delete()
        
        # اضافه کردن مدیران جدید
        for user_id in data['manager_ids']:
            dm = DepartmentManager(department_id=dept_id, user_id=user_id)
            db.session.add(dm)
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'اطلاعات اداره با موفقیت به‌روزرسانی شد'
    }), 200


@api_v1_bp.route('/departments/<int:dept_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_department(dept_id):
    """
    حذف اداره (فقط ادمین)
    """
    dept = Department.query.get_or_404(dept_id)
    
    # بررسی وجود واحدهای وابسته
    units = Unit.query.filter_by(department_id=dept_id, is_active=True).count()
    if units > 0:
        return jsonify({'error': f'این اداره دارای {units} واحد فعال است. ابتدا واحدها را حذف کنید.'}), 400
    
    # حذف مدیران
    DepartmentManager.query.filter_by(department_id=dept_id).delete()
    
    dept.is_active = False
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'اداره با موفقیت غیرفعال شد'
    }), 200