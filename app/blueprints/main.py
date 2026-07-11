# app/blueprints/main.py
from flask import Blueprint, render_template, redirect, url_for, flash
from flask_login import login_required, current_user

main_bp = Blueprint('main', __name__)


@main_bp.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))
    return render_template('index.html')


@main_bp.route('/dashboard')
@login_required
def dashboard():
    """داشبورد اصلی - هدایت بر اساس نقش"""
    role_routes = {
        'admin': 'admin.dashboard',
        'org_manager': 'org_manager.dashboard',
        'dept_manager': 'dept_manager.dashboard',
        'hr_manager': 'hr_manager.dashboard',
        'unit_supervisor': 'unit_supervisor.dashboard',
        'subordinate': 'subordinate.dashboard'
    }
    
    route = role_routes.get(current_user.role, 'subordinate.dashboard')
    return redirect(url_for(route))


@main_bp.route('/profile')
@login_required
def profile():
    """صفحه پروفایل"""
    return render_template('profile.html', user=current_user)