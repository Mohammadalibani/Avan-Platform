from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.api.v1 import api_v1_bp
from app.api.decorators import unit_supervisor_required, role_required
from app.models import (
    Request, User, Personnel, Unit, UnitSupervisor,
    Department, WorkPeriod, Notification
)
from app.extensions import db
from datetime import datetime
import jdatetime
import json

# ============================================================
# انواع درخواست‌ها
# ============================================================

REQUEST_TYPES = {
    'overtime': {'name': 'اضافه کار', 'icon': '⏰', 'color': '#f59e0b'},
    'hourly_leave': {'name': 'مرخصی ساعتی', 'icon': '🕐', 'color': '#3b82f6'},
    'daily_mission': {'name': 'مأموریت روزانه', 'icon': '🚗', 'color': '#10b981'},
    'official_mission': {'name': 'مأموریت اداری', 'icon': '🏢', 'color': '#8b5cf6'},
    'arbaeen': {'name': 'سفر اربعین', 'icon': '🕋', 'color': '#ef4444'},
    'deficiency': {'name': 'ثبت نواقص', 'icon': '⚠️', 'color': '#f97316'},
    'annual_leave': {'name': 'مرخصی روزانه', 'icon': '🌴', 'color': '#06b6d4'}
}

REQUEST_STATUS = {
    'pending_unit': '⏳ در انتظار تایید سرپرست واحد',
    'pending_dept': '⏳ در انتظار تایید مدیر اداره',
    'pending_org': '⏳ در انتظار تایید مدیر سازمان',
    'approved': '✅ تایید شده',
    'rejected': '❌ رد شده',
    'revision': '🔄 نیاز به اصلاح'
}


# ============================================================
# توابع کمکی
# ============================================================

def get_unit_supervisor_user(national_code):
    """دریافت سرپرست واحد یک کاربر بر اساس کد ملی"""
    personnel = Personnel.query.filter_by(national_code=national_code, is_deleted=False).first()
    if not personnel:
        return None
    
    unit_supervisor = UnitSupervisor.query.filter_by(unit_id=personnel.unit_id).first()
    if unit_supervisor:
        return User.query.get(unit_supervisor.user_id)
    return None


def get_next_approver(request_obj):
    """دریافت نقش بعدی برای تأیید"""
    if request_obj.status == 'pending_unit':
        return 'dept_manager'
    elif request_obj.status == 'pending_dept':
        return 'org_manager'
    return None


def send_notification(user_id, title, message, link):
    """ارسال اعلان"""
    try:
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            link=link,
            is_read=False
        )
        db.session.add(notification)
        db.session.commit()
    except Exception as e:
        print(f"Error sending notification: {e}")


# ============================================================
# APIهای اصلی
# ============================================================

@api_v1_bp.route('/requests/types', methods=['GET'])
@jwt_required()
def get_request_types():
    """دریافت انواع درخواست‌ها"""
    return jsonify({
        'types': REQUEST_TYPES,
        'statuses': REQUEST_STATUS
    }), 200


