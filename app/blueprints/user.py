from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify
from flask_login import login_required, current_user, login_user, logout_user
from app.extensions import db
from app.models import *
from datetime import datetime
import jdatetime
import json

user_bp = Blueprint('user', __name__)


# ==================== صفحات اصلی ====================

@user_bp.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('user.dashboard'))
    return render_template('index.html')


@user_bp.route('/dashboard')
@login_required
def dashboard():
    """هدایت کاربر به پنل مناسب بر اساس نقش"""
    if current_user.role == 'admin':
        return redirect(url_for('admin.dashboard'))
    elif current_user.role == 'org_manager':
        return redirect(url_for('org_manager.dashboard'))
    elif current_user.role == 'dept_manager':
        return redirect(url_for('dept_manager.dashboard'))
    elif current_user.role == 'unit_supervisor':
        return redirect(url_for('unit_supervisor.dashboard'))
    else:
        return redirect(url_for('user.subordinate_dashboard'))


@user_bp.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    if request.method == 'POST':
        action = request.form.get('action')
        
        if action == 'change_password':
            old_password = request.form.get('old_password')
            new_password = request.form.get('new_password')
            confirm_password = request.form.get('confirm_password')
            
            if not current_user.check_password(old_password):
                flash('رمز عبور فعلی اشتباه است', 'error')
            elif new_password != confirm_password:
                flash('رمز عبور جدید و تکرار آن مطابقت ندارند', 'error')
            elif len(new_password) < 4:
                flash('رمز عبور جدید باید حداقل 4 کاراکتر باشد', 'error')
            else:
                current_user.set_password(new_password)
                db.session.commit()
                flash('رمز عبور با موفقیت تغییر یافت', 'success')
        
        elif action == 'update_profile':
            first_name = request.form.get('first_name')
            last_name = request.form.get('last_name')
            personnel_code = request.form.get('personnel_code')
            
            if first_name:
                current_user.first_name = first_name
            if last_name:
                current_user.last_name = last_name
            if personnel_code:
                current_user.personnel_code = personnel_code
            db.session.commit()
            flash('اطلاعات با موفقیت به‌روزرسانی شد', 'success')
        
        return redirect(url_for('user.profile'))
    
    is_admin = (current_user.role == 'admin')
    return render_template('profile.html', user=current_user, is_admin=is_admin)


