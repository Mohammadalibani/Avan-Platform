# app/models/setting.py
from app.extensions import db
from app.models.base import BaseModel
import json

class Setting(BaseModel):
    """مدل تنظیمات سیستم"""
    __tablename__ = 'setting'
    
    key = db.Column(db.String(100), unique=True, nullable=False)
    value = db.Column(db.Text, nullable=False, default='{}')
    category = db.Column(db.String(50), default='general')
    is_public = db.Column(db.Boolean, default=False)
    
    @classmethod
    def get(cls, key, default=None):
        """دریافت مقدار یک تنظیم"""
        setting = cls.query.filter_by(key=key).first()
        if setting:
            try:
                return json.loads(setting.value)
            except:
                return setting.value
        return default
    
    @classmethod
    def set(cls, key, value, category='general', is_public=False):
        """تنظیم مقدار یک تنظیم"""
        setting = cls.query.filter_by(key=key).first()
        if setting:
            setting.value = json.dumps(value) if not isinstance(value, str) else value
            setting.category = category
            setting.is_public = is_public
        else:
            setting = cls(
                key=key,
                value=json.dumps(value) if not isinstance(value, str) else value,
                category=category,
                is_public=is_public
            )
            db.session.add(setting)
        db.session.commit()
        return setting
    
    def to_dict(self):
        return {
            'id': self.id,
            'key': self.key,
            'value': json.loads(self.value) if self.value.startswith('{') else self.value,
            'category': self.category,
            'is_public': self.is_public,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
    
    def __repr__(self):
        return f'<Setting {self.key}={self.value[:50]}>'