# app/utils/helpers.py
import jdatetime
from datetime import datetime
from flask import current_app

def to_jalali(date):
    """تبدیل تاریخ میلادی به شمسی"""
    if not date:
        return ''
    if isinstance(date, str):
        try:
            date = datetime.strptime(date, '%Y-%m-%d')
        except:
            return date
    return jdatetime.datetime.fromgregorian(datetime=date).strftime('%Y/%m/%d')


def to_jalali_datetime(date):
    """تبدیل تاریخ و زمان میلادی به شمسی"""
    if not date:
        return ''
    return jdatetime.datetime.fromgregorian(datetime=date).strftime('%Y/%m/%d %H:%M')


def persian_digits(number):
    """تبدیل اعداد انگلیسی به فارسی"""
    persian = '۰۱۲۳۴۵۶۷۸۹'
    if number is None:
        return ''
    return ''.join(persian[int(d)] for d in str(number) if d.isdigit())


def get_role_persian(role):
    """دریافت نقش به فارسی"""
    roles = current_app.config.get('ROLES', {})
    return roles.get(role, role)


def get_request_type_persian(request_type):
    """دریافت نوع درخواست به فارسی"""
    types = current_app.config.get('REQUEST_TYPES', {})
    return types.get(request_type, request_type)


def get_workflow_status_persian(status):
    """دریافت وضعیت گردش کار به فارسی"""
    statuses = current_app.config.get('WORKFLOW_STATUSES', {})
    return statuses.get(status, status)


def register_template_filters(app):
    """ثبت فیلترهای Jinja2"""
    app.jinja_env.filters['to_jalali'] = to_jalali
    app.jinja_env.filters['to_jalali_datetime'] = to_jalali_datetime
    app.jinja_env.filters['persian_digits'] = persian_digits
    app.jinja_env.filters['role_persian'] = get_role_persian
    app.jinja_env.filters['request_type_persian'] = get_request_type_persian
    app.jinja_env.filters['workflow_status_persian'] = get_workflow_status_persian
    
    # Global functions
    app.jinja_env.globals['now'] = datetime.now