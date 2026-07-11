# E:\Avan-Platform\models.py

from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime
import json

db = SQLAlchemy()


# ============================================================
# مدل کاربر
# ============================================================
class User(UserMixin, db.Model):
    __tablename__ = 'users'
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(10), unique=True, nullable=False)
    national_code = db.Column(db.String(10), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    phone = db.Column(db.String(20))
    role = db.Column(db.String(30), nullable=False)
    personnel_code = db.Column(db.String(20))
    is_active = db.Column(db.Boolean, default=True)
    is_approved = db.Column(db.Boolean, default=True)
    profile_picture = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.now)
    last_login = db.Column(db.DateTime)

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def get_role_persian(self):
        roles = {
            'admin': 'مدیر کل سیستم',
            'org_manager': 'مدیر سازمان',
            'dept_manager': 'مدیر اداره',
            'hr_manager': 'مدیر منابع انسانی',
            'unit_supervisor': 'سرپرست واحد',
            'subordinate': 'کاربر عادی'
        }
        return roles.get(self.role, 'کاربر عادی')

    def get_jalali_created_date(self):
        if not self.created_at:
            return '-'
        try:
            import jdatetime
            jalali = jdatetime.datetime.fromgregorian(datetime=self.created_at)
            return jalali.strftime('%Y/%m/%d')
        except:
            return self.created_at.strftime('%Y/%m/%d')

    def to_dict(self):
        return {
            'id': self.id,
            'national_code': self.national_code,
            'full_name': self.get_full_name(),
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone': self.phone,
            'role': self.role,
            'role_persian': self.get_role_persian(),
            'personnel_code': self.personnel_code,
            'profile_picture': self.profile_picture,
            'is_active': self.is_active,
            'is_approved': self.is_approved,
            'created_at': self.created_at.strftime('%Y/%m/%d %H:%M') if self.created_at else None,
            'last_login': self.last_login.strftime('%Y/%m/%d %H:%M') if self.last_login else None
        }


# ============================================================
# مدل اداره
# ============================================================
class Department(db.Model):
    __tablename__ = 'departments'
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    color = db.Column(db.String(7))
    description = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.now)

    def get_jalali_created_date(self):
        if not self.created_at:
            return '-'
        try:
            import jdatetime
            jalali = jdatetime.datetime.fromgregorian(datetime=self.created_at)
            return jalali.strftime('%Y/%m/%d')
        except:
            return self.created_at.strftime('%Y/%m/%d')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'color': self.color,
            'description': self.description,
            'created_at': self.created_at.strftime('%Y/%m/%d') if self.created_at else None
        }


# ============================================================
# مدل واحد
# ============================================================
class Unit(db.Model):
    __tablename__ = 'units'
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=False)
    description = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.now)
    needs_approval = db.Column(db.Boolean, default=True)

    def get_jalali_created_date(self):
        if not self.created_at:
            return '-'
        try:
            import jdatetime
            jalali = jdatetime.datetime.fromgregorian(datetime=self.created_at)
            return jalali.strftime('%Y/%m/%d')
        except:
            return self.created_at.strftime('%Y/%m/%d')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'department_id': self.department_id,
            'description': self.description,
            'created_at': self.created_at.strftime('%Y/%m/%d') if self.created_at else None,
            'needs_approval': self.needs_approval
        }


# ============================================================
# مدل پرسنل
# ============================================================
class Personnel(db.Model):
    __tablename__ = 'personnel'
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.Integer, primary_key=True)
    national_code = db.Column(db.String(10), nullable=False)
    first_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50))
    phone = db.Column(db.String(20))
    position = db.Column(db.String(100))
    department_id = db.Column(db.Integer)
    unit_id = db.Column(db.Integer, db.ForeignKey('units.id'), nullable=False)
    period_id = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    dynamic_values = db.Column(db.Text, default='{}')
    is_complete = db.Column(db.Boolean, default=False)

    def get_dynamic_values(self):
        try:
            return json.loads(self.dynamic_values) if self.dynamic_values else {}
        except:
            return {}

    def set_dynamic_values(self, values):
        self.dynamic_values = json.dumps(values, ensure_ascii=False)

    def get_full_name(self):
        if self.first_name or self.last_name:
            return f"{self.first_name or ''} {self.last_name or ''}".strip()
        return self.national_code

    def to_dict(self):
        unit_name = None
        if hasattr(self, 'unit') and self.unit:
            unit_name = self.unit.name

        return {
            'id': self.id,
            'national_code': self.national_code,
            'full_name': self.get_full_name(),
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone': self.phone,
            'position': self.position,
            'unit_id': self.unit_id,
            'unit_name': unit_name,
            'period_id': self.period_id,
            'is_complete': self.is_complete,
            'dynamic_values': self.get_dynamic_values(),
            'created_at': self.created_at.strftime('%Y/%m/%d') if self.created_at else None,
            'updated_at': self.updated_at.strftime('%Y/%m/%d %H:%M') if self.updated_at else None
        }


