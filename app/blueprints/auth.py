# app/blueprints/auth.py
from flask import Blueprint, request, jsonify, render_template, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required, current_user
from datetime import datetime

from app.models.user import User
from app.extensions import db

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')


@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    """صفحه ورود"""
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))
    
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()
        
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password) and user.is_active and user.is_approved:
            user.last_login = datetime.now()
            db.session.commit()
            login_user(user)
            flash(f'خوش آمدید {user.get_full_name()}', 'success')
            return redirect(url_for('main.dashboard'))
        else:
            flash('کد ملی یا رمز عبور اشتباه است', 'error')
    
    return render_template('login.html')


@auth_bp.route('/logout')
@login_required
def logout():
    """خروج از سیستم"""
    logout_user()
    flash('شما از سامانه خارج شدید', 'info')
    return redirect(url_for('auth.login'))


@auth_bp.route('/api/login', methods=['POST'])
def api_login():
    """API ورود (برای فرانت‌اند جدید)"""
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    
    user = User.query.filter_by(username=username).first()
    
    if not user or not user.check_password(password):
        return jsonify({'error': 'کد ملی یا رمز عبور اشتباه است'}), 401
    
    if not user.is_active or not user.is_approved:
        return jsonify({'error': 'حساب کاربری شما فعال نیست'}), 403
    
    user.last_login = datetime.now()
    db.session.commit()
    login_user(user)
    
    return jsonify({
        'success': True,
        'user': user.to_dict(),
        'redirect': url_for('main.dashboard')
    })


@auth_bp.route('/api/logout', methods=['POST'])
@login_required
def api_logout():
    """API خروج (برای فرانت‌اند جدید)"""
    logout_user()
    return jsonify({'success': True})


@auth_bp.route('/api/me')
@login_required
def api_me():
    """دریافت اطلاعات کاربر جاری"""
    return jsonify(current_user.to_dict())