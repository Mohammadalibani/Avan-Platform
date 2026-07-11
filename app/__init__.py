# app/__init__.py
from flask import Flask
from flask_cors import CORS
import os
from dotenv import load_dotenv

from app.config import config
from app.extensions import db, login_manager, migrate, cache
from app.utils.helpers import register_template_filters

load_dotenv()

def create_app(config_name='default'):
    # تنظیم مسیرهای templates و static
    app = Flask(__name__,
                template_folder='../templates',
                static_folder='../static')
    
    # بارگذاری تنظیمات
    app.config.from_object(config[config_name])
    
    # ✅ فقط برای SQLite پوشه instance رو ایجاد کن
    db_uri = app.config['SQLALCHEMY_DATABASE_URI']
    if db_uri.startswith('sqlite:///'):
        db_path = db_uri.replace('sqlite:///', '')
        instance_path = os.path.dirname(db_path)
        if instance_path:
            os.makedirs(instance_path, exist_ok=True)
            print(f"✅ پوشه instance ایجاد شد: {instance_path}")
    else:
        print(f"✅ استفاده از دیتابیس: {db_uri.split('://')[0]}")
    
    CORS(app, supports_credentials=True)
    
    db.init_app(app)
    login_manager.init_app(app)
    migrate.init_app(app, db)
    cache.init_app(app)
    
    register_template_filters(app)
    
    # ثبت Blueprintها
    from app.blueprints.auth import auth_bp
    from app.blueprints.main import main_bp
    from app.blueprints.admin import admin_bp
    from app.blueprints.api import api_bp
    
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(main_bp)
    app.register_blueprint(admin_bp, url_prefix='/admin')
    app.register_blueprint(api_bp, url_prefix='/api')
    
    # ایجاد جداول در اولین اجرا
    with app.app_context():
        try:
            db.create_all()
            print("✅ جداول دیتابیس با موفقیت ایجاد شدند")
            
            from app.models.user import User
            from app.models.settings import Setting
            from app.models.department import Department
            from app.models.unit import Unit
            
            # ایجاد ادمین پیش‌فرض
            admin = User.query.filter_by(role='admin').first()
            if not admin:
                admin = User(
                    national_code='1234567890',
                    username='1234567890',
                    first_name='مدیر',
                    last_name='سیستم',
                    role='admin',
                    personnel_code='ADMIN001',
                    is_active=True,
                    is_approved=True
                )
                admin.set_password('1234')
                db.session.add(admin)
                db.session.commit()
                print("✅ ادمین پیش‌فرض ایجاد شد (کد ملی: 1234567890، رمز: 1234)")
            else:
                print(f"✅ ادمین موجود است: {admin.first_name} {admin.last_name}")
            
            # تنظیمات پیش‌فرض
            if not Setting.query.filter_by(key='base_url').first():
                Setting.set('base_url', 'localhost')
            if not Setting.query.filter_by(key='port').first():
                Setting.set('port', '5000')
            print("✅ تنظیمات پیش‌فرض ایجاد شد")
            
            print(f"📊 تعداد کاربران: {User.query.count()}")
            
        except Exception as e:
            print(f"⚠️ خطا در ایجاد دیتابیس: {e}")
    
    return app