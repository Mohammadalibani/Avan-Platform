# app/config.py - اضافه کردن تنظیمات JWT
import os
from pathlib import Path

from dotenv import load_dotenv
load_dotenv()

class Config:
    """Base configuration"""

    SECRET_KEY = os.environ.get(
        'SECRET_KEY',
        'dev-secret-key-change-in-production'
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Database
    instance_path = Path(__file__).parent.parent / 'instance'
    instance_path.mkdir(exist_ok=True)

    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        f'sqlite:///{instance_path}/app.db'
    )

    # =====================
    # JWT Settings
    # =====================
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", SECRET_KEY)
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"
    JWT_ACCESS_TOKEN_EXPIRES = int(
        os.environ.get("JWT_ACCESS_TOKEN_EXPIRES", 3600)
    )
    JWT_REFRESH_TOKEN_EXPIRES = int(
        os.environ.get("JWT_REFRESH_TOKEN_EXPIRES", 86400 * 7)
    )

    # Session & Security
    SESSION_COOKIE_SECURE = os.environ.get(
        'SESSION_COOKIE_SECURE', 'False'
    ) == 'True'

    REMEMBER_COOKIE_SECURE = os.environ.get(
        'REMEMBER_COOKIE_SECURE', 'False'
    ) == 'True'

    SESSION_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_HTTPONLY = True

    # Application
    APP_NAME = "Avan Platform"
    DEBUG = False
    TESTING = False

    # Upload settings
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024
    UPLOAD_FOLDER = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        'uploads'
    )
    ALLOWED_EXTENSIONS = {
        'pdf', 'png', 'jpg', 'jpeg',
        'gif', 'doc', 'docx', 'xls', 'xlsx'
    }

class DevelopmentConfig(Config):
    DEBUG = True
    ENV = 'development'
    SQLALCHEMY_ECHO = True


class TestingConfig(Config):
    TESTING = True
    DEBUG = True
    ENV = 'testing'
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False


class ProductionConfig(Config):
    ENV = 'production'
    DEBUG = False
    SESSION_COOKIE_SECURE = True
    REMEMBER_COOKIE_SECURE = True
    PREFERRED_URL_SCHEME = 'https'


config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

# JWT Settings
