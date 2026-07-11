# app/extensions.py
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_caching import Cache

db = SQLAlchemy()
login_manager = LoginManager()
migrate = Migrate()
cache = Cache()

# تنظیمات Login Manager
login_manager.login_view = 'auth.login'
login_manager.login_message = 'لطفا برای دسترسی به این صفحه وارد شوید'
login_manager.login_message_category = 'warning'