@api_v1_bp.route('/requests/my', methods=['GET'])
@jwt_required()
def get_my_requests():
    """دریافت درخواست‌های من"""
    current_user_id = get_jwt_identity()
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status = request.args.get('status', '')
    request_type = request.args.get('type', '')
    
    query = Request.query.filter_by(requester_id=current_user_id)
    
    if status:
        query = query.filter_by(status=status)
    if request_type:
        query = query.filter_by(request_type=request_type)
    
    pagination = query.order_by(Request.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    result = []
    for req in pagination.items:
        result.append(req.to_dict())
    
    return jsonify({
        'requests': result,
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages
    }), 200


@api_v1_bp.route('/requests/pending', methods=['GET'])
@jwt_required()
@unit_supervisor_required
def get_pending_requests():
    """دریافت درخواست‌های در انتظار تایید سرپرست واحد"""
    current_user_id = get_jwt_identity()
    
    # دریافت واحدهای تحت سرپرستی
    supervised_units = db.session.query(Unit).join(
        UnitSupervisor, UnitSupervisor.unit_id == Unit.id
    ).filter(UnitSupervisor.user_id == current_user_id).all()
    unit_ids = [u.id for u in supervised_units]
    
    if not unit_ids:
        return jsonify({'requests': [], 'total': 0, 'pages': 0}), 200
    
    # دریافت پرسنل این واحدها
    personnel_list = Personnel.query.filter(
        Personnel.unit_id.in_(unit_ids),
        Personnel.is_deleted == False
    ).all()
    national_codes = [p.national_code for p in personnel_list]
    
    # دریافت کاربران مرتبط
    users = User.query.filter(User.national_code.in_(national_codes)).all()
    user_ids = [u.id for u in users]
    
    # دریافت درخواست‌های در انتظار
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    request_type = request.args.get('type', '')
    
    query = Request.query.filter(
        Request.requester_id.in_(user_ids),
        Request.status == 'pending_unit'
    )
    
    if request_type:
        query = query.filter_by(request_type=request_type)
    
    pagination = query.order_by(Request.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    result = []
    for req in pagination.items:
        data = req.to_dict()
        # اضافه کردن اطلاعات کاربر
        user = User.query.get(req.requester_id)
        data['requester_name'] = user.get_full_name() if user else '-'
        data['requester_national_code'] = user.national_code if user else ''
        result.append(data)
    
    return jsonify({
        'requests': result,
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages
    }), 200


@api_v1_bp.route('/requests', methods=['GET'])
@jwt_required()
def get_requests():
    """دریافت لیست درخواست‌ها (با فیلتر)"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status = request.args.get('status', '')
    request_type = request.args.get('type', '')
    user_id = request.args.get('user_id', type=int)
    
    query = Request.query
    
    # محدودیت دسترسی بر اساس نقش
    if user.role == 'subordinate':
        # کاربر عادی فقط درخواست‌های خود را می‌بیند
        query = query.filter_by(requester_id=current_user_id)
    elif user.role == 'unit_supervisor':
        # سرپرست واحد درخواست‌های زیرمجموعه را می‌بیند
        supervised_units = db.session.query(Unit).join(
            UnitSupervisor, UnitSupervisor.unit_id == Unit.id
        ).filter(UnitSupervisor.user_id == current_user_id).all()
        unit_ids = [u.id for u in supervised_units]
        
        if unit_ids:
            personnel_list = Personnel.query.filter(
                Personnel.unit_id.in_(unit_ids),
                Personnel.is_deleted == False
            ).all()
            national_codes = [p.national_code for p in personnel_list]
            users = User.query.filter(User.national_code.in_(national_codes)).all()
            user_ids = [u.id for u in users]
            query = query.filter(Request.requester_id.in_(user_ids))
        else:
            query = query.filter(Request.requester_id == -1)  # هیچ نتیجه‌ای
    elif user.role not in ['admin', 'org_manager']:
        # سایر نقش‌ها فقط درخواست‌های خود را می‌بینند
        query = query.filter_by(requester_id=current_user_id)
    
    if status:
        query = query.filter_by(status=status)
    if request_type:
        query = query.filter_by(request_type=request_type)
    if user_id and user.role in ['admin', 'org_manager']:
        query = query.filter_by(requester_id=user_id)
    
    pagination = query.order_by(Request.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    result = []
    for req in pagination.items:
        data = req.to_dict()
        requester = User.query.get(req.requester_id)
        data['requester_name'] = requester.get_full_name() if requester else '-'
        data['requester_national_code'] = requester.national_code if requester else ''
        result.append(data)
    
    return jsonify({
        'requests': result,
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages
    }), 200


@api_v1_bp.route('/requests/<int:request_id>', methods=['GET'])
@jwt_required()
def get_request(request_id):
    """دریافت اطلاعات یک درخواست"""
    req = Request.query.get_or_404(request_id)
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    # بررسی دسترسی
    if req.requester_id != current_user_id and user.role not in ['admin', 'org_manager']:
        # بررسی سرپرست واحد
        if user.role == 'unit_supervisor':
            requester = User.query.get(req.requester_id)
            if requester:
                personnel = Personnel.query.filter_by(
                    national_code=requester.national_code,
                    is_deleted=False
                ).first()
                if personnel:
                    supervisor = UnitSupervisor.query.filter_by(unit_id=personnel.unit_id).first()
                    if not supervisor or supervisor.user_id != current_user_id:
                        return jsonify({'error': 'دسترسی غیرمجاز'}), 403
        else:
            return jsonify({'error': 'دسترسی غیرمجاز'}), 403
    
    data = req.to_dict()
    requester = User.query.get(req.requester_id)
    data['requester_name'] = requester.get_full_name() if requester else '-'
    data['requester_national_code'] = requester.national_code if requester else ''
    
    if req.unit_supervisor_id:
        supervisor = User.query.get(req.unit_supervisor_id)
        data['supervisor_name'] = supervisor.get_full_name() if supervisor else '-'
    
    return jsonify(data), 200


@api_v1_bp.route('/requests', methods=['POST'])
@jwt_required()
@role_required('subordinate')
def create_request():
    """ایجاد درخواست جدید (فقط کاربر عادی)"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    data = request.get_json()
    request_type = data.get('request_type', '').strip()
    extra_data = data.get('extra_data', {})
    
    if not request_type or request_type not in REQUEST_TYPES:
        return jsonify({'error': 'نوع درخواست نامعتبر است'}), 400
    
    # دریافت سرپرست واحد
    supervisor = get_unit_supervisor_user(user.national_code)
    if not supervisor:
        return jsonify({'error': 'سرپرست واحدی برای شما تعریف نشده است'}), 400
    
    # ایجاد درخواست
    req = Request(
        request_type=request_type,
        requester_id=current_user_id,
        unit_supervisor_id=supervisor.id,
        status='pending_unit',
        extra_data=json.dumps(extra_data, ensure_ascii=False)
    )
    
    db.session.add(req)
    db.session.commit()
    
    # ارسال اعلان به سرپرست
    send_notification(
        user_id=supervisor.id,
        title=f"📨 درخواست جدید {REQUEST_TYPES[request_type]['name']}",
        message=f"{user.get_full_name()} یک درخواست {REQUEST_TYPES[request_type]['name']} ثبت کرد.",
        link=f"/requests/{req.id}"
    )
    
    return jsonify({
        'success': True,
        'message': f'درخواست {REQUEST_TYPES[request_type]["name"]} با موفقیت ثبت شد',
        'request_id': req.id
    }), 201


@api_v1_bp.route('/requests/<int:request_id>', methods=['PUT'])
@jwt_required()
def update_request(request_id):
    """ویرایش درخواست (فقط در وضعیت revision)"""
    req = Request.query.get_or_404(request_id)
    current_user_id = get_jwt_identity()
    
    # فقط صاحب درخواست می‌تواند ویرایش کند
    if req.requester_id != current_user_id:
        return jsonify({'error': 'شما به این درخواست دسترسی ندارید'}), 403
    
    if req.status != 'revision':
        return jsonify({'error': 'این درخواست قابل ویرایش نیست'}), 400
    
    data = request.get_json()
    extra_data = data.get('extra_data', {})
    
    # به‌روزرسانی داده‌ها
    req.extra_data = json.dumps(extra_data, ensure_ascii=False)
    req.status = 'pending_unit'
    req.updated_at = datetime.now()
    
    db.session.commit()
    
    # ارسال اعلان به سرپرست
    supervisor = User.query.get(req.unit_supervisor_id)
    if supervisor:
        requester = User.query.get(req.requester_id)
        send_notification(
            user_id=supervisor.id,
            title=f"🔄 درخواست {REQUEST_TYPES[req.request_type]['name']} ویرایش شد",
            message=f"{requester.get_full_name()} درخواست خود را اصلاح و مجدداً ارسال کرد.",
            link=f"/requests/{req.id}"
        )
    
    return jsonify({
        'success': True,
        'message': 'درخواست با موفقیت ویرایش و مجدداً ارسال شد'
    }), 200


@api_v1_bp.route('/requests/<int:request_id>/approve', methods=['POST'])
@jwt_required()
@unit_supervisor_required
def approve_request(request_id):
    """تأیید درخواست توسط سرپرست واحد"""
    req = Request.query.get_or_404(request_id)
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    # بررسی دسترسی سرپرست به این درخواست
    if req.unit_supervisor_id != current_user_id:
        return jsonify({'error': 'شما به این درخواست دسترسی ندارید'}), 403
    
    if req.status != 'pending_unit':
        return jsonify({'error': 'این درخواست قبلاً بررسی شده است'}), 400
    
    # تأیید توسط سرپرست واحد
    req.status = 'pending_dept'
    req.reviewed_at = datetime.now()
    
    db.session.commit()
    
    # ارسال اعلان به کاربر
    requester = User.query.get(req.requester_id)
    send_notification(
        user_id=req.requester_id,
        title=f"✅ درخواست {REQUEST_TYPES[req.request_type]['name']} شما تأیید شد",
        message=f"درخواست شما توسط {user.get_full_name()} تأیید و به مدیر اداره ارسال شد.",
        link=f"/requests/{req.id}"
    )
    
    return jsonify({
        'success': True,
        'message': 'درخواست با موفقیت تأیید و به مدیر اداره ارسال شد'
    }), 200


@api_v1_bp.route('/requests/<int:request_id>/reject', methods=['POST'])
@jwt_required()
@unit_supervisor_required
def reject_request(request_id):
    """رد درخواست توسط سرپرست واحد"""
    req = Request.query.get_or_404(request_id)
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    # بررسی دسترسی سرپرست به این درخواست
    if req.unit_supervisor_id != current_user_id:
        return jsonify({'error': 'شما به این درخواست دسترسی ندارید'}), 403
    
    if req.status != 'pending_unit':
        return jsonify({'error': 'این درخواست قبلاً بررسی شده است'}), 400
    
    data = request.get_json()
    reason = data.get('reason', '').strip()
    
    req.status = 'rejected'
    req.reject_reason = reason
    req.reviewed_at = datetime.now()
    
    db.session.commit()
    
    # ارسال اعلان به کاربر
    send_notification(
        user_id=req.requester_id,
        title=f"❌ درخواست {REQUEST_TYPES[req.request_type]['name']} شما رد شد",
        message=f"درخواست شما توسط {user.get_full_name()} رد شد.\nدلیل: {reason or 'بدون توضیح'}",
        link=f"/requests/{req.id}"
    )
    
    return jsonify({
        'success': True,
        'message': 'درخواست با موفقیت رد شد'
    }), 200


@api_v1_bp.route('/requests/<int:request_id>/revision', methods=['POST'])
@jwt_required()
@unit_supervisor_required
def request_revision(request_id):
    """درخواست اصلاح توسط سرپرست واحد"""
    req = Request.query.get_or_404(request_id)
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    # بررسی دسترسی سرپرست به این درخواست
    if req.unit_supervisor_id != current_user_id:
        return jsonify({'error': 'شما به این درخواست دسترسی ندارید'}), 403
    
    if req.status != 'pending_unit':
        return jsonify({'error': 'این درخواست قبلاً بررسی شده است'}), 400
    
    data = request.get_json()
    revision_note = data.get('revision_note', '').strip()
    
    if not revision_note:
        return jsonify({'error': 'لطفاً توضیحات اصلاحی را وارد کنید'}), 400
    
    req.status = 'revision'
    req.revision_note = revision_note
    req.reviewed_at = datetime.now()
    
    db.session.commit()
    
    # ارسال اعلان به کاربر
    send_notification(
        user_id=req.requester_id,
        title=f"🔄 درخواست {REQUEST_TYPES[req.request_type]['name']} شما نیاز به اصلاح دارد",
        message=f"لطفاً درخواست خود را بر اساس نظر {user.get_full_name()} اصلاح کنید.\nتوضیحات: {revision_note}",
        link=f"/requests/{req.id}/edit"
    )
    
    return jsonify({
        'success': True,
        'message': 'درخواست برای اصلاح برگشت داده شد'
    }), 200