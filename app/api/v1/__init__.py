from flask import Blueprint

api_v1_bp = Blueprint('api_v1', __name__, url_prefix='/v1')

# ✅ اضافه کردن همه ماژول‌ها
from app.api.v1 import auth, users, personnel, departments, units, requests, dashboard, fields, periods