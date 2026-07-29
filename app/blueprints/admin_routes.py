# app/blueprints/admin_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.decorators import role_required
from app.models.dynamic_field import DynamicField, PersonnelValue
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.decorators import role_required
from app.models.user import User
from app.models.unit import Unit
from app.models.department import Department
from app.models.department_manager import DepartmentManager
from app.models.unit_supervisor import UnitSupervisor

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

# app/blueprints/admin_routes.py - اضافه کنید

# ==================== پرسنل ====================
@admin_bp.route('/personnel', methods=['GET'])
@jwt_required()
def get_personnel():
    """دریافت لیست پرسنل"""
    try:
        # در حال حاضر فقط کاربران را برمی‌گردانیم
        users = User.query.all()
        result = []
        for u in users:
            result.append({
                'id': u.id,
                'username': u.username,
                'full_name': u.full_name,
                'personnel_code': u.personnel_code,
                'role': u.role,
                'is_active': u.is_active,
            })
        return jsonify({
            'success': True,
            'data': {
                'personnel': result,
                'total': len(result)
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ==================== دپارتمان‌ها ====================

@admin_bp.route('/departments', methods=['GET'])
@jwt_required()
def get_departments():
    """دریافت لیست دپارتمان‌ها"""
    try:
        departments = Department.query.filter_by(is_active=True).all()
        result = []
        for dept in departments:
            # دریافت مدیران
            managers = db.session.query(User).join(
                DepartmentManager, DepartmentManager.user_id == User.id
            ).filter(DepartmentManager.department_id == dept.id).all()
            
            result.append({
                'id': dept.id,
                'name': dept.name,
                'color': dept.color,
                'description': dept.description,
                'is_active': dept.is_active,
                'managers': [{'id': m.id, 'full_name': m.get_full_name()} for m in managers],
                'created_at': dept.created_at.isoformat() if dept.created_at else None,
            })
        return jsonify({'success': True, 'data': result}), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/departments/create', methods=['POST'])
@jwt_required()
@role_required('admin')
def create_department():
    """ایجاد دپارتمان جدید"""
    try:
        data = request.get_json()
        print("📥 دریافت داده برای ایجاد دپارتمان:", data)
        
        # اعتبارسنجی
        if not data.get('name'):
            return jsonify({'success': False, 'message': 'نام اداره الزامی است'}), 400
        
        # بررسی تکراری نبودن
        existing = Department.query.filter_by(name=data['name']).first()
        if existing:
            return jsonify({'success': False, 'message': 'این نام اداره قبلاً ثبت شده است'}), 400
        
        # ایجاد دپارتمان
        department = Department(
            name=data['name'],
            color=data.get('color', '#3498db'),
            description=data.get('description', ''),
            is_active=True
        )
        db.session.add(department)
        db.session.flush()  # برای گرفتن id
        
        # اضافه کردن مدیران
        manager_ids = data.get('manager_ids', [])
        for manager_id in manager_ids:
            # بررسی وجود کاربر
            user = User.query.get(manager_id)
            if user:
                dept_manager = DepartmentManager(
                    department_id=department.id,
                    user_id=manager_id
                )
                db.session.add(dept_manager)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'اداره با موفقیت ایجاد شد',
            'data': {'id': department.id}
        }), 201
        
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'خطا: {str(e)}'}), 500


@admin_bp.route('/departments/<int:dept_id>/edit', methods=['PUT'])
@jwt_required()
@role_required('admin')
def update_department(dept_id):
    """ویرایش دپارتمان"""
    try:
        department = Department.query.get_or_404(dept_id)
        data = request.get_json()
        
        # به‌روزرسانی اطلاعات
        if 'name' in data:
            # بررسی تکراری نبودن
            existing = Department.query.filter_by(name=data['name']).first()
            if existing and existing.id != dept_id:
                return jsonify({'success': False, 'message': 'این نام اداره قبلاً ثبت شده است'}), 400
            department.name = data['name']
        
        if 'color' in data:
            department.color = data['color']
        if 'description' in data:
            department.description = data['description']
        
        # به‌روزرسانی مدیران
        if 'manager_ids' in data:
            # حذف مدیران قبلی
            DepartmentManager.query.filter_by(department_id=dept_id).delete()
            
            # اضافه کردن مدیران جدید
            for manager_id in data['manager_ids']:
                user = User.query.get(manager_id)
                if user:
                    dept_manager = DepartmentManager(
                        department_id=dept_id,
                        user_id=manager_id
                    )
                    db.session.add(dept_manager)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'اداره با موفقیت ویرایش شد'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'خطا: {str(e)}'}), 500


