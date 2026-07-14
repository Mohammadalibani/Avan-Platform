from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required, current_user
from app.models import User
from app.extensions import db
from datetime import datetime

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('user.dashboard'))
    
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password) and user.is_active and user.is_approved:
            user.last_login = datetime.now()
            db.session.commit()
            login_user(user)
            flash(f'خوش آمدید {user.get_full_name()}', 'success')
            return redirect(url_for('user.dashboard'))
        else:
            flash('کد ملی یا رمز عبور اشتباه است', 'error')
    
    return render_template('login.html')

@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    flash('شما از سامانه خارج شدید', 'info')
    return redirect(url_for('user.index'))