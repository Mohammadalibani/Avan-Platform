from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required
from app.models import User

# ============================================================
# دکوریتور اصلی برای کنترل نقش
# ============================================================

def role_required(*roles):
    """
    دکوریتور برای محدود کردن دسترسی بر اساس نقش کاربر
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                current_user_id = get_jwt_identity()
                user = User.query.get(current_user_id)
                
                if not user:
                    return jsonify({'error': 'کاربر یافت نشد'}), 404
                
                if user.role not in roles:
                    return jsonify({'error': 'شما دسترسی به این بخش را ندارید'}), 403
                
                return f(*args, **kwargs)
            except Exception as e:
                return jsonify({'error': f'خطا در اعتبارسنجی: {str(e)}'}), 401
        
        return decorated_function
    return decorator


# ============================================================
# دکوریتورهای خاص (برای راحتی کار)
# ============================================================

def admin_required(f):
    """فقط ادمین دسترسی داشته باشد"""
    return role_required('admin')(f)


def org_manager_required(f):
    """مدیر سازمان یا ادمین دسترسی داشته باشند"""
    return role_required('org_manager', 'admin')(f)


def dept_manager_required(f):
    """مدیر اداره یا ادمین دسترسی داشته باشند"""
    return role_required('dept_manager', 'admin')(f)


def unit_supervisor_required(f):
    """سرپرست واحد یا ادمین دسترسی داشته باشند"""
    return role_required('unit_supervisor', 'admin')(f)


def hr_manager_required(f):
    """مدیر منابع انسانی یا ادمین دسترسی داشته باشند"""
    return role_required('hr_manager', 'admin')(f)


def user_required(f):
    """همه کاربران احراز هویت شده دسترسی داشته باشند"""
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        return f(*args, **kwargs)
    return decorated_function


# ============================================================
# دکوریتور برای بررسی دسترسی به یک پرسنل خاص
# ============================================================

def personnel_access_required(f):
    """
    بررسی می‌کند که کاربر به پرسنل مورد نظر دسترسی دارد یا خیر
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        from app.models import Personnel, DepartmentManager, UnitSupervisor
        
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        # ادمین و مدیر سازمان دسترسی کامل دارند
        if user.role in ['admin', 'org_manager']:
            return f(*args, **kwargs)
        
        # دریافت personnel_id از پارامترهای URL
        pid = kwargs.get('pid') or kwargs.get('personnel_id')
        if not pid:
            return jsonify({'error': 'شناسه پرسنل یافت نشد'}), 400
        
        personnel = Personnel.query.get(pid)
        if not personnel:
            return jsonify({'error': 'پرسنل یافت نشد'}), 404
        
        # مدیر اداره: فقط پرسنل اداره خود را می‌بیند
        if user.role == 'dept_manager':
            dept_manager = DepartmentManager.query.filter_by(user_id=current_user_id).first()
            if dept_manager and personnel.department_id == dept_manager.department_id:
                return f(*args, **kwargs)
            return jsonify({'error': 'شما به این پرسنل دسترسی ندارید'}), 403
        
        # سرپرست واحد: فقط پرسنل واحد خود را می‌بیند
        if user.role == 'unit_supervisor':
            supervisor = UnitSupervisor.query.filter_by(user_id=current_user_id).first()
            if supervisor and personnel.unit_id == supervisor.unit_id:
                return f(*args, **kwargs)
            return jsonify({'error': 'شما به این پرسنل دسترسی ندارید'}), 403
        
        # کاربر عادی: فقط خودش را می‌بیند
        if user.role == 'subordinate':
            if user.national_code == personnel.national_code:
                return f(*args, **kwargs)
            return jsonify({'error': 'شما به این پرسنل دسترسی ندارید'}), 403
        
        return jsonify({'error': 'دسترسی غیرمجاز'}), 403
    
    return decorated_function


def request_access_required(f):
    """
    بررسی می‌کند که کاربر به درخواست مورد نظر دسترسی دارد یا خیر
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        from app.models import Request, UnitSupervisor, Personnel
        
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        # ادمین و مدیر سازمان دسترسی کامل دارند
        if user.role in ['admin', 'org_manager']:
            return f(*args, **kwargs)
        
        request_id = kwargs.get('request_id')
        if not request_id:
            return jsonify({'error': 'شناسه درخواست یافت نشد'}), 400
        
        req = Request.query.get(request_id)
        if not req:
            return jsonify({'error': 'درخواست یافت نشد'}), 404
        
        # صاحب درخواست
        if req.requester_id == current_user_id:
            return f(*args, **kwargs)
        
        # سرپرست واحد
        if user.role == 'unit_supervisor':
            if req.unit_supervisor_id == current_user_id:
                return f(*args, **kwargs)
            # بررسی اینکه کاربر سرپرست واحد درخواست‌دهنده است
            requester = User.query.get(req.requester_id)
            if requester:
                personnel = Personnel.query.filter_by(
                    national_code=requester.national_code,
                    is_deleted=False
                ).first()
                if personnel:
                    supervisor = UnitSupervisor.query.filter_by(unit_id=personnel.unit_id).first()
                    if supervisor and supervisor.user_id == current_user_id:
                        return f(*args, **kwargs)
        
        return jsonify({'error': 'شما به این درخواست دسترسی ندارید'}), 403
    
    return decorated_function