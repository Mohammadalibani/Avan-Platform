# app/blueprints/notification_routes.py
from flask import request, jsonify
from app.blueprints import notification_bp
from app.services.notification_service import NotificationService
from app.jwt_utils import token_required

notification_service = NotificationService()


@notification_bp.route('', methods=['GET'])
@token_required
def get_notifications():
    """Get all notifications for current user"""
    user_id = request.user.id
    
    unread_only = request.args.get('unread_only', 'false').lower() == 'true'
    notifications = notification_service.get_user_notifications(user_id, unread_only)
    
    return jsonify({
        'success': True,
        'data': [n.to_dict() for n in notifications],
        'count': len(notifications),
        'unread_count': notification_service.get_unread_count(user_id)
    }), 200


@notification_bp.route('/<int:notification_id>', methods=['GET'])
@token_required
def get_notification(notification_id):
    """Get a specific notification"""
    notification = notification_service.get_by_id(notification_id)
    
    if not notification:
        return jsonify({
            'success': False,
            'message': 'Notification not found'
        }), 404
    
    # Check if notification belongs to user
    if notification.user_id != request.user.id:
        return jsonify({
            'success': False,
            'message': 'Permission denied'
        }), 403
    
    return jsonify({
        'success': True,
        'data': notification.to_dict()
    }), 200


@notification_bp.route('/<int:notification_id>/read', methods=['POST'])
@token_required
def mark_as_read(notification_id):
    """Mark a notification as read"""
    notification = notification_service.mark_as_read(notification_id)
    
    if not notification:
        return jsonify({
            'success': False,
            'message': 'Notification not found'
        }), 404
    
    # Check if notification belongs to user
    if notification.user_id != request.user.id:
        return jsonify({
            'success': False,
            'message': 'Permission denied'
        }), 403
    
    return jsonify({
        'success': True,
        'message': 'Notification marked as read',
        'data': notification.to_dict()
    }), 200


@notification_bp.route('/read-all', methods=['POST'])
@token_required
def mark_all_as_read():
    """Mark all notifications as read for current user"""
    count = notification_service.mark_all_as_read(request.user.id)
    
    return jsonify({
        'success': True,
        'message': f'{count} notifications marked as read',
        'count': count
    }), 200


@notification_bp.route('/<int:notification_id>', methods=['DELETE'])
@token_required
def delete_notification(notification_id):
    """Delete a notification"""
    notification = notification_service.get_by_id(notification_id)
    
    if not notification:
        return jsonify({
            'success': False,
            'message': 'Notification not found'
        }), 404
    
    # Check if notification belongs to user
    if notification.user_id != request.user.id:
        return jsonify({
            'success': False,
            'message': 'Permission denied'
        }), 403
    
    notification_service.delete_notification(notification_id)
    
    return jsonify({
        'success': True,
        'message': 'Notification deleted successfully'
    }), 200


@notification_bp.route('/delete-all', methods=['DELETE'])
@token_required
def delete_all_notifications():
    """Delete all notifications for current user"""
    count = notification_service.delete_all_for_user(request.user.id)
    
    return jsonify({
        'success': True,
        'message': f'{count} notifications deleted',
        'count': count
    }), 200


@notification_bp.route('/unread-count', methods=['GET'])
@token_required
def get_unread_count():
    """Get unread notification count for current user"""
    count = notification_service.get_unread_count(request.user.id)
    
    return jsonify({
        'success': True,
        'count': count
    }), 200