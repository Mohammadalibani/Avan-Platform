# app/blueprints/admin.py
from flask import Blueprint, render_template, jsonify, request, flash, redirect, url_for, current_app
from flask_login import login_required, current_user
from sqlalchemy import func, or_
from datetime import datetime, timedelta

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')


# ============================================
# صفحات مدیریت (Pages)
# ============================================

@admin_bp.route('/dashboard')
@login_required
def dashboard():
    if current_user.role != 'admin':
        flash('دسترسی غیرمجاز', 'error')
        return redirect(url_for('main.dashboard'))
    return render_template('admin/dashboard.html')


@admin_bp.route('/users')
@login_required
def users():
    if current_user.role != 'admin':
        flash('دسترسی غیرمجاز', 'error')
        return redirect(url_for('main.dashboard'))
    return render_template('admin/users.html')


@admin_bp.route('/departments')
@login_required
def departments():
    if current_user.role != 'admin':
        flash('دسترسی غیرمجاز', 'error')
        return redirect(url_for('main.dashboard'))
    return render_template('admin/departments.html')


@admin_bp.route('/units')
@login_required
def units():
    if current_user.role != 'admin':
        flash('دسترسی غیرمجاز', 'error')
        return redirect(url_for('main.dashboard'))
    return render_template('admin/units.html')


@admin_bp.route('/personnel')
@login_required
def personnel():
    if current_user.role != 'admin':
        flash('دسترسی غیرمجاز', 'error')
        return redirect(url_for('main.dashboard'))
    return render_template('admin/personnel.html')


@admin_bp.route('/fields')
@login_required
def fields():
    if current_user.role != 'admin':
        flash('دسترسی غیرمجاز', 'error')
        return redirect(url_for('main.dashboard'))
    return render_template('admin/fields.html')


@admin_bp.route('/periods')
@login_required
def periods():
    if current_user.role != 'admin':
        flash('دسترسی غیرمجاز', 'error')
        return redirect(url_for('main.dashboard'))
    return render_template('admin/periods.html')


@admin_bp.route('/settings')
@login_required
def settings():
    if current_user.role != 'admin':
        flash('دسترسی غیرمجاز', 'error')
        return redirect(url_for('main.dashboard'))
    return render_template('admin/settings.html')


@admin_bp.route('/approvals')
@login_required
def approvals():
    if current_user.role != 'admin':
        flash('دسترسی غیرمجاز', 'error')
        return redirect(url_for('main.dashboard'))
    return render_template('admin/approvals.html')


# ============================================
# APIهای مدیریت (Admin APIs) - برای فرانت‌اند
# ============================================

