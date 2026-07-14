from app.extensions import db
from flask_login import UserMixin

from datetime import datetime
import json
class Request(db.Model):
    """مدل پایه برای همه درخواست‌های پرسنل"""
    __tablename__ = 'requests'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # نوع درخواست
    request_type = db.Column(db.String(50), nullable=False)
    # مقادیر: overtime, deficiency, daily_mission, official_mission, arbaeen, annual_leave, hourly_leave
    
    # اطلاعات فرستنده و گیرنده
    requester_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    unit_supervisor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    # وضعیت‌ها: pending_unit (منتظر سرپرست), approved (تأیید نهایی), rejected (رد), revision (نیاز به اصلاح)
    status = db.Column(db.String(30), default='pending_unit')
    
    # تاریخ‌ها
    request_date = db.Column(db.DateTime, default=datetime.now)
    reviewed_at = db.Column(db.DateTime, nullable=True)
    
    # اطلاعات اصلاح و رد
    revision_note = db.Column(db.Text, nullable=True)
    reject_reason = db.Column(db.Text, nullable=True)
    
    # داده‌های اضافی (JSON)
    extra_data = db.Column(db.Text, nullable=True)
    
    # پیوست فایل
    attachment = db.Column(db.String(500), nullable=True)
    attachment_filename = db.Column(db.String(200), nullable=True)
    
    # روابط
    requester = db.relationship('User', foreign_keys=[requester_id], backref='sent_requests')
    unit_supervisor = db.relationship('User', foreign_keys=[unit_supervisor_id], backref='received_requests')
    
    def get_extra_data(self):
        """دریافت داده‌های اضافی به صورت دیکشنری"""
        if self.extra_data:
            return json.loads(self.extra_data)
        return {}
    
    def set_extra_data(self, data):
        """ذخیره داده‌های اضافی"""
        self.extra_data = json.dumps(data, ensure_ascii=False)
    
    def get_status_persian(self):
        """دریافت وضعیت به فارسی"""
        status_map = {
            'pending_unit': '⏳ در انتظار تایید سرپرست',
            'approved': '✅ تایید شده',
            'rejected': '❌ رد شده',
            'revision': '🔄 نیاز به اصلاح دارد'
        }
        return status_map.get(self.status, self.status)
    
    def get_request_type_persian(self):
        """دریافت نوع درخواست به فارسی"""
        type_map = {
            'overtime': 'اضافه کار ساعتی',
            'deficiency': 'ثبت نواقص',
            'daily_mission': 'ماموریت روزانه',
            'official_mission': 'ماموریت اداری',
            'arbaeen': 'سفر اربعین',
            'annual_leave': 'مرخصی روزانه',
            'hourly_leave': 'مرخصی ساعتی'
        }
        return type_map.get(self.request_type, self.request_type)
    
    def to_dict(self):
        """تبدیل به دیکشنری برای JSON"""
        extra = self.get_extra_data()
        return {
            'id': self.id,
            'request_type': self.request_type,
            'request_type_persian': self.get_request_type_persian(),
            'requester_id': self.requester_id,
            'requester_name': self.requester.get_full_name() if self.requester else '-',
            'status': self.status,
            'status_persian': self.get_status_persian(),
            'request_date': self.request_date.strftime('%Y/%m/%d %H:%M'),
            'reviewed_at': self.reviewed_at.strftime('%Y/%m/%d %H:%M') if self.reviewed_at else None,
            'revision_note': self.revision_note,
            'reject_reason': self.reject_reason,
            'extra_data': extra,
            'has_attachment': bool(self.attachment)
        }