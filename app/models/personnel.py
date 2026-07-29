# app/models/personnel.py
from datetime import datetime
from app.extensions import db
from app.models.base import BaseModel

# ============================================================
# مدل پرسنل
# ============================================================
class Personnel(BaseModel):
    """مدل پرسنل"""
    __tablename__ = 'personnel'
    
    national_code = db.Column(db.String(10), unique=True, nullable=False)
    first_name = db.Column(db.String(50), nullable=True)
    last_name = db.Column(db.String(50), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    position = db.Column(db.String(100), nullable=True)
    hire_date = db.Column(db.String(20), nullable=True)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=True)
    unit_id = db.Column(db.Integer, db.ForeignKey('units.id'), nullable=False)
    period_id = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    is_deleted = db.Column(db.Boolean, default=False)
    
    # روابط
    department = db.relationship('Department', backref='personnel_list', foreign_keys=[department_id])
    unit = db.relationship('Unit', backref='personnel_list', foreign_keys=[unit_id])
    
    def get_full_name(self):
        """دریافت نام کامل"""
        return f"{self.first_name or ''} {self.last_name or ''}".strip()
    
    def to_dict(self):
        """تبدیل به دیکشنری"""
        return {
            'id': self.id,
            'national_code': self.national_code,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': self.get_full_name(),
            'phone': self.phone,
            'position': self.position,
            'hire_date': self.hire_date,
            'department_id': self.department_id,
            'unit_id': self.unit_id,
            'period_id': self.period_id,
            'is_deleted': self.is_deleted,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
    
    def __repr__(self):
        return f'<Personnel {self.national_code}>'


# ============================================================
# مدل انتصاب پرسنل (تاریخچه)
# ============================================================
class PersonnelAssignment(BaseModel):
    """مدل انتصاب پرسنل به واحدها (با تاریخچه)"""
    __tablename__ = 'personnel_assignments'
    
    personnel_id = db.Column(db.Integer, db.ForeignKey('personnel.id'), nullable=False)
    unit_id = db.Column(db.Integer, db.ForeignKey('units.id'), nullable=False)
    period_id = db.Column(db.Integer, db.ForeignKey('work_periods.id'), nullable=True)
    
    # نوع انتصاب: 'initial' (اولیه), 'transfer' (انتقال), 'promotion' (ارتقا)
    assignment_type = db.Column(db.String(30), default='initial')
    
    # تاریخ شروع انتصاب
    start_date = db.Column(db.String(20), nullable=False)
    
    # تاریخ پایان انتصاب (برای انتصابات قبلی)
    end_date = db.Column(db.String(20), nullable=True)
    
    # آیا انتصاب فعلی فعال است؟
    is_active = db.Column(db.Boolean, default=True)
    
    # توضیحات (دلیل انتقال، ارتقا، ...)
    description = db.Column(db.Text, nullable=True)
    
    # ثبت‌کننده - با ForeignKey صحیح به user
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # روابط با foreign_keys مشخص
    personnel = db.relationship('Personnel', backref='assignments', foreign_keys=[personnel_id])
    unit = db.relationship('Unit', foreign_keys=[unit_id])
    period = db.relationship('WorkPeriod', foreign_keys=[period_id])
    creator = db.relationship('User', foreign_keys=[created_by])  # ← اصلاح شده
    
    def to_dict(self):
        """تبدیل به دیکشنری"""
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
            'created_at': self.created_at.strftime('%Y/%m/%d %H:%M') if self.created_at else None,
        }
    
    def __repr__(self):
        return f'<PersonnelAssignment {self.personnel_id} -> {self.unit_id}>'


