# app/__init__.py

from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from pathlib import Path

from app.extensions import db, migrate, jwt
from app.config import config


def create_app(config_name=None):
    """Application factory"""

    app = Flask(__name__)

    # ----------------------------------------------------
    # Load Configuration
    # ----------------------------------------------------
    if config_name is None:
        config_name = os.environ.get("FLASK_ENV", "development")

    app.config.from_object(config[config_name])

    # ----------------------------------------------------
    # Enable CORS
    # ----------------------------------------------------
    CORS(
        app,
        origins=[
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://10.86.109.205:3000",
            "http://10.86.109.205",
            "http://10.86.109.205:80",
            "http://localhost",
            "http://10.86.109.205:5000",
            "*",
        ],
        methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=[
            "Content-Type", 
            "Authorization", 
            "X-Requested-With", 
            "Accept",
            "Origin",
            "Access-Control-Request-Method",
            "Access-Control-Request-Headers",
        ],
        expose_headers=["Content-Type", "Authorization"],
        supports_credentials=True,
        max_age=3600,
    )

    # ----------------------------------------------------
    # Create folders
    # ----------------------------------------------------
    Path(app.instance_path).mkdir(parents=True, exist_ok=True)
    Path(app.config.get("UPLOAD_FOLDER", "uploads")).mkdir(parents=True, exist_ok=True)

    # ----------------------------------------------------
    # Initialize Extensions
    # ----------------------------------------------------
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    # ----------------------------------------------------
    # Import Models
    # ----------------------------------------------------
    from app.models import (
        User,
        Role,
        Permission,
        Project,
        Task,
        Comment,
        Notification,
        Attachment,
        Workflow,
        WorkflowStep,
        Report,
        Setting,
    )

    # ----------------------------------------------------
    # Register Blueprints
    # ----------------------------------------------------
    from app.blueprints.auth_routes import auth_bp
    from app.blueprints.user_routes import user_bp
    from app.blueprints.project_routes import project_bp
    from app.blueprints.task_routes import task_bp
    from app.blueprints.workflow_routes import workflow_bp
    from app.blueprints.notification_routes import notification_bp
    from app.blueprints.reporting_routes import reporting_bp
    from app.blueprints.admin_routes import admin_bp
    from app.blueprints.settings_routes import settings_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(project_bp)
    app.register_blueprint(task_bp)
    app.register_blueprint(workflow_bp)
    app.register_blueprint(notification_bp)
    app.register_blueprint(reporting_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(settings_bp)

    # ----------------------------------------------------
    # SQLAlchemy Engine
    # ----------------------------------------------------
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "pool_size": 10,
        "pool_recycle": 3600,
        "pool_pre_ping": True,
        "max_overflow": 20,
    }

    # ----------------------------------------------------
    # Routes
    # ----------------------------------------------------
    @app.route("/")
    def home():
        return jsonify(
            {
                "message": "Welcome to Avan Platform API",
                "status": "running",
                "version": "3.0.0",
                "phase": "Phase 15 - Production Ready",
            }
        )

    @app.route("/health")
    def health():
        return jsonify(
            {
                "status": "healthy",
                "database": "connected",
            }
        )

    @app.route("/favicon.ico")
    def favicon():
        return "", 204

    # ----------------------------------------------------
    # Cache
    # ----------------------------------------------------
    @app.after_request
    def add_cache_headers(response):
        if (
            request.method == "GET"
            and response.status_code == 200
            and request.path.startswith("/api/")
            and not request.path.startswith("/api/auth")
        ):
            response.headers["Cache-Control"] = "public, max-age=60"
        return response

    # ----------------------------------------------------
    # Error Handlers
    # ----------------------------------------------------
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({"error": "Bad request"}), 400

    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({"error": "Unauthorized"}), 401

    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({"error": "Forbidden"}), 403

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(422)
    def unprocessable_entity(error):
        return jsonify({"error": "Unprocessable entity"}), 422

    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({"error": "Internal server error"}), 500

    return app