# ============================================================
# مدل وضعیت کارکرد پرسنل
# ============================================================
class PersonnelWorkStatus(db.Model):
    __tablename__ = 'personnel_work_status'
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.Integer, primary_key=True)
    personnel_id = db.Column(db.Integer, db.ForeignKey('personnel.id'), nullable=False)
    period_id = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(30), default='draft')
    unit_approved_at = db.Column(db.DateTime)
    dept_approved_at = db.Column(db.DateTime)
    org_approved_at = db.Column(db.DateTime)
    unit_approver_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    dept_approver_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    org_approver_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    revision_note = db.Column(db.Text)
    revision_from_role = db.Column(db.String(30))
    revision_from_user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    def to_dict(self):
        return {
            'id': self.id,
            'personnel_id': self.personnel_id,
            'period_id': self.period_id,
            'status': self.status,
            'revision_note': self.revision_note,
            'created_at': self.created_at.strftime('%Y/%m/%d %H:%M') if self.created_at else None,
            'updated_at': self.updated_at.strftime('%Y/%m/%d %H:%M') if self.updated_at else None
        }


# ============================================================
# مدل تیکت
# ============================================================
class Ticket(db.Model):
    __tablename__ = 'tickets'
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(20), default='open')
    priority = db.Column(db.String(20), default='normal')
    message_type = db.Column(db.String(20), default='ticket')
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    replies = db.relationship('TicketReply', backref='ticket', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'message': self.message,
            'sender_id': self.sender_id,
            'sender_name': self.sender.get_full_name() if self.sender else None,
            'receiver_id': self.receiver_id,
            'receiver_name': self.receiver.get_full_name() if self.receiver else None,
            'status': self.status,
            'priority': self.priority,
            'message_type': self.message_type,
            'created_at': self.created_at.strftime('%Y/%m/%d %H:%M') if self.created_at else None,
            'updated_at': self.updated_at.strftime('%Y/%m/%d %H:%M') if self.updated_at else None,
            'reply_count': len(self.replies)
        }


# ============================================================
# مدل پاسخ تیکت
# ============================================================
class TicketReply(db.Model):
    __tablename__ = 'ticket_replies'
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey('tickets.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_admin_reply = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.now)

    user = db.relationship('User', backref='ticket_replies')

    def to_dict(self):
        return {
            'id': self.id,
            'ticket_id': self.ticket_id,
            'user_id': self.user_id,
            'user_name': self.user.get_full_name() if self.user else None,
            'message': self.message,
            'is_admin_reply': self.is_admin_reply,
            'created_at': self.created_at.strftime('%Y/%m/%d %H:%M') if self.created_at else None
        }


# ============================================================
# مدل اعلان
# ============================================================
class Notification(db.Model):
    __tablename__ = 'notifications'
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    notification_type = db.Column(db.String(30), default='general')
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    link = db.Column(db.String(500))
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.now)
    request_id = db.Column(db.Integer)
    request_type = db.Column(db.String(20))
    personnel_national_code = db.Column(db.String(10))
    personnel_full_name = db.Column(db.String(100))
    admin_note = db.Column(db.Text)

    user = db.relationship('User', backref='notifications')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'message': self.message,
            'link': self.link,
            'is_read': self.is_read,
            'created_at': self.created_at.strftime('%Y/%m/%d %H:%M') if self.created_at else None
        }


