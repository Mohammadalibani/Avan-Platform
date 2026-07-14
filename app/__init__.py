import os
from flask import Flask, render_template, redirect, url_for
from flask_login import LoginManager
from flask_migrate import Migrate
from config import Config
from dotenv import load_dotenv

# ====== IMPORT از extensions ======
from app.extensions import db, login_manager, migrate

load_dotenv()

def create_app(config_class=Config):
    # تعیین مسیرهای مطلق
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    template_dir = os.path.join(base_dir, 'templates')
    static_dir = os.path.join(base_dir, 'static')
    
    app = Flask(__name__, 
                template_folder=template_dir,
                static_folder=static_dir)
    app.config.from_object(config_class)
    
    # ====== مقداردهی اولیه با db از extensions ======
    db.init_app(app)
    login_manager.init_app(app)
    migrate.init_app(app, db)
    
    # تنظیمات Login
    login_manager.login_view = 'auth.login'
    login_manager.login_message = 'لطفاً برای دسترسی وارد شوید'
    login_manager.login_message_category = 'info'
    
    # وارد کردن مدل‌ها
    from app.models import User
    
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))
    
    # ====== ثبت Blueprintها ======
    from app.blueprints.auth import auth_bp
    from app.blueprints.user import user_bp
    from app.blueprints.api import api_bp
    from app.blueprints.admin import admin_bp
    from app.blueprints.org_manager import org_manager_bp
    from app.blueprints.dept_manager import dept_manager_bp
    from app.blueprints.unit_supervisor import unit_supervisor_bp
    
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(user_bp)
    app.register_blueprint(api_bp, url_prefix='/api')
    app.register_blueprint(admin_bp, url_prefix='/admin')
    app.register_blueprint(org_manager_bp, url_prefix='/org-manager')
    app.register_blueprint(dept_manager_bp, url_prefix='/dept-manager')
    app.register_blueprint(unit_supervisor_bp, url_prefix='/unit-supervisor')
    
    # ====== مسیرهای مستقیم برای سازگاری ======
    @app.route('/login')
    def login_redirect():
        return redirect(url_for('auth.login'))
    
    @app.route('/logout')
    def logout_redirect():
        return redirect(url_for('auth.logout'))
    
    return app