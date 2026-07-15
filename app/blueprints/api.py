from flask import Blueprint, render_template, request as req, jsonify, send_file, redirect, url_for, flash
from flask_login import login_required, current_user
from app.extensions import db
from app.models import *
from datetime import datetime
import json
import jdatetime
import os

api_bp = Blueprint('api', __name__, url_prefix='/api')


# ==================== تنظیمات ظاهر ====================

@api_bp.route('/settings/current', methods=['GET'])
def api_settings_current():
    """API عمومی برای دریافت تنظیمات ظاهر سامانه"""
    return jsonify({
        'site_title': Setting.get('site_title', 'سامانه کارکرد آوان'),
        'site_subtitle': Setting.get('site_subtitle', 'آغازگر ورود اطلاعات نوین'),
        'site_logo_url': Setting.get('site_logo', ''),
        'footer_text': Setting.get('footer_text', 'تمامی حقوق سامانه آوان متعلق به اداره کل نظارت و پشتیبانی امور مشتریان می باشد. 1403 - 1404'),
        'login_logo_url': Setting.get('login_logo', ''),
        'login_bg_url': Setting.get('login_bg', ''),
        'favicon_url': Setting.get('favicon', ''),
        'login_title': Setting.get('login_title', 'ورود به سامانه'),
        'login_subtitle': Setting.get('login_subtitle', 'مدیریت یکپارچه کارکرد و پیشرفته ورود اطلاعات'),
        'header_title': Setting.get('header_title', 'سامانه آوان'),
        'header_bg_color': Setting.get('header_bg_color', '#1e293b'),
        'header_text_color': Setting.get('header_text_color', '#ffffff'),
        'header_logo_url': Setting.get('header_logo', '')
    })


# ==================== اعلان‌های سراسری ====================

@api_bp.route('/announcements/active')
def api_get_active_announcements():
    """دریافت اعلان‌های فعال برای نمایش در هدر"""
    today = jdatetime.datetime.now().strftime('%Y/%m/%d')
    announcements = GlobalAnnouncement.query.filter_by(is_active=True).all()
    
    result = []
    for ann in announcements:
        if ann.start_date and ann.start_date > today:
            continue
        if ann.end_date and ann.end_date < today:
            continue
        result.append(ann.to_dict())
    
    return jsonify(result)


# ==================== اعلان‌های کاربر ====================

@api_bp.route('/notifications')
@login_required
def api_notifications():
    """دریافت اعلان‌های کاربر"""
    notifications = Notification.query.filter_by(
        user_id=current_user.id, 
        is_read=False
    ).order_by(Notification.created_at.desc()).all()
    
    return jsonify([{
        'id': n.id,
        'request_id': n.request_id,
        'request_type': n.request_type,
        'request_type_text': 'افزودن پرسنل' if n.request_type == 'add' else 'حذف پرسنل',
        'personnel_national_code': n.personnel_national_code,
        'personnel_full_name': n.personnel_full_name,
        'title': n.title,
        'message': n.message,
        'admin_note': n.admin_note,
        'created_at': n.created_at.strftime('%Y/%m/%d %H:%M')
    } for n in notifications])


@api_bp.route('/notifications/<int:notif_id>/read', methods=['POST'])
@login_required
def api_notification_read(notif_id):
    notif = Notification.query.get_or_404(notif_id)
    if notif.user_id != current_user.id:
        return jsonify({'error': 'دسترسی غیرمجاز'}), 403
    
    notif.is_read = True
    db.session.commit()
    return jsonify({'success': True})


@api_bp.route('/notifications/read-all', methods=['POST'])
@login_required
def api_notifications_read_all():
    Notification.query.filter_by(user_id=current_user.id, is_read=False).update({'is_read': True})
    db.session.commit()
    return jsonify({'success': True})


# ==================== پیام‌های کاری ====================

@api_bp.route('/work/messages')
@login_required
def api_work_messages():
    """دریافت پیام‌های صندوق پیام"""
    messages = WorkRevisionMessage.query.filter_by(to_user_id=current_user.id).order_by(
        WorkRevisionMessage.created_at.desc()
    ).all()
    
    unread_count = sum(1 for msg in messages if not msg.is_read)
    
    result = []
    for msg in messages:
        personnel = Personnel.query.get(msg.personnel_id)
        period = WorkPeriod.query.get(msg.period_id)
        from_user = User.query.get(msg.from_user_id)
        
        created_at_jalali = jdatetime.datetime.fromgregorian(datetime=msg.created_at).strftime('%Y/%m/%d %H:%M')
        
        result.append({
            'id': msg.id,
            'personnel_id': msg.personnel_id,
            'period_id': msg.period_id,
            'personnel_name': personnel.get_full_name() if personnel else '-',
            'period_title': period.title if period else '-',
            'from_role': msg.from_role,
            'from_user_id': msg.from_user_id,
            'from_user_name': from_user.get_full_name() if from_user else '-',
            'message': msg.message,
            'is_read': msg.is_read,
            'created_at': created_at_jalali
        })
    
    return jsonify({
        'unread_count': unread_count,
        'messages': result
    })


