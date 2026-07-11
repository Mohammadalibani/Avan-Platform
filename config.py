# E:\Avan-Platform\config.py

import os
from datetime import timedelta

class Config:
    SECRET_KEY = 'avan-samaneye-pishrafteh-1403'
    
    # تنظیم client_encoding برای اتصال
    SQLALCHEMY_DATABASE_URI = 'postgresql://avan_user:avan123@localhost:5432/avan_db?client_encoding=utf8'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    PERMANENT_SESSION_LIFETIME = timedelta(hours=1)
    UPLOAD_FOLDER = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'static/uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024
    ITEMS_PER_PAGE = 25
    DEBUG = True