from flask import Blueprint

api_v1_bp = Blueprint('api_v1', __name__, url_prefix='/v1')

# Import all route modules
from app.api.v1 import auth, users, personnel, departments, units, requests, dashboard