@admin_bp.route('/api/units-all')
@login_required
def api_units_all():
    """دریافت همه واحدها"""
    if current_user.role != 'admin':
        return jsonify({'error': 'دسترسی غیرمجاز'}), 403
    
    try:
        from app.models import Unit
        
        units = Unit.query.filter_by(is_active=True).all()
        result = []
        for u in units:
            result.append({
                'id': u.id,
                'name': u.name,
                'department_id': u.department_id
            })
        
        return jsonify(result)
        
    except Exception as e:
        current_app.logger.error(f"Error in api_units_all: {e}")
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/api/users-advanced')
@login_required
def api_users_advanced():
    """دریافت لیست کاربران با فیلتر"""
    if current_user.role != 'admin':
        return jsonify({'error': 'دسترسی غیرمجاز'}), 403
    
    try:
        from app.models import User
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 25, type=int)
        search = request.args.get('search', '')
        role = request.args.get('role', '')
        dept_id = request.args.get('dept_id', type=int)
        unit_id = request.args.get('unit_id', type=int)
        
        query = User.query
        
        if search:
            query = query.filter(
                or_(
                    User.national_code.contains(search),
                    User.first_name.contains(search),
                    User.last_name.contains(search),
                    User.personnel_code.contains(search)
                )
            )
        
        if role:
            query = query.filter_by(role=role)
        
        pagination = query.order_by(User.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
        
        users = []
        for u in pagination.items:
            users.append({
                'id': u.id,
                'national_code': u.national_code,
                'first_name': u.first_name,
                'last_name': u.last_name,
                'full_name': u.get_full_name(),
                'phone': u.phone or '',
                'role': u.role,
                'role_persian': u.get_role_persian(),
                'is_active': u.is_active,
                'is_approved': u.is_approved,
                'personnel_code': u.personnel_code,
                'created_at': u.get_jalali_created_date(),
                'last_login': u.last_login.strftime('%Y/%m/%d %H:%M') if u.last_login else None
            })
        
        return jsonify({
            'users': users,
            'total': pagination.total,
            'page': page,
            'per_page': per_page,
            'pages': pagination.pages
        })
        
    except Exception as e:
        current_app.logger.error(f"Error in api_users_advanced: {e}")
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/api/departments')
@login_required
def api_departments():
    """دریافت لیست دپارتمان‌ها"""
    if current_user.role != 'admin':
        return jsonify({'error': 'دسترسی غیرمجاز'}), 403
    
    try:
        from app.models import Department
        
        departments = Department.query.filter_by(is_active=True).all()
        result = []
        for d in departments:
            result.append({
                'id': d.id,
                'name': d.name,
                'color': d.color,
                'description': d.description,
                'created_at': d.created_at.strftime('%Y/%m/%d') if d.created_at else ''
            })
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/api/units')
@login_required
def api_units():
    """دریافت لیست واحدها (با فیلتر دپارتمان)"""
    if current_user.role != 'admin':
        return jsonify({'error': 'دسترسی غیرمجاز'}), 403
    
    try:
        from app.models import Unit
        
        dept_id = request.args.get('department_id', type=int)
        
        query = Unit.query.filter_by(is_active=True)
        if dept_id:
            query = query.filter_by(department_id=dept_id)
        
        units = query.all()
        result = []
        for u in units:
            result.append({
                'id': u.id,
                'name': u.name,
                'department_id': u.department_id
            })
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/api/personnel')
@login_required
def api_personnel():
    """دریافت لیست پرسنل"""
    if current_user.role != 'admin':
        return jsonify({'error': 'دسترسی غیرمجاز'}), 403
    
    try:
        from app.models import Personnel
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 25, type=int)
        search = request.args.get('search', '')
        dept_id = request.args.get('department_id', type=int)
        unit_id = request.args.get('unit_id', type=int)
        
        query = Personnel.query.filter_by(is_deleted=False)
        
        if search:
            query = query.filter(
                or_(
                    Personnel.national_code.contains(search),
                    Personnel.first_name.contains(search),
                    Personnel.last_name.contains(search)
                )
            )
        
        if dept_id:
            query = query.filter_by(department_id=dept_id)
        if unit_id:
            query = query.filter_by(unit_id=unit_id)
        
        pagination = query.order_by(Personnel.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
        
        result = []
        for p in pagination.items:
            result.append({
                'id': p.id,
                'national_code': p.national_code,
                'first_name': p.first_name or '',
                'last_name': p.last_name or '',
                'full_name': p.get_full_name(),
                'phone': p.phone or '',
                'position': p.position or '',
                'department_id': p.department_id,
                'department_name': p.department.name if p.department else '-',
                'unit_id': p.unit_id,
                'unit_name': p.unit.name if p.unit else '-',
                'period_id': p.period_id
            })
        
        return jsonify({
            'personnel': result,
            'total': pagination.total,
            'page': page,
            'pages': pagination.pages
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/api/dynamic-fields')
@login_required
def api_dynamic_fields():
    """دریافت لیست فیلدهای پویا"""
    if current_user.role != 'admin':
        return jsonify({'error': 'دسترسی غیرمجاز'}), 403
    
    try:
        from app.models import DynamicField
        
        fields = DynamicField.query.filter_by(is_active=True).order_by(DynamicField.field_order).all()
        result = []
        for f in fields:
            result.append({
                'id': f.id,
                'title': f.title,
                'field_type': f.field_type,
                'is_required': f.is_required,
                'is_key': f.is_key,
                'is_active': f.is_active
            })
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/api/periods')
@login_required
def api_periods():
    """دریافت لیست دوره‌های کاری"""
    if current_user.role != 'admin':
        return jsonify({'error': 'دسترسی غیرمجاز'}), 403
    
    try:
        from app.models import WorkPeriod
        
        periods = WorkPeriod.query.order_by(WorkPeriod.created_at.desc()).all()
        result = []
        for p in periods:
            result.append({
                'id': p.id,
                'title': p.title,
                'start_date': p.start_date,
                'end_date': p.end_date,
                'deadline': p.deadline,
                'is_active': p.is_active,
                'display_order': p.display_order
            })
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/api/settings')
@login_required
def api_settings():
    """دریافت تنظیمات سیستم"""
    if current_user.role != 'admin':
        return jsonify({'error': 'دسترسی غیرمجاز'}), 403
    
    try:
        from app.models import Setting
        
        settings = {}
        all_settings = Setting.query.all()
        for s in all_settings:
            settings[s.key] = s.value
        
        return jsonify(settings)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/api/dashboard-data')
@login_required
def api_dashboard_data():
    """دریافت داده‌های داشبورد"""
    if current_user.role != 'admin':
        return jsonify({'error': 'دسترسی غیرمجاز'}), 403
    
    try:
        from app.models import User, Department, Unit, Personnel
        
        # آمار پایه
        stats = {
            'total_users': User.query.count(),
            'total_departments': Department.query.count(),
            'total_units': Unit.query.count(),
            'total_personnel': Personnel.query.filter_by(is_deleted=False).count(),
            'pending_users': User.query.filter_by(is_approved=False, is_active=True).count()
        }
        
        return jsonify({'success': True, 'stats': stats})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500