@admin_bp.route('/departments/<int:dept_id>', methods=['DELETE'])
@jwt_required()
@role_required('admin')
def delete_department(dept_id):
    """حذف دپارتمان"""
    try:
        department = Department.query.get_or_404(dept_id)
        
        # حذف روابط مرتبط
        DepartmentManager.query.filter_by(department_id=dept_id).delete()
        
        # حذف واحدهای مرتبط
        units = Unit.query.filter_by(department_id=dept_id).all()
        for unit in units:
            UnitSupervisor.query.filter_by(unit_id=unit.id).delete()
            db.session.delete(unit)
        
        db.session.delete(department)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'اداره با موفقیت حذف شد'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'خطا: {str(e)}'}), 500


# app/blueprints/admin_routes.py

# ==================== واحدها ====================

@admin_bp.route('/units', methods=['GET'])
@jwt_required()
def get_units():
    """دریافت لیست واحدها"""
    try:
        from app.models.unit import Unit
        from app.models.user import User
        from app.models.unit_supervisor import UnitSupervisor
        
        units = Unit.query.filter_by(is_active=True).all()
        result = []
        for unit in units:
            # دریافت سرپرستان
            supervisors = db.session.query(User).join(
                UnitSupervisor, UnitSupervisor.user_id == User.id
            ).filter(UnitSupervisor.unit_id == unit.id).all()
            
            result.append({
                'id': unit.id,
                'name': unit.name,
                'department_id': unit.department_id,
                'description': unit.description,
                'needs_approval': unit.needs_approval,
                'is_active': unit.is_active,
                'supervisors': [{'id': u.id, 'full_name': u.get_full_name()} for u in supervisors],
                'created_at': unit.created_at.isoformat() if unit.created_at else None,
            })
        
        return jsonify({'success': True, 'data': result}), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/units/create', methods=['POST'])
