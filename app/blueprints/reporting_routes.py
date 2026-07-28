# app/blueprints/reporting_routes.py
from flask import request, jsonify
from app.blueprints import reporting_bp
from app.services.reporting_service import ReportingService
from app.jwt_utils import token_required

reporting_service = ReportingService()


@reporting_bp.route('/dashboard', methods=['GET'])
@token_required
def get_dashboard():
    """Get dashboard summary"""
    summary = reporting_service.get_dashboard_summary()
    return jsonify({
        'success': True,
        'data': summary
    }), 200


@reporting_bp.route('/projects', methods=['GET'])
@token_required
def get_project_stats():
    """Get project statistics"""
    project_id = request.args.get('project_id', type=int)
    stats = reporting_service.get_project_stats(project_id)
    return jsonify({
        'success': True,
        'data': stats
    }), 200


@reporting_bp.route('/users', methods=['GET'])
@token_required
def get_user_stats():
    """Get user statistics"""
    user_id = request.args.get('user_id', type=int)
    stats = reporting_service.get_user_stats(user_id)
    return jsonify({
        'success': True,
        'data': stats
    }), 200


@reporting_bp.route('/tasks', methods=['GET'])
@token_required
def get_task_stats():
    """Get task statistics"""
    status = request.args.get('status')
    priority = request.args.get('priority')
    stats = reporting_service.get_task_stats(status, priority)
    return jsonify({
        'success': True,
        'data': stats
    }), 200


@reporting_bp.route('/activity', methods=['GET'])
@token_required
def get_activity():
    """Get activity statistics"""
    days = request.args.get('days', 30, type=int)
    stats = reporting_service.get_activity_stats(days)
    return jsonify({
        'success': True,
        'data': stats
    }), 200


@reporting_bp.route('/timeline', methods=['GET'])
@token_required
def get_timeline():
    """Get timeline data for charts"""
    days = request.args.get('days', 30, type=int)
    data = reporting_service.get_timeline_data(days)
    return jsonify({
        'success': True,
        'data': data
    }), 200


@reporting_bp.route('/team-performance', methods=['GET'])
@token_required
def get_team_performance():
    """Get team performance metrics"""
    data = reporting_service.get_team_performance()
    return jsonify({
        'success': True,
        'data': data
    }), 200


@reporting_bp.route('/project-progress', methods=['GET'])
@token_required
def get_project_progress():
    """Get all projects progress"""
    data = reporting_service.get_project_progress()
    return jsonify({
        'success': True,
        'data': data
    }), 200