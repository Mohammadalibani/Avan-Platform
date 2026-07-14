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