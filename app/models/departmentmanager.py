from app.extensions import db
from flask_login import UserMixin

class DepartmentManager(db.Model):
    __tablename__ = 'department_managers'
    id = db.Column(db.Integer, primary_key=True)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)