# ==================== اطلاعات کاربر ====================

@api_bp.route('/user-info')
@login_required
def api_user_info():
    """دریافت اطلاعات کاربر جاری"""
    return jsonify({
        'id': current_user.id,
        'national_code': current_user.national_code,
        'first_name': current_user.first_name,
        'last_name': current_user.last_name,
        'full_name': current_user.get_full_name(),
        'role': current_user.role,
        'username': current_user.username,
        'profile_picture': current_user.profile_picture
    })
    
# ==================== APIهای عمومی ====================

@api_bp.route('/supervisor/requests')
@login_required
def api_supervisor_requests():
    """API دریافت لیست درخواست‌های پرسنل زیرمجموعه برای سرپرست واحد"""
    if current_user.role != 'unit_supervisor':
        return jsonify({'error': 'دسترسی غیرمجاز'}), 403
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status = request.args.get('status', '')
    request_type = request.args.get('type', '')
    requester_id = request.args.get('requester_id', type=int)
    
    supervised_units = db.session.query(Unit).join(
        UnitSupervisor, UnitSupervisor.unit_id == Unit.id
    ).filter(UnitSupervisor.user_id == current_user.id).all()
    unit_ids = [u.id for u in supervised_units]
    
    personnel_list = Personnel.query.filter(Personnel.unit_id.in_(unit_ids)).all()
    
    user_ids = []
    for p in personnel_list:
        user = User.query.filter_by(national_code=p.national_code).first()
        if user:
            user_ids.append(user.id)
    
    query = Request.query.filter(Request.requester_id.in_(user_ids))
    
    if status:
        query = query.filter_by(status=status)
    if request_type:
        query = query.filter_by(request_type=request_type)
    if requester_id:
        query = query.filter_by(requester_id=requester_id)
    
    pagination = query.order_by(Request.request_date.desc()).paginate(page=page, per_page=per_page, error_out=False)
    
    stats = {
        'total': Request.query.filter(Request.requester_id.in_(user_ids)).count(),
        'pending': Request.query.filter(Request.requester_id.in_(user_ids), Request.status=='pending_unit').count(),
        'approved': Request.query.filter(Request.requester_id.in_(user_ids), Request.status=='approved').count(),
        'rejected': Request.query.filter(Request.requester_id.in_(user_ids), Request.status=='rejected').count(),
        'revision': Request.query.filter(Request.requester_id.in_(user_ids), Request.status=='revision').count()
    }
    
    requesters = db.session.query(User.id, User.first_name, User.last_name).filter(User.id.in_(user_ids)).all()
    requesters_list = [{'id': r.id, 'name': f"{r.first_name} {r.last_name}"} for r in requesters]
    
    return jsonify({
        'requests': [r.to_dict() for r in pagination.items],
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages,
        'stats': stats,
        'requesters': requesters_list
    })


@api_bp.route('/tickets')
@login_required
def api_tickets():
    admin_user = User.query.filter_by(role='admin').first()
    admin_id = admin_user.id if admin_user else 1
    
    if current_user.role == 'admin':
        tickets = Ticket.query.filter(
            db.or_(
                Ticket.receiver_id == current_user.id,
                Ticket.sender_id == current_user.id
            )
        ).order_by(Ticket.created_at.desc()).all()
    else:
        tickets = Ticket.query.filter(
            db.or_(
                Ticket.sender_id == current_user.id,
                db.and_(
                    Ticket.receiver_id == current_user.id,
                    Ticket.message_type == 'message'
                )
            )
        ).order_by(Ticket.created_at.desc()).all()
    
    result = []
    for t in tickets:
        sender = User.query.get(t.sender_id)
        receiver = User.query.get(t.receiver_id)
        msg_type = getattr(t, 'message_type', 'ticket')
        
        is_unread = (t.receiver_id == current_user.id and t.status == 'open')
        
        result.append({
            'id': t.id,
            'title': t.title,
            'message': t.message,
            'sender_name': sender.get_full_name() if sender else '-',
            'receiver_name': receiver.get_full_name() if receiver else '-',
            'status': t.status,
            'priority': t.priority,
            'message_type': msg_type,
            'created_at': t.created_at.strftime('%Y/%m/%d %H:%M'),
            'reply_count': len(t.replies),
            'is_unread': is_unread
        })
    
    unread_count = Ticket.query.filter(
        Ticket.receiver_id == current_user.id,
        Ticket.status == 'open'
    ).count()
    
    return jsonify({
        'messages': result,
        'unread_count': unread_count
    })