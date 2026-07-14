from app.extensions import db
from flask_login import UserMixin

class UnitSupervisor(db.Model):
    __tablename__ = 'unit_supervisors'
    id = db.Column(db.Integer, primary_key=True)
    unit_id = db.Column(db.Integer, db.ForeignKey('units.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)