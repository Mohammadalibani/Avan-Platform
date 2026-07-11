# E:\Avan-Platform\services.py

from models import db, User, Department, Unit, Personnel
from werkzeug.security import generate_password_hash, check_password_hash

class UserService:
    @staticmethod
    def get_by_id(user_id):
        return User.query.get(user_id)
    
    @staticmethod
    def get_by_national_code(national_code):
        return User.query.filter_by(national_code=national_code).first()
    
    @staticmethod
    def create(data):
        password = data.get('password') or data.get('national_code', '')[-4:]
        user = User(
            username=data.get('national_code'),
            national_code=data.get('national_code'),
            first_name=data.get('first_name'),
            last_name=data.get('last_name'),
            phone=data.get('phone', ''),
            role=data.get('role', 'subordinate'),
            personnel_code=data.get('personnel_code', ''),
            password_hash=generate_password_hash(password)
        )
        db.session.add(user)
        db.session.commit()
        return user

class PersonnelService:
    @staticmethod
    def create(data):
        personnel = Personnel(
            national_code=data.get('national_code'),
            period_id=data.get('period_id'),
            unit_id=data.get('unit_id'),
            first_name=data.get('first_name', ''),
            last_name=data.get('last_name', ''),
            phone=data.get('phone', ''),
            position=data.get('position', '')
        )
        # مقادیر داینامیک
        dynamic = {}
        for key, value in data.items():
            if key not in ['national_code', 'period_id', 'unit_id', 'first_name', 'last_name', 'phone', 'position']:
                dynamic[key] = value
        personnel.set_dynamic_values(dynamic)
        db.session.add(personnel)
        db.session.commit()
        return personnel