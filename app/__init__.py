import os
from flask import Flask, render_template, redirect, url_for, request, jsonify  # ✅ اضافه شد
from flask_login import LoginManager
from flask_migrate import Migrate
from config import Config
from dotenv import load_dotenv
from flask_cors import CORS

from app.extensions import db, login_manager, migrate, jwt

load_dotenv()

def create_app(config_class=Config):
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    template_dir = os.path.join(base_dir, 'templates')
    static_dir = os.path.join(base_dir, 'static')
    
    app = Flask(__name__, 
                template_folder=template_dir,
                static_folder=static_dir)
    app.config.from_object(config_class)
    
    db.init_app(app)
    login_manager.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    
    # ✅ CORS برای همه مسیرها
    CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"], 
         supports_credentials=True,
         allow_headers=["Content-Type", "Authorization", "Accept"])
    
    login_manager.login_view = 'auth.login'
    login_manager.login_message = 'لطفاً برای دسترسی وارد شوید'
    login_manager.login_message_category = 'info'
    
    from app.models import User
    
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))
    
    # ✅ اصلاح: unauthorized_handler با import صحیح
    @login_manager.unauthorized_handler
    def unauthorized():
        if request.path.startswith('/api'):
            return jsonify({'error': 'Unauthorized'}), 401
        return redirect(url_for('auth.login'))
    
    @app.context_processor
    def utility_processor():
        from flask_login import current_user
        from app.models import Department, DepartmentManager, Unit, UnitSupervisor
        
        def get_department_color():
            try:
                if current_user.is_authenticated:
                    if current_user.role == 'dept_manager':
                        dept_manager = DepartmentManager.query.filter_by(user_id=current_user.id).first()
                        if dept_manager:
                            dept = Department.query.get(dept_manager.department_id)
                            if dept and dept.color:
                                return dept.color
                    elif current_user.role == 'unit_supervisor':
                        supervisor = UnitSupervisor.query.filter_by(user_id=current_user.id).first()
                        if supervisor:
                            unit = Unit.query.get(supervisor.unit_id)
                            if unit:
                                dept = Department.query.get(unit.department_id)
                                if dept and dept.color:
                                    return dept.color
                    elif current_user.role == 'admin':
                        first_dept = Department.query.first()
                        if first_dept and first_dept.color:
                            return first_dept.color
            except Exception as e:
                print(f"⚠️ Error: {e}")
            return '#667eea'
        
        return dict(get_department_color=get_department_color)
    
    from app.blueprints.auth import auth_bp
    from app.blueprints.user import user_bp
    from app.blueprints.api import api_bp
    from app.blueprints.admin import admin_bp
    from app.blueprints.org_manager import org_manager_bp
    from app.blueprints.dept_manager import dept_manager_bp
    from app.blueprints.unit_supervisor import unit_supervisor_bp
    from app.api.v1 import api_v1_bp
    
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(user_bp)
    app.register_blueprint(api_bp, url_prefix='/api')
    app.register_blueprint(admin_bp, url_prefix='/admin')
    app.register_blueprint(org_manager_bp, url_prefix='/org-manager')
    app.register_blueprint(dept_manager_bp, url_prefix='/dept-manager')
    app.register_blueprint(unit_supervisor_bp, url_prefix='/unit-supervisor')
    app.register_blueprint(api_v1_bp, url_prefix='/api/v1')
    
    @app.route('/login')
    def login_redirect():
        return redirect(url_for('auth.login'))
    
    @app.route('/logout')
    def logout_redirect():
        return redirect(url_for('auth.logout'))
    
    return app