from app.extensions import db
from flask_login import UserMixin

from datetime import datetime
class PersonnelAssignment(db.Model):
    """مدل انتصاب پرسنل به واحدها (با قابلیت انتقال و تاریخچه)"""
    __tablename__ = 'personnel_assignments'
    
    id = db.Column(db.Integer, primary_key=True)
    personnel_id = db.Column(db.Integer, db.ForeignKey('personnel.id'), nullable=False)
    unit_id = db.Column(db.Integer, db.ForeignKey('units.id'), nullable=False)
    period_id = db.Column(db.Integer, db.ForeignKey('work_periods.id'), nullable=True)
    
    # نوع انتصاب: 'initial' (اولیه), 'transfer' (انتقال), 'promotion' (ارتقا)
    assignment_type = db.Column(db.String(30), default='initial')
    
    # تاریخ شروع انتصاب
    start_date = db.Column(db.String(20), nullable=False)  # تاریخ شمسی
    
    # تاریخ پایان انتصاب (برای انتصابات قبلی)
    end_date = db.Column(db.String(20), nullable=True)
    
    # آیا انتصاب فعلی فعال است؟
    is_active = db.Column(db.Boolean, default=True)
    
    # توضیحات (دلیل انتقال، ارتقا، ...)
    description = db.Column(db.Text, nullable=True)
    
    # ثبت‌کننده
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    # روابط
    personnel = db.relationship('Personnel', backref='assignments')
    unit = db.relationship('Unit')
    period = db.relationship('WorkPeriod')
    creator = db.relationship('User', foreign_keys=[created_by])
    
    def to_dict(self):
        return {
            'id': self.id,
            'personnel_id': self.personnel_id,
            'personnel_name': self.personnel.get_full_name() if self.personnel else '-',
            'unit_id': self.unit_id,
            'unit_name': self.unit.name if self.unit else '-',
            'department_id': self.unit.department_id if self.unit else None,
            'department_name': self.unit.department.name if self.unit and self.unit.department else '-',
            'period_id': self.period_id,
            'period_title': self.period.title if self.period else '-',
            'assignment_type': self.assignment_type,
            'assignment_type_persian': {
                'initial': 'انتصاب اولیه',
                'transfer': 'انتقال',
                'promotion': 'ارتقا'
            }.get(self.assignment_type, self.assignment_type),
            'start_date': self.start_date,
            'end_date': self.end_date,
            'is_active': self.is_active,
            'description': self.description,
            'created_by_name': self.creator.get_full_name() if self.creator else '-',
            'created_at': self.created_at.strftime('%Y/%m/%d %H:%M')
        }