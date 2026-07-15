from flask import jsonify
from app.api.v1 import api_v1_bp
from app.models import Setting

@api_v1_bp.route('/settings/current', methods=['GET'])
def get_settings():
    """دریافت تنظیمات ظاهر سامانه"""
    return jsonify({
        'site_title': Setting.get('site_title', 'سامانه کارکرد آوان'),
        'site_subtitle': Setting.get('site_subtitle', 'آغازگر ورود اطلاعات نوین'),
        'site_logo_url': Setting.get('site_logo', ''),
        'footer_text': Setting.get('footer_text', 'تمامی حقوق سامانه آوان متعلق به اداره کل نظارت و پشتیبانی امور مشتریان می باشد. 1403 - 1404'),
        'login_logo_url': Setting.get('login_logo', ''),
        'login_bg_url': Setting.get('login_bg', ''),
        'favicon_url': Setting.get('favicon', ''),
        'login_title': Setting.get('login_title', 'ورود به سامانه'),
        'login_subtitle': Setting.get('login_subtitle', 'مدیریت یکپارچه کارکرد و پیشرفته ورود اطلاعات'),
        'header_title': Setting.get('header_title', 'سامانه آوان'),
        'header_bg_color': Setting.get('header_bg_color', '#1e293b'),
        'header_text_color': Setting.get('header_text_color', '#ffffff'),
        'header_logo_url': Setting.get('header_logo', '')
    })