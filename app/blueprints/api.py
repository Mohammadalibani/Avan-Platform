# app/blueprints/api.py
from flask import Blueprint, jsonify, request, current_app
from flask_login import login_required, current_user
from sqlalchemy import func, or_
from datetime import datetime, timedelta
import json

api_bp = Blueprint('api', __name__, url_prefix='/api')


# ============================================
# APIهای کاربری (User APIs)
# ============================================

@api_bp.route('/user-info')
@login_required
def user_info():
    """دریافت اطلاعات کاربر جاری"""
    try:
        return jsonify({
            'id': current_user.id,
            'national_code': current_user.national_code,
            'first_name': current_user.first_name,
            'last_name': current_user.last_name,
            'full_name': current_user.get_full_name(),
            'role': current_user.role,
            'role_persian': current_user.get_role_persian(),
            'username': current_user.username,
            'profile_picture': current_user.profile_picture,
            'is_active': current_user.is_active,
            'is_approved': current_user.is_approved
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================
# APIهای تنظیمات (Settings APIs)
# ============================================

@api_bp.route('/settings/current')
@login_required
def settings_current():
    """دریافت تنظیمات جاری"""
    try:
        from app.models import Setting
        
        settings = {
            'site_title': Setting.get('site_title', 'سامانه آوان'),
            'site_subtitle': Setting.get('site_subtitle', 'مدیریت یکپارچه کارکرد'),
            'login_logo_url': Setting.get('login_logo', ''),
            'login_bg_url': Setting.get('login_bg', ''),
            'favicon_url': Setting.get('favicon', ''),
            'header_title': Setting.get('header_title', 'سامانه آوان'),
            'header_logo_url': Setting.get('header_logo', ''),
            'footer_text': Setting.get('footer_text', 'تمامی حقوق محفوظ است'),
            'base_url': Setting.get('base_url', 'localhost'),
            'port': Setting.get('port', '5000')
        }
        return jsonify({'success': True, 'settings': settings})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================
# APIهای اعلانات (Notifications APIs)
# ============================================

@api_bp.route('/notifications')
@login_required
def get_notifications():
    """دریافت اعلانات کاربر"""
    try:
        from app.models import Notification
        
        notifications = Notification.query.filter_by(
            user_id=current_user.id, 
            is_read=False
        ).order_by(Notification.created_at.desc()).limit(50).all()
        
        result = []
        for n in notifications:
            result.append({
                'id': n.id,
                'title': n.title,
                'message': n.message,
                'link': n.link,
                'created_at': n.created_at.strftime('%Y/%m/%d %H:%M') if n.created_at else '',
                'is_read': n.is_read
            })
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify([])


@api_bp.route('/notifications/<int:notif_id>/read', methods=['POST'])
@login_required
def mark_notification_read(notif_id):
    """علامت‌گذاری اعلان به عنوان خوانده شده"""
    try:
        from app.models import Notification
        from app.extensions import db
        
        notif = Notification.query.get_or_404(notif_id)
        if notif.user_id != current_user.id:
            return jsonify({'error': 'دسترسی غیرمجاز'}), 403
        
        notif.is_read = True
        db.session.commit()
        
        return jsonify({'success': True})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/notifications/read-all', methods=['POST'])
@login_required
def mark_all_notifications_read():
    """علامت‌گذاری همه اعلان‌ها به عنوان خوانده شده"""
    try:
        from app.models import Notification
        from app.extensions import db
        
        Notification.query.filter_by(user_id=current_user.id, is_read=False).update({'is_read': True})
        db.session.commit()
        
        return jsonify({'success': True})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================
# APIهای اعلانات سراسری (Announcements APIs)
# ============================================

@api_bp.route('/announcements/active')
def get_active_announcements():
    """دریافت اعلانات سراسری فعال"""
    try:
        from app.models import GlobalAnnouncement
        
        today = datetime.now().strftime('%Y/%m/%d')
        
        announcements = GlobalAnnouncement.query.filter_by(is_active=True).all()
        
        result = []
        for ann in announcements:
            # بررسی تاریخ
            if ann.start_date and ann.start_date > today:
                continue
            if ann.end_date and ann.end_date < today:
                continue
                
            result.append({
                'id': ann.id,
                'title': ann.title,
                'message': ann.message,
                'icon': ann.icon,
                'bg_color': ann.bg_color,
                'border_color': ann.border_color,
                'text_color': ann.text_color,
                'priority': ann.priority
            })
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify([])


# ============================================
# APIهای پیام‌های کاری (Work Messages APIs)
# ============================================

@api_bp.route('/work/messages')
@login_required
def work_messages():
    """دریافت پیام‌های کاری"""
    try:
        from app.models import WorkRevisionMessage, Personnel, WorkPeriod, User
        
        messages = WorkRevisionMessage.query.filter_by(
            to_user_id=current_user.id
        ).order_by(WorkRevisionMessage.created_at.desc()).limit(50).all()
        
        result = []
        for msg in messages:
            personnel = Personnel.query.get(msg.personnel_id)
            period = WorkPeriod.query.get(msg.period_id)
            from_user = User.query.get(msg.from_user_id)
            
            result.append({
                'id': msg.id,
                'personnel_id': msg.personnel_id,
                'personnel_name': personnel.get_full_name() if personnel else '-',
                'period_title': period.title if period else '-',
                'from_user_name': from_user.get_full_name() if from_user else '-',
                'message': msg.message[:200],
                'is_read': msg.is_read,
                'created_at': msg.created_at.strftime('%Y/%m/%d %H:%M') if msg.created_at else ''
            })
        
        # تعداد خوانده نشده
        unread_count = WorkRevisionMessage.query.filter_by(
            to_user_id=current_user.id, 
            is_read=False
        ).count()
        
        return jsonify({
            'messages': result,
            'unread_count': unread_count
        })
        
    except Exception as e:
        return jsonify({'messages': [], 'unread_count': 0})


# ============================================
# APIهای ادمین (Admin APIs)
# ============================================

@api_bp.route('/admin/departments')
@login_required
def admin_departments():
    """دریافت لیست ادارات (برای ادمین)"""
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


@api_bp.route('/admin/units-all')
@login_required
def admin_units_all():
    """دریافت همه واحدها (برای ادمین)"""
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
        return jsonify({'error': str(e)}), 500


@api_bp.route('/admin/users-advanced')
@login_required
def admin_users_advanced():
    """دریافت لیست کاربران با فیلتر (برای ادمین)"""
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
        current_app.logger.error(f"Error in admin_users_advanced: {e}")
        return jsonify({'error': str(e)}), 500


@api_bp.route('/admin/fields')
@login_required
def admin_fields():
    """دریافت فیلدهای داینامیک (برای ادمین)"""
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
                'is_active': f.is_active,
                'field_order': f.field_order
            })
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/admin/personnel')
@login_required
def admin_personnel():
    """دریافت لیست پرسنل (برای ادمین)"""
    if current_user.role != 'admin':
        return jsonify({'error': 'دسترسی غیرمجاز'}), 403
    
    try:
        from app.models import Personnel, Department, Unit
        
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
                'period_id': p.period_id,
                'is_deleted': p.is_deleted
            })
        
        return jsonify({
            'personnel': result,
            'total': pagination.total,
            'page': page,
            'pages': pagination.pages
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500