# ============================================================
# مدل اعلان سراسری
# ============================================================
class Announcement(db.Model):
    __tablename__ = 'global_announcements'
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200))
    message = db.Column(db.Text, nullable=False)
    icon = db.Column(db.String(50), default='📢')
    bg_color = db.Column(db.String(20), default='rgba(59, 130, 246, 0.12)')
    border_color = db.Column(db.String(20), default='rgba(59, 130, 246, 0.3)')
    text_color = db.Column(db.String(20), default='#1e293b')
    is_active = db.Column(db.Boolean, default=True)
    priority = db.Column(db.Integer, default=0)
    start_date = db.Column(db.String(20))
    end_date = db.Column(db.String(20))
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    creator = db.relationship('User', backref='announcements')

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'message': self.message,
            'icon': self.icon,
            'bg_color': self.bg_color,
            'border_color': self.border_color,
            'text_color': self.text_color,
            'is_active': self.is_active,
            'priority': self.priority,
            'start_date': self.start_date,
            'end_date': self.end_date,
            'created_by': self.creator.get_full_name() if self.creator else None,
            'created_at': self.created_at.strftime('%Y/%m/%d %H:%M') if self.created_at else None
        }


# ============================================================
# مدل درخواست (پرسنل - برای کاربران)
# ============================================================
class Request(db.Model):
    __tablename__ = 'requests'
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.Integer, primary_key=True)
    request_type = db.Column(db.String(50), nullable=False)
    requester_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    unit_supervisor_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    status = db.Column(db.String(30), default='pending_unit')
    request_date = db.Column(db.DateTime, default=datetime.now)
    reviewed_at = db.Column(db.DateTime)
    revision_note = db.Column(db.Text)
    reject_reason = db.Column(db.Text)
    extra_data = db.Column(db.Text, default='{}')
    attachment = db.Column(db.String(500))
    attachment_filename = db.Column(db.String(200))

    requester = db.relationship('User', foreign_keys=[requester_id], backref='requests_made')
    supervisor = db.relationship('User', foreign_keys=[unit_supervisor_id], backref='requests_reviewed')

    def get_extra_data(self):
        try:
            return json.loads(self.extra_data) if self.extra_data else {}
        except:
            return {}

    def set_extra_data(self, data):
        self.extra_data = json.dumps(data, ensure_ascii=False)

    def get_request_type_persian(self):
        types = {
            'overtime': 'اضافه کار ساعتی',
            'deficiency': 'ثبت نواقص',
            'annual_leave': 'مرخصی روزانه',
            'hourly_leave': 'مرخصی ساعتی',
            'daily_mission': 'ماموریت روزانه',
            'official_mission': 'ماموریت اداری',
            'arbaeen': 'سفر اربعین'
        }
        return types.get(self.request_type, self.request_type)

    def get_status_persian(self):
        statuses = {
            'pending_unit': 'در انتظار تایید سرپرست واحد',
            'pending_dept': 'در انتظار تایید مدیر اداره',
            'pending_org': 'در انتظار تایید مدیر سازمان',
            'approved': 'تایید شده',
            'rejected': 'رد شده',
            'revision': 'نیاز به اصلاح'
        }
        return statuses.get(self.status, self.status)

    def to_dict(self):
        return {
            'id': self.id,
            'request_type': self.request_type,
            'request_type_persian': self.get_request_type_persian(),
            'requester_id': self.requester_id,
            'requester_name': self.requester.get_full_name() if self.requester else None,
            'status': self.status,
            'status_persian': self.get_status_persian(),
            'request_date': self.request_date.strftime('%Y/%m/%d %H:%M') if self.request_date else None,
            'revision_note': self.revision_note,
            'reject_reason': self.reject_reason,
            'extra_data': self.get_extra_data(),
            'attachment': self.attachment,
            'attachment_filename': self.attachment_filename
        }