@user_bp.route('/profile/upload-avatar', methods=['POST'])
@login_required
def upload_avatar():
    try:
        if 'avatar' not in request.files:
            return jsonify({'error': 'فایلی ارسال نشده'}), 400
        
        file = request.files['avatar']
        if file.filename == '':
            return jsonify({'error': 'فایلی انتخاب نشده'}), 400
        
        import os
        from werkzeug.utils import secure_filename
        
        ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
        if ext not in ['jpg', 'jpeg', 'png', 'gif']:
            return jsonify({'error': 'فقط فایل‌های تصویری مجاز هستند'}), 400
        
        file.seek(0, 2)
        file_size_mb = file.tell() // (1024 * 1024)
        file.seek(0)
        if file_size_mb > 5:
            return jsonify({'error': 'حجم فایل نباید بیشتر از 5 مگابایت باشد'}), 400
        
        upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static', 'uploads', 'avatars')
        os.makedirs(upload_dir, exist_ok=True)
        
        filename = f"{current_user.national_code}.{ext}"
        file_path = os.path.join(upload_dir, filename)
        
        if current_user.profile_picture:
            old_path = os.path.join(upload_dir, current_user.profile_picture)
            if os.path.exists(old_path) and old_path != file_path:
                os.remove(old_path)
        
        file.save(file_path)
        
        current_user.profile_picture = filename
        db.session.commit()
        
        return jsonify({
            'success': True,
            'url': f'/static/uploads/avatars/{filename}',
            'filename': filename
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Error uploading avatar: {e}")
        return jsonify({'error': str(e)}), 500


# ==================== پنل کاربر عادی ====================

@user_bp.route('/subordinate/dashboard')
@login_required
def subordinate_dashboard():
    if current_user.role != 'subordinate':
        flash('دسترسی غیرمجاز', 'error')
        return redirect(url_for('user.dashboard'))
    
    today_date = jdatetime.datetime.now().strftime('%Y/%m/%d')
    total_forms = 0
    today_forms = 0
    rank = 0
    
    return render_template('subordinate/dashboard.html',
                          total_forms=total_forms,
                          today_forms=today_forms,
                          rank=rank,
                          today_date=today_date)


@user_bp.route('/subordinate/profile', methods=['GET', 'POST'])
@login_required
def subordinate_profile():
    if current_user.role != 'subordinate':
        flash('دسترسی غیرمجاز', 'error')
        return redirect(url_for('user.dashboard'))
    
    if request.method == 'POST':
        action = request.form.get('action')
        
        if action == 'change_password':
            old_password = request.form.get('old_password')
            new_password = request.form.get('new_password')
            confirm_password = request.form.get('confirm_password')
            
            if not current_user.check_password(old_password):
                flash('رمز عبور فعلی اشتباه است', 'error')
            elif new_password != confirm_password:
                flash('رمز عبور جدید و تکرار آن مطابقت ندارند', 'error')
            elif len(new_password) < 4:
                flash('رمز عبور جدید باید حداقل 4 کاراکتر باشد', 'error')
            else:
                current_user.set_password(new_password)
                db.session.commit()
                flash('رمز عبور با موفقیت تغییر یافت', 'success')
        elif action == 'update_profile':
            first_name = request.form.get('first_name')
            last_name = request.form.get('last_name')
            personnel_code = request.form.get('personnel_code')
            
            if first_name:
                current_user.first_name = first_name
            if last_name:
                current_user.last_name = last_name
            if personnel_code:
                current_user.personnel_code = personnel_code
            db.session.commit()
            flash('اطلاعات با موفقیت به‌روزرسانی شد', 'success')
        
        return redirect(url_for('user.subordinate_profile'))
    
    return render_template('subordinate/profile.html', user=current_user)


@user_bp.route('/subordinate/upload-avatar', methods=['POST'])
@login_required
def subordinate_upload_avatar():
    if current_user.role != 'subordinate':
        return jsonify({'error': 'دسترسی غیرمجاز'}), 403
    
    try:
        if 'avatar' not in request.files:
            return jsonify({'error': 'فایلی ارسال نشده'}), 400
        
        file = request.files['avatar']
        if file.filename == '':
            return jsonify({'error': 'فایلی انتخاب نشده'}), 400
        
        import os
        ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
        if ext not in ['jpg', 'jpeg', 'png', 'gif']:
            return jsonify({'error': 'فقط فایل‌های تصویری مجاز هستند'}), 400
        
        upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static', 'uploads')
        os.makedirs(upload_dir, exist_ok=True)
        
        filename = f"user_{current_user.id}_{int(datetime.now().timestamp())}.jpg"
        file.save(os.path.join(upload_dir, filename))
        
        if current_user.profile_picture:
            old_file = os.path.join(upload_dir, current_user.profile_picture)
            if os.path.exists(old_file):
                os.remove(old_file)
        
        current_user.profile_picture = filename
        db.session.commit()
        
        return jsonify({'success': True})
        
    except Exception as e:
        db.session.rollback()
        print(f"Error uploading avatar: {e}")
        return jsonify({'error': str(e)}), 500


# ==================== صفحات درخواست‌ها ====================

@user_bp.route('/requests')
@login_required
def my_requests_page():
    if current_user.role not in ['subordinate', 'unit_supervisor']:
        flash('دسترسی غیرمجاز', 'error')
        return redirect(url_for('user.dashboard'))
    return render_template('user/my_requests.html')


@user_bp.route('/requests/overtime/new')
@login_required
def overtime_request_page():
    if current_user.role != 'subordinate':
        flash('فقط کاربران عادی می‌توانند درخواست ثبت کنند', 'error')
        return redirect(url_for('user.dashboard'))
    return render_template('requests/overtime.html')


@user_bp.route('/requests/hourly-leave/new')
@login_required
def hourly_leave_request_page():
    if current_user.role != 'subordinate':
        flash('فقط کاربران عادی می‌توانند درخواست ثبت کنند', 'error')
        return redirect(url_for('user.dashboard'))
    return render_template('requests/hourly_leave.html')


@user_bp.route('/requests/daily-mission/new')
@login_required
def daily_mission_request_page():
    if current_user.role != 'subordinate':
        flash('فقط کاربران عادی می‌توانند درخواست ثبت کنند', 'error')
        return redirect(url_for('user.dashboard'))
    return render_template('requests/daily_mission.html')


@user_bp.route('/requests/official-mission/new')
@login_required
def official_mission_request_page():
    if current_user.role != 'subordinate':
        flash('فقط کاربران عادی می‌توانند درخواست ثبت کنند', 'error')
        return redirect(url_for('user.dashboard'))
    return render_template('requests/official_mission.html')


@user_bp.route('/requests/arbaeen/new')
@login_required
def arbaeen_request_page():
    if current_user.role != 'subordinate':
        flash('فقط کاربران عادی می‌توانند درخواست ثبت کنند', 'error')
        return redirect(url_for('user.dashboard'))
    return render_template('requests/arbaeen.html')


@user_bp.route('/requests/deficiency/new')
@login_required
def deficiency_request_page():
    if current_user.role != 'subordinate':
        flash('فقط کاربران عادی می‌توانند درخواست ثبت کنند', 'error')
        return redirect(url_for('user.dashboard'))
    return render_template('requests/deficiency.html')


@user_bp.route('/requests/annual-leave/new')
@login_required
def annual_leave_request_page():
    if current_user.role != 'subordinate':
        flash('فقط کاربران عادی می‌توانند درخواست ثبت کنند', 'error')
        return redirect(url_for('user.dashboard'))
    return render_template('requests/annual_leave.html')


@user_bp.route('/requests/<int:request_id>/edit')
@login_required
def edit_request_page(request_id):
    if current_user.role != 'subordinate':
        flash('دسترسی غیرمجاز', 'error')
        return redirect(url_for('user.dashboard'))
    
    req = Request.query.get_or_404(request_id)
    if req.requester_id != current_user.id:
        flash('دسترسی غیرمجاز', 'error')
        return redirect(url_for('user.dashboard'))
    
    if req.status != 'revision':
        flash('این درخواست قابل ویرایش نیست', 'error')
        return redirect(url_for('user.my_requests_page'))
    
    return render_template('requests/edit_request.html')


# ==================== APIهای درخواست‌ها ====================

@user_bp.route('/api/requests')
@login_required
def api_get_requests():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status = request.args.get('status', '')
    request_type = request.args.get('type', '')
    
    query = Request.query.filter_by(requester_id=current_user.id)
    
    if status:
        query = query.filter_by(status=status)
    if request_type:
        query = query.filter_by(request_type=request_type)
    
    pagination = query.order_by(Request.request_date.desc()).paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'requests': [r.to_dict() for r in pagination.items],
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages
    })


