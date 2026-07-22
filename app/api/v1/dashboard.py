from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.api.v1 import api_v1_bp
from app.api.decorators import admin_required, org_manager_required
from app.models import (
    User, Personnel, Department, Unit, Request,
    WorkPeriod, PersonnelValue, DynamicField, DepartmentManager, UnitSupervisor
)
from app.extensions import db
from datetime import datetime
import jdatetime

# ============================================================
# توابع کمکی
# ============================================================

def get_kpi_data():
    """دریافت داده‌های KPI اصلی سازمان"""
    total_users = User.query.count()
    active_users = User.query.filter_by(is_active=True, is_approved=True).count()
    pending_users = User.query.filter_by(is_approved=False, is_active=True).count()
    
    total_personnel = Personnel.query.filter_by(is_deleted=False).count()
    complete_personnel = 0
    
    dynamic_fields = DynamicField.query.filter_by(is_active=True).all()
    non_key_fields = [f for f in dynamic_fields if not f.is_key]
    
    for p in Personnel.query.filter_by(is_deleted=False).all():
        filled = 0
        for f in non_key_fields:
            pv = PersonnelValue.query.filter_by(
                personnel_id=p.id,
                field_id=f.id,
                period_id=p.period_id
            ).first()
            if pv and (pv.value_text or pv.value_number is not None or pv.value_date):
                filled += 1
        if filled == len(non_key_fields) and len(non_key_fields) > 0:
            complete_personnel += 1
    
    completion_percent = round((complete_personnel / total_personnel * 100), 2) if total_personnel > 0 else 0
    
    total_departments = Department.query.filter_by(is_active=True).count()
    total_units = Unit.query.filter_by(is_active=True).count()
    pending_requests = Request.query.filter(Request.status.in_(['pending_unit', 'pending_dept', 'pending_org'])).count()
    
    return {
        'total_users': total_users,
        'active_users': active_users,
        'pending_users': pending_users,
        'total_personnel': total_personnel,
        'complete_personnel': complete_personnel,
        'completion_percent': completion_percent,
        'total_departments': total_departments,
        'total_units': total_units,
        'pending_requests': pending_requests
    }


# ============================================================
# APIهای اصلی (بدون تابع تکراری)
# ============================================================

@api_v1_bp.route('/dashboard/kpi', methods=['GET'])
@jwt_required()
def get_kpi():
    """دریافت داده‌های KPI برای داشبورد"""
    return jsonify(get_kpi_data()), 200


@api_v1_bp.route('/dashboard/departments', methods=['GET'])
@jwt_required()
@org_manager_required
def get_departments_stats():
    """دریافت آمار ادارات (فقط مدیر سازمان و ادمین)"""
    departments = Department.query.filter_by(is_active=True).all()
    result = []
    
    for dept in departments:
        personnel_count = Personnel.query.filter_by(department_id=dept.id, is_deleted=False).count()
        units_count = Unit.query.filter_by(department_id=dept.id, is_active=True).count()
        managers_count = db.session.query(User).join(
            DepartmentManager, DepartmentManager.user_id == User.id
        ).filter(DepartmentManager.department_id == dept.id).count()
        
        result.append({
            'id': dept.id,
            'name': dept.name,
            'color': dept.color,
            'personnel_count': personnel_count,
            'units_count': units_count,
            'managers_count': managers_count
        })
    
    return jsonify({'departments': result}), 200


@api_v1_bp.route('/dashboard/personnel-trend', methods=['GET'])
@jwt_required()
@org_manager_required
def get_personnel_trend():
    """دریافت روند تغییرات پرسنل در ماه‌های اخیر"""
    months = request.args.get('months', 6, type=int)
    result = []
    
    for i in range(months - 1, -1, -1):
        now = datetime.now()
        from datetime import timedelta
        start_date = datetime(now.year, now.month, 1) - timedelta(days=30 * i)
        end_date = start_date + timedelta(days=30)
        
        created = Personnel.query.filter(
            Personnel.created_at >= start_date,
            Personnel.created_at < end_date,
            Personnel.is_deleted == False
        ).count()
        
        deleted = Personnel.query.filter(
            Personnel.updated_at >= start_date,
            Personnel.updated_at < end_date,
            Personnel.is_deleted == True
        ).count()
        
        result.append({
            'month': start_date.strftime('%Y/%m'),
            'created': created,
            'deleted': deleted,
            'net': created - deleted
        })
    
    return jsonify({'trend': result}), 200


@api_v1_bp.route('/dashboard/requests-stats', methods=['GET'])
@jwt_required()
def get_requests_stats():
    """دریافت آمار درخواست‌ها"""
    total = Request.query.count()
    pending = Request.query.filter(Request.status.in_(['pending_unit', 'pending_dept', 'pending_org'])).count()
    approved = Request.query.filter_by(status='approved').count()
    rejected = Request.query.filter_by(status='rejected').count()
    revision = Request.query.filter_by(status='revision').count()
    
    # درخواست‌های هر نوع
    from app.api.v1.requests import REQUEST_TYPES
    by_type = {}
    for req_type in REQUEST_TYPES:
        count = Request.query.filter_by(request_type=req_type).count()
        if count > 0:
            by_type[req_type] = count
    
    return jsonify({
        'total': total,
        'pending': pending,
        'approved': approved,
        'rejected': rejected,
        'revision': revision,
        'by_type': by_type
    }), 200


@api_v1_bp.route('/dashboard/my-stats', methods=['GET'])
@jwt_required()
def get_my_stats():
    """دریافت آمار شخصی کاربر جاری"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    my_requests = Request.query.filter_by(requester_id=current_user_id).count()
    pending_requests = Request.query.filter_by(requester_id=current_user_id, status='pending_unit').count()
    approved_requests = Request.query.filter_by(requester_id=current_user_id, status='approved').count()
    rejected_requests = Request.query.filter_by(requester_id=current_user_id, status='rejected').count()
    
    personnel_info = None
    if user.role == 'unit_supervisor':
        supervisor = UnitSupervisor.query.filter_by(user_id=current_user_id).first()
        if supervisor:
            personnel_count = Personnel.query.filter_by(unit_id=supervisor.unit_id, is_deleted=False).count()
            unit = Unit.query.get(supervisor.unit_id)
            personnel_info = {
                'unit_name': unit.name if unit else '-',
                'personnel_count': personnel_count
            }
    elif user.role == 'dept_manager':
        dept_manager = DepartmentManager.query.filter_by(user_id=current_user_id).first()
        if dept_manager:
            personnel_count = Personnel.query.filter_by(department_id=dept_manager.department_id, is_deleted=False).count()
            dept = Department.query.get(dept_manager.department_id)
            personnel_info = {
                'department_name': dept.name if dept else '-',
                'personnel_count': personnel_count
            }
    
    return jsonify({
        'my_requests': {
            'total': my_requests,
            'pending': pending_requests,
            'approved': approved_requests,
            'rejected': rejected_requests
        },
        'personnel_info': personnel_info
    }), 200