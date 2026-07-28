# app/models/setting.py
from app.extensions import db
from app.models.base import BaseModel
import json

class Setting(BaseModel):
    __tablename__ = 'settings'
    
    key = db.Column(db.String(100), unique=True, nullable=False)
    value = db.Column(db.Text, nullable=True)
    
    @staticmethod
    def get(key, default=None):
        setting = Setting.query.filter_by(key=key).first()
        if setting:
            try:
                return json.loads(setting.value)
            except:
                return setting.value
        return default
    
    @staticmethod
    def set(key, value):
        setting = Setting.query.filter_by(key=key).first()
        if setting:
            setting.value = json.dumps(value) if isinstance(value, (dict, list)) else str(value)
        else:
            setting = Setting(key=key, value=json.dumps(value) if isinstance(value, (dict, list)) else str(value))
            db.session.add(setting)
        db.session.commit()