@user_bp.route('/api/requests/<int:request_id>')
@login_required
def api_get_request(request_id):
    req = Request.query.get_or_404(request_id)
    
    if current_user.role != 'admin' and current_user.id != req.requester_id and current_user.id != req.unit_supervisor_id:
        return jsonify({'error': 'دسترسی غیرمجاز'}), 403
    
    return jsonify(req.to_dict())


@user_bp.route('/api/requests/overtime/create', methods=['POST'])
@login_required
def api_create_overtime_request():
    if current_user.role not in ['subordinate']:
        return jsonify({'error': 'فقط کاربران عادی می‌توانند درخواست ثبت کنند'}), 403
    
    data = request.get_json()
    
    start_time = data.get('start_time', '').strip()
    end_time = data.get('end_time', '').strip()
    date = data.get('date', '').strip()
    subject = data.get('subject', '').strip()
    duration = data.get('duration', '').strip()
    
    if not start_time or not end_time or not date or not subject:
        return jsonify({'error': 'تمامی فیلدهای الزامی را پر کنید'}), 400
    
    supervisor = get_unit_supervisor(current_user.national_code)
    if not supervisor:
        return jsonify({'error': 'سرپرست واحدی برای شما تعریف نشده است'}), 400
    
    req = Request(
        request_type='overtime',
        requester_id=current_user.id,
        unit_supervisor_id=supervisor.id,
        status='pending_unit'
    )
    
    extra_data = {
        'start_time': start_time,
        'end_time': end_time,
        'date': date,
        'subject': subject,
        'duration': duration
    }
    req.set_extra_data(extra_data)
    
    db.session.add(req)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'درخواست اضافه کار با موفقیت ثبت شد',
        'request_id': req.id
    })