@jwt_required()
@role_required('admin')
def create_unit():
    """ایجاد واحد جدید"""
    try:
        from app.models.unit import Unit
        from app.models.unit_supervisor import UnitSupervisor
        from app.models.user import User
        
        data = request.get_json()
        print("📥 دریافت داده برای ایجاد واحد:", data)
        
        # اعتبارسنجی
        if not data.get('name'):
            return jsonify({'success': False, 'message': 'نام واحد الزامی است'}), 400
        
        if not data.get('department_id'):
            return jsonify({'success': False, 'message': 'اداره الزامی است'}), 400
        
        # بررسی تکراری نبودن
        existing = Unit.query.filter_by(
            name=data['name'],
            department_id=data['department_id']
        ).first()
        if existing:
            return jsonify({'success': False, 'message': 'این نام واحد قبلاً در این اداره ثبت شده است'}), 400
        
        # ایجاد واحد
        unit = Unit(
            name=data['name'],
            department_id=data['department_id'],
            description=data.get('description', ''),
            needs_approval=data.get('needs_approval', True),
            is_active=True
        )
        db.session.add(unit)
        db.session.flush()
        
        # اضافه کردن سرپرستان
        for supervisor_id in data.get('supervisor_ids', []):
            user = User.query.get(supervisor_id)
            if user:
                supervisor = UnitSupervisor(
                    unit_id=unit.id,
                    user_id=supervisor_id
                )
                db.session.add(supervisor)
        
        db.session.commit()
        
        # دریافت سرپرستان برای پاسخ
        supervisors = db.session.query(User).join(
            UnitSupervisor, UnitSupervisor.user_id == User.id
        ).filter(UnitSupervisor.unit_id == unit.id).all()
        
        return jsonify({
            'success': True,
            'message': 'واحد با موفقیت ایجاد شد',
            'data': {
                'id': unit.id,
                'name': unit.name,
                'department_id': unit.department_id,
                'description': unit.description,
                'needs_approval': unit.needs_approval,
                'supervisors': [{'id': u.id, 'full_name': u.get_full_name()} for u in supervisors],
                'created_at': unit.created_at.isoformat() if unit.created_at else None,
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'خطا: {str(e)}'}), 500


@admin_bp.route('/units/<int:unit_id>/edit', methods=['PUT'])
@jwt_required()
@role_required('admin')
def update_unit(unit_id):
    """ویرایش واحد"""
    try:
        from app.models.unit import Unit
        from app.models.unit_supervisor import UnitSupervisor
        from app.models.user import User
        
        unit = Unit.query.get_or_404(unit_id)
        data = request.get_json()
        
        # به‌روزرسانی اطلاعات
        if 'name' in data:
            existing = Unit.query.filter_by(
                name=data['name'],
                department_id=data.get('department_id', unit.department_id)
            ).first()
            if existing and existing.id != unit_id:
                return jsonify({'success': False, 'message': 'این نام واحد قبلاً در این اداره ثبت شده است'}), 400
            unit.name = data['name']
        
        if 'department_id' in data:
            unit.department_id = data['department_id']
        if 'description' in data:
            unit.description = data['description']
        if 'needs_approval' in data:
            unit.needs_approval = data['needs_approval']
        
        # به‌روزرسانی سرپرستان
        if 'supervisor_ids' in data:
            UnitSupervisor.query.filter_by(unit_id=unit_id).delete()
            for supervisor_id in data['supervisor_ids']:
                user = User.query.get(supervisor_id)
                if user:
                    supervisor = UnitSupervisor(
                        unit_id=unit_id,
                        user_id=supervisor_id
                    )
                    db.session.add(supervisor)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'واحد با موفقیت ویرایش شد'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'خطا: {str(e)}'}), 500


@admin_bp.route('/units/<int:unit_id>', methods=['DELETE'])
@jwt_required()
@role_required('admin')
def delete_unit(unit_id):
    """حذف واحد"""
    try:
        from app.models.unit import Unit
        from app.models.unit_supervisor import UnitSupervisor
        from app.models.personnel import Personnel
        from app.models.personnel_value import PersonnelValue
        from app.models.personnel_work_status import PersonnelWorkStatus
        
        unit = Unit.query.get_or_404(unit_id)
        
        # حذف روابط مرتبط
        UnitSupervisor.query.filter_by(unit_id=unit_id).delete()
        
        # حذف پرسنل مرتبط
        personnel_list = Personnel.query.filter_by(unit_id=unit_id).all()
        for p in personnel_list:
            PersonnelValue.query.filter_by(personnel_id=p.id).delete()
            PersonnelWorkStatus.query.filter_by(personnel_id=p.id).delete()
            db.session.delete(p)
        
        db.session.delete(unit)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'واحد با موفقیت حذف شد'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'خطا: {str(e)}'}), 500


@admin_bp.route('/api/unit-detail/<int:unit_id>', methods=['GET'])
@jwt_required()
@role_required('admin')
def get_unit_detail(unit_id):
    """دریافت جزئیات واحد برای ویرایش"""
    try:
        from app.models.unit import Unit
        from app.models.user import User
        from app.models.unit_supervisor import UnitSupervisor
        
        unit = Unit.query.get_or_404(unit_id)
        
        # دریافت سرپرستان
        supervisors = db.session.query(User).join(
            UnitSupervisor, UnitSupervisor.user_id == User.id
        ).filter(UnitSupervisor.unit_id == unit_id).all()
        
        return jsonify({
            'id': unit.id,
            'name': unit.name,
            'department_id': unit.department_id,
            'description': unit.description,
            'needs_approval': unit.needs_approval,
            'supervisor_ids': [u.id for u in supervisors],
        }), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500
        
        

# ==================== دوره‌ها ====================

