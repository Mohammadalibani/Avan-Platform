from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.api.v1 import api_v1_bp
from app.models import Notification
from app.extensions import db

@api_v1_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    """دریافت اعلان‌های کاربر"""
    current_user_id = get_jwt_identity()
    notifications = Notification.query.filter_by(
        user_id=current_user_id,
        is_read=False
    ).order_by(Notification.created_at.desc()).all()
    
    return jsonify([{
        'id': n.id,
        'title': n.title,
        'message': n.message,
        'link': n.link,
        'created_at': n.created_at.strftime('%Y/%m/%d %H:%M')
    } for n in notifications])

@api_v1_bp.route('/notifications/<int:notif_id>/read', methods=['POST'])
@jwt_required()
def mark_notification_read(notif_id):
    """علامت‌گذاری اعلان به عنوان خوانده شده"""
    current_user_id = get_jwt_identity()
    notif = Notification.query.get_or_404(notif_id)
    if notif.user_id != current_user_id:
        return jsonify({'error': 'دسترسی غیرمجاز'}), 403
    notif.is_read = True
    db.session.commit()
    return jsonify({'success': True})

@api_v1_bp.route('/notifications/read-all', methods=['POST'])
@jwt_required()
def mark_all_notifications_read():
    """علامت‌گذاری همه اعلان‌ها به عنوان خوانده شده"""
    current_user_id = get_jwt_identity()
    Notification.query.filter_by(user_id=current_user_id, is_read=False).update({'is_read': True})
    db.session.commit()
    return jsonify({'success': True})