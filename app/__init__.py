# app/__init__.py
from flask import Flask, jsonify, request
from flask_cors import CORS  
import os
from pathlib import Path

# Import extensions and config
from app.extensions import db, migrate
from app.config import config


def create_app(config_name=None):
    """Application factory pattern"""
    app = Flask(__name__)
    
    # Determine config
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # ===== Enable CORS for React =====
    CORS(app, resources={
        r"/*": {
            "origins": ["http://localhost:3000", "http://127.0.0.1:3000", 
                       "http://10.86.109.205:3000", "http://10.86.109.205"],
            "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True,
            "max_age": 3600
        }
    })
    
    # Ensure instance folder exists
    instance_path = Path(app.instance_path)
    instance_path.mkdir(parents=True, exist_ok=True)
    
    # Ensure upload folder exists
    upload_path = Path(app.config.get('UPLOAD_FOLDER', 'uploads'))
    upload_path.mkdir(parents=True, exist_ok=True)
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    
    # Import models
    from app.models import (
        User, Role, Permission, Project, Task, 
        Comment, Notification, Attachment, 
        Workflow, WorkflowStep, Report
    )
    
    # ===== Register Blueprints =====
    from app.blueprints.auth_routes import auth_bp
    from app.blueprints.user_routes import user_bp
    from app.blueprints.project_routes import project_bp
    from app.blueprints.task_routes import task_bp
    from app.blueprints.workflow_routes import workflow_bp
    from app.blueprints.notification_routes import notification_bp
    from app.blueprints.reporting_routes import reporting_bp
    from app.blueprints.admin_routes import admin_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(project_bp)
    app.register_blueprint(task_bp)
    app.register_blueprint(workflow_bp)
    app.register_blueprint(notification_bp)
    app.register_blueprint(reporting_bp)
    app.register_blueprint(admin_bp)
    
    # ===== Performance Settings =====
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_size': 10,
        'pool_recycle': 3600,
        'pool_pre_ping': True,
        'max_overflow': 20
    }
    
    # ===== API Root =====
    @app.route('/')
    def home():
        return jsonify({
            'message': 'Welcome to Avan Platform API',
            'status': 'running',
            'version': '3.0.0',
            'phase': 'Phase 14 - Performance Optimization',
            'endpoints': {
                'auth': '/api/auth/login',
                'users': '/api/users',
                'projects': '/api/projects',
                'tasks': '/api/tasks',
                'workflows': '/api/workflows',
                'notifications': '/api/notifications',
                'reporting': '/api/reporting'
            }
        })
    
    @app.route('/health')
    def health():
        return jsonify({
            'status': 'healthy',
            'database': 'connected' if db.engine else 'disconnected'
        })
    
    @app.route('/favicon.ico')
    def favicon():
        return '', 204
    
    # ===== Cache Headers for API =====
    @app.after_request
    def add_cache_headers(response):
        if request.method == 'GET' and response.status_code == 200:
            # Cache static responses
            if request.path.startswith('/api/') and not request.path.startswith('/api/auth'):
                response.headers['Cache-Control'] = 'public, max-age=60'
        return response
    
    # ===== Register Error Handlers =====
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
    
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({'error': 'Bad request'}), 400
    
    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({'error': 'Unauthorized'}), 401
    
    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({'error': 'Forbidden'}), 403
    
    return app