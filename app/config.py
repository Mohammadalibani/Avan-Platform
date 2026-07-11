# app/config.py
import os
from dotenv import load_dotenv

load_dotenv()

# مسیر مطلق پروژه
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

class Config:
    """تنظیمات اصلی برنامه"""
    
    # Flask
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'avan-samaneye-pishrafteh-1403'
    
    # Database - مستقیماً به PostgreSQL
    SQLALCHEMY_DATABASE_URI = 'postgresql://postgres:123456@localhost:5432/avan_db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False
    
    # Session
    PERMANENT_SESSION_LIFETIME = 3600  # 1 ساعت
    
    # Upload
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'uploads')
    
    # Cache
    CACHE_TYPE = 'simple'
    CACHE_DEFAULT_TIMEOUT = 300
    
    # Pagination
    DEFAULT_PER_PAGE = 25
    
    # Roles
    ROLES = {
        'admin': 'مدیر کل سیستم',
        'org_manager': 'مدیر سازمان',
        'dept_manager': 'مدیر اداره',
        'hr_manager': 'مدیر منابع انسانی',
        'unit_supervisor': 'سرپرست واحد',
        'subordinate': 'کاربر عادی'
    }
    
    REQUEST_TYPES = {
        'overtime': 'اضافه کار ساعتی',
        'deficiency': 'ثبت نواقص',
        'daily_mission': 'ماموریت روزانه',
        'official_mission': 'ماموریت اداری',
        'arbaeen': 'سفر اربعین',
        'annual_leave': 'مرخصی روزانه',
        'hourly_leave': 'مرخصی ساعتی'
    }
    
    WORKFLOW_STATUSES = {
        'draft': 'پیش‌نویس',
        'unit_pending': 'در انتظار تایید سرپرست',
        'dept_pending': 'در انتظار تایید مدیر اداره',
        'org_pending': 'در انتظار تایید مدیر سازمان',
        'approved': 'تایید شده',
        'rejected': 'رد شده',
        'revision': 'نیاز به اصلاح'
    }


class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_ECHO = True


class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_ECHO = False


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}