@admin_bp.route('/periods', methods=['GET'])
@jwt_required()
def get_periods():
    """دریافت لیست دوره‌ها"""
    try:
        from app.models.work_period import WorkPeriod
        periods = WorkPeriod.query.order_by(WorkPeriod.display_order).all()
        result = []
        for p in periods:
            result.append({
                'id': p.id,
                'title': p.title,
                'start_date': p.start_date,
                'end_date': p.end_date,
                'deadline': p.deadline or '',
                'display_order': p.display_order or 0,
                'is_active': p.is_active,
                'created_at': p.created_at.isoformat() if p.created_at else None,
            })
        return jsonify({'success': True, 'data': result}), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/periods/create', methods=['POST'])
@jwt_required()
@role_required('admin')
def create_period():
    """ایجاد دوره جدید"""
    try:
        from app.models.work_period import WorkPeriod
        data = request.get_json()
        
        if not data.get('title'):
            return jsonify({'success': False, 'message': 'عنوان دوره الزامی است'}), 400
        
        if not data.get('start_date'):
            return jsonify({'success': False, 'message': 'تاریخ شروع الزامی است'}), 400
        
        if not data.get('end_date'):
            return jsonify({'success': False, 'message': 'تاریخ پایان الزامی است'}), 400
        
        period = WorkPeriod(
            title=data['title'],
            start_date=data['start_date'],
            end_date=data['end_date'],
            deadline=data.get('deadline', ''),
            display_order=WorkPeriod.query.count(),
            is_active=data.get('is_active', False)
        )
        db.session.add(period)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'دوره با موفقیت ایجاد شد',
            'data': {'id': period.id}
        }), 201
        
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/periods/<int:period_id>/edit', methods=['PUT'])
@jwt_required()
@role_required('admin')
def update_period(period_id):
    """ویرایش دوره"""
    try:
        from app.models.work_period import WorkPeriod
        period = WorkPeriod.query.get_or_404(period_id)
        data = request.get_json()
        
        if 'title' in data:
            period.title = data['title']
        if 'start_date' in data:
            period.start_date = data['start_date']
        if 'end_date' in data:
            period.end_date = data['end_date']
        if 'deadline' in data:
            period.deadline = data['deadline']
        if 'is_active' in data:
            period.is_active = data['is_active']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'دوره با موفقیت ویرایش شد'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/periods/<int:period_id>/delete', methods=['DELETE'])
@jwt_required()
@role_required('admin')
def delete_period(period_id):
    """حذف دوره"""
    try:
        from app.models.work_period import WorkPeriod
        from app.models.personnel import Personnel
        from app.models.personnel_value import PersonnelValue
        from app.models.personnel_work_status import PersonnelWorkStatus
        
        period = WorkPeriod.query.get_or_404(period_id)
        
        # حذف پرسنل مرتبط
        personnel_list = Personnel.query.filter_by(period_id=period_id).all()
        for p in personnel_list:
            PersonnelValue.query.filter_by(personnel_id=p.id).delete()
            PersonnelWorkStatus.query.filter_by(personnel_id=p.id).delete()
            db.session.delete(p)
        
        db.session.delete(period)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'دوره با موفقیت حذف شد'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/periods/<int:period_id>/set-active', methods=['POST'])
@jwt_required()
@role_required('admin')
def set_active_period(period_id):
    """تنظیم دوره به عنوان دوره فعال"""
    try:
        from app.models.work_period import WorkPeriod
        
        # غیرفعال کردن همه دوره‌ها
        WorkPeriod.query.update({WorkPeriod.is_active: False})
        
        # فعال کردن دوره انتخاب شده
        period = WorkPeriod.query.get_or_404(period_id)
        period.is_active = True
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'دوره {period.title} به عنوان دوره فعال انتخاب شد'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500


# app/blueprints/admin_routes.py

@admin_bp.route('/periods/update-order', methods=['POST'])
@jwt_required()
@role_required('admin')
def update_periods_order():
    """به‌روزرسانی ترتیب دوره‌ها"""
    try:
        from app.models.work_period import WorkPeriod
        data = request.get_json()
        orders = data.get('orders', [])
        
        for item in orders:
            period = WorkPeriod.query.get(item['id'])
            if period:
                period.display_order = item['display_order']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'ترتیب دوره‌ها با موفقیت ذخیره شد'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500