from app.extensions import db
from flask_login import UserMixin

from datetime import datetime
import json
class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    notification_type = db.Column(db.String(30), default='workflow')
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    link = db.Column(db.String(500), nullable=True)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    # این 5 خط را اضافه کن
    request_id = db.Column(db.Integer, nullable=True)
    request_type = db.Column(db.String(20), nullable=True)
    personnel_national_code = db.Column(db.String(10), nullable=True)
    personnel_full_name = db.Column(db.String(100), nullable=True)
    admin_note = db.Column(db.Text, nullable=True)
    
    user = db.relationship('User', backref='notifications')
    
def apply_approval_request(req):
    """اعمال درخواست تایید شده"""
    data = json.loads(req.data) if req.data else {}
    
    if req.request_type == 'add':
        # ایجاد پرسنل جدید
        national_code = data.get('national_code')
        if national_code:
            # بررسی تکراری نبودن
            existing = Personnel.query.filter_by(national_code=national_code, is_deleted=False).first()
            if existing:
                return
        
        personnel = Personnel(
            national_code=national_code,
            first_name=data.get('first_name', ''),
            last_name=data.get('last_name', ''),
            phone=data.get('phone', ''),
            position=data.get('position', ''),
            hire_date=data.get('hire_date', ''),
            department_id=data.get('department_id'),
            unit_id=data.get('unit_id')
        )
        db.session.add(personnel)
        db.session.commit()
        
        # ذخیره فیلدهای داینامیک
        fields = DynamicField.query.filter_by(is_active=True).all()
        for field in fields:
            value = data.get(f'field_{field.id}')
            if value:
                pv = PersonnelValue(
                    personnel_id=personnel.id,
                    field_id=field.id,
                    value_text=value if field.field_type == 'text' else None,
                    value_number=float(value) if field.field_type in ['number', 'decimal'] and value else None,
                    value_date=value if field.field_type == 'date' else None
                )
                db.session.add(pv)
        db.session.commit()
        
    elif req.request_type == 'delete' and req.target_personnel_id:
        p = Personnel.query.get(req.target_personnel_id)
        if p:
            p.is_deleted = True
            db.session.commit()