@user_bp.route('/api/requests/deficiency/create', methods=['POST'])
@login_required
def api_create_deficiency_request():
    if current_user.role not in ['subordinate']:
        return jsonify({'error': 'فقط کاربران عادی می‌توانند درخواست ثبت کنند'}), 403
    
    data = request.get_json()
    
    date = data.get('date', '').strip()
    time = data.get('time', '').strip()
    deficiency_type = data.get('type', '').strip()
    description = data.get('description', '').strip()
    
    if not date or not time or not deficiency_type or not description:
        return jsonify({'error': 'تمامی فیلدهای الزامی را پر کنید'}), 400
    
    if deficiency_type not in ['ورود', 'خروج']:
        return jsonify({'error': 'نوع نقص باید ورود یا خروج باشد'}), 400
    
    supervisor = get_unit_supervisor(current_user.national_code)
    if not supervisor:
        return jsonify({'error': 'سرپرست واحدی برای شما تعریف نشده است'}), 400
    
    req = Request(
        request_type='deficiency',
        requester_id=current_user.id,
        unit_supervisor_id=supervisor.id,
        status='pending_unit'
    )
    
    extra_data = {
        'date': date,
        'time': time,
        'type': deficiency_type,
        'description': description
    }
    req.set_extra_data(extra_data)
    
    db.session.add(req)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'درخواست ثبت نقص با موفقیت ثبت شد',
        'request_id': req.id
    })


@user_bp.route('/api/requests/annual-leave/create', methods=['POST'])
@login_required
def api_create_annual_leave_request():
    if current_user.role not in ['subordinate']:
        return jsonify({'error': 'فقط کاربران عادی می‌توانند درخواست ثبت کنند'}), 403
    
    data = request.get_json()
    
    start_date = data.get('start_date', '').strip()
    end_date = data.get('end_date', '').strip()
    leave_type = data.get('leave_type', '').strip()
    description = data.get('description', '').strip()
    
    if not start_date or not end_date or not leave_type:
        return jsonify({'error': 'فیلدهای تاریخ شروع، پایان و نوع مرخصی الزامی است'}), 400
    
    if leave_type not in ['استحقاقی', 'استعلاجی', 'تشویقی']:
        return jsonify({'error': 'نوع مرخصی نامعتبر است'}), 400
    
    supervisor = get_unit_supervisor(current_user.national_code)
    if not supervisor:
        return jsonify({'error': 'سرپرست واحدی برای شما تعریف نشده است'}), 400
    
    req = Request(
        request_type='annual_leave',
        requester_id=current_user.id,
        unit_supervisor_id=supervisor.id,
        status='pending_unit'
    )
    
    extra_data = {
        'start_date': start_date,
        'end_date': end_date,
        'leave_type': leave_type,
        'description': description
    }
    req.set_extra_data(extra_data)
    
    db.session.add(req)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'درخواست مرخصی با موفقیت ثبت شد',
        'request_id': req.id
    })


# ==================== توابع کمکی ====================

def get_unit_supervisor(national_code):
    """دریافت سرپرست واحد یک کاربر بر اساس کد ملی"""
    personnel = Personnel.query.filter_by(national_code=national_code).first()
    if not personnel:
        return None
    
    unit_supervisor = UnitSupervisor.query.filter_by(unit_id=personnel.unit_id).first()
    if unit_supervisor:
        return User.query.get(unit_supervisor.user_id)
    return None