# ============================================================
# مدل وضعیت کارکرد پرسنل
# ============================================================
class PersonnelWorkStatus(BaseModel):
    """مدل وضعیت کارکرد پرسنل"""
    __tablename__ = 'personnel_work_status'
    
    personnel_id = db.Column(db.Integer, db.ForeignKey('personnel.id'), nullable=False)
    period_id = db.Column(db.Integer, db.ForeignKey('work_periods.id'), nullable=False)
    
    # وضعیت‌ها: draft, unit_pending, dept_pending, org_pending, org_approved, revision
    status = db.Column(db.String(30), default='draft')
    
    # زمان‌های تایید
    unit_approved_at = db.Column(db.DateTime, nullable=True)
    dept_approved_at = db.Column(db.DateTime, nullable=True)
    org_approved_at = db.Column(db.DateTime, nullable=True)
    
    # تاییدکنندگان
    unit_approver_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    dept_approver_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    org_approver_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    
    # اطلاعات اصلاح
    revision_note = db.Column(db.Text, nullable=True)
    revision_from_role = db.Column(db.String(30), nullable=True)
    revision_from_user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    
    # روابط
    personnel = db.relationship('Personnel', backref='work_statuses', foreign_keys=[personnel_id])
    period = db.relationship('WorkPeriod', backref='work_statuses', foreign_keys=[period_id])
    unit_approver = db.relationship('User', foreign_keys=[unit_approver_id])
    dept_approver = db.relationship('User', foreign_keys=[dept_approver_id])
    org_approver = db.relationship('User', foreign_keys=[org_approver_id])
    
    __table_args__ = (
        db.UniqueConstraint('personnel_id', 'period_id', name='unique_personnel_period_work'),
    )
    
    def to_dict(self):
        """تبدیل به دیکشنری"""
        return {
            'id': self.id,
            'personnel_id': self.personnel_id,
            'period_id': self.period_id,
            'status': self.status,
            'status_persian': {
                'draft': 'پیش‌نویس',
                'unit_pending': 'در انتظار تایید مدیر اداره',
                'dept_pending': 'در انتظار تایید مدیر سازمان',
                'org_approved': 'تایید نهایی شده',
                'revision': 'نیاز به اصلاح دارد'
            }.get(self.status, self.status),
            'unit_approved_at': self.unit_approved_at.isoformat() if self.unit_approved_at else None,
            'dept_approved_at': self.dept_approved_at.isoformat() if self.dept_approved_at else None,
            'org_approved_at': self.org_approved_at.isoformat() if self.org_approved_at else None,
            'revision_note': self.revision_note,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
    
    def __repr__(self):
        return f'<PersonnelWorkStatus {self.personnel_id} - {self.status}>'


# ============================================================
# مدل پیام‌های اصلاح کارکرد
# ============================================================
class WorkRevisionMessage(BaseModel):
    """مدل پیام‌های اصلاح کارکرد"""
    __tablename__ = 'work_revision_messages'
    
    work_status_id = db.Column(db.Integer, db.ForeignKey('personnel_work_status.id'), nullable=False)
    personnel_id = db.Column(db.Integer, db.ForeignKey('personnel.id'), nullable=False)
    period_id = db.Column(db.Integer, db.ForeignKey('work_periods.id'), nullable=False)
    
    from_role = db.Column(db.String(30), nullable=False)
    from_user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    to_role = db.Column(db.String(30), nullable=False)
    to_user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    message = db.Column(db.Text, nullable=False)
    message_type = db.Column(db.String(30), default='general')
    is_read = db.Column(db.Boolean, default=False)
    
    # روابط
    work_status = db.relationship('PersonnelWorkStatus', backref='revision_messages', foreign_keys=[work_status_id])
    personnel = db.relationship('Personnel', foreign_keys=[personnel_id])
    period = db.relationship('WorkPeriod', foreign_keys=[period_id])
    from_user = db.relationship('User', foreign_keys=[from_user_id])
    to_user = db.relationship('User', foreign_keys=[to_user_id])
    
    def to_dict(self):
        """تبدیل به دیکشنری"""
        return {
            'id': self.id,
            'work_status_id': self.work_status_id,
            'personnel_id': self.personnel_id,
            'personnel_name': self.personnel.get_full_name() if self.personnel else '-',
            'period_id': self.period_id,
            'period_title': self.period.title if self.period else '-',
            'from_role': self.from_role,
            'from_user_id': self.from_user_id,
            'from_user_name': self.from_user.get_full_name() if self.from_user else '-',
            'to_role': self.to_role,
            'to_user_id': self.to_user_id,
            'message': self.message,
            'message_type': self.message_type,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
    
    def __repr__(self):
        return f'<WorkRevisionMessage {self.id}>'