# ============================================================
# مدل درخواست تایید (افزودن/حذف پرسنل)
# ============================================================
class ApprovalRequest(db.Model):
    __tablename__ = 'approval_requests'
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.Integer, primary_key=True)
    request_type = db.Column(db.String(20), nullable=False)
    requester_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    reviewer_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    target_personnel_id = db.Column(db.Integer, db.ForeignKey('personnel.id'))
    data = db.Column(db.Text, default='{}')
    requester_note = db.Column(db.Text)
    admin_note = db.Column(db.Text)
    status = db.Column(db.String(20), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.now)
    reviewed_at = db.Column(db.DateTime)

    requester = db.relationship('User', foreign_keys=[requester_id], backref='approvals_requested')
    reviewer = db.relationship('User', foreign_keys=[reviewer_id], backref='approvals_reviewed')
    target = db.relationship('Personnel', foreign_keys=[target_personnel_id], backref='approvals')

    def to_dict(self):
        return {
            'id': self.id,
            'request_type': self.request_type,
            'requester_id': self.requester_id,
            'requester_name': self.requester.get_full_name() if self.requester else None,
            'status': self.status,
            'data': json.loads(self.data) if self.data else {},
            'requester_note': self.requester_note,
            'admin_note': self.admin_note,
            'created_at': self.created_at.strftime('%Y/%m/%d %H:%M') if self.created_at else None,
            'reviewed_at': self.reviewed_at.strftime('%Y/%m/%d %H:%M') if self.reviewed_at else None
        }


# ============================================================
# مدل مدرک
# ============================================================
class Document(db.Model):
    __tablename__ = 'user_documents'
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    doc_type = db.Column(db.String(50), nullable=False)
    doc_title = db.Column(db.String(100))
    doc_filename = db.Column(db.String(200), nullable=False)
    doc_original_name = db.Column(db.String(200))
    doc_size = db.Column(db.Integer, default=0)
    status = db.Column(db.String(20), default='pending')
    admin_note = db.Column(db.Text)
    reviewed_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    reviewed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    user = db.relationship('User', foreign_keys=[user_id], backref='documents')
    reviewer = db.relationship('User', foreign_keys=[reviewed_by], backref='reviewed_documents')

    def get_status_persian(self):
        statuses = {
            'pending': 'در انتظار تایید',
            'approved': 'تایید شده',
            'rejected': 'رد شده'
        }
        return statuses.get(self.status, self.status)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_name': self.user.get_full_name() if self.user else None,
            'doc_type': self.doc_type,
            'doc_title': self.doc_title,
            'doc_filename': self.doc_filename,
            'doc_original_name': self.doc_original_name,
            'doc_size': self.doc_size,
            'status': self.status,
            'status_persian': self.get_status_persian(),
            'admin_note': self.admin_note,
            'created_at': self.created_at.strftime('%Y/%m/%d %H:%M') if self.created_at else None
        }


# ============================================================
# مدل انتصاب مدیر اداره
# ============================================================
class DeptManagerAssignment(db.Model):
    __tablename__ = 'department_managers'
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.Integer, primary_key=True)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    department = db.relationship('Department', backref='managers')
    user = db.relationship('User', backref='dept_manager_assignments')

    def to_dict(self):
        return {
            'id': self.id,
            'department_id': self.department_id,
            'department_name': self.department.name if self.department else None,
            'user_id': self.user_id,
            'user_name': self.user.get_full_name() if self.user else None
        }


# ============================================================
# مدل انتصاب سرپرست واحد
# ============================================================
class UnitSupervisorAssignment(db.Model):
    __tablename__ = 'unit_supervisors'
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.Integer, primary_key=True)
    unit_id = db.Column(db.Integer, db.ForeignKey('units.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    unit = db.relationship('Unit', backref='supervisors')
    user = db.relationship('User', backref='unit_supervisor_assignments')

    def to_dict(self):
        return {
            'id': self.id,
            'unit_id': self.unit_id,
            'unit_name': self.unit.name if self.unit else None,
            'user_id': self.user_id,
            'user_name': self.user.get_full_name() if self.user else None
        }


# ============================================================
# مدل لاگ فعالیت
# ============================================================
class ActivityLog(db.Model):
    __tablename__ = 'activity_logs'
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    user_name = db.Column(db.String(100))
    message = db.Column(db.Text, nullable=False)
    badge = db.Column(db.String(50))
    log_type = db.Column(db.String(30))
    created_at = db.Column(db.DateTime, default=datetime.now)

    user = db.relationship('User', backref='activity_logs')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_name': self.user_name or (self.user.get_full_name() if self.user else None),
            'message': self.message,
            'badge': self.badge,
            'log_type': self.log_type,
            'created_at': self.created_at.strftime('%Y/%m/%d %H:%M:%S') if self.created_at else None
        }