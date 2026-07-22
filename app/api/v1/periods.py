from flask import jsonify
from flask_jwt_extended import jwt_required
from app.api.v1 import api_v1_bp
from app.models import WorkPeriod

@api_v1_bp.route('/periods', methods=['GET'])
@jwt_required()
def get_periods():
    periods = WorkPeriod.query.order_by(WorkPeriod.start_date.desc()).all()
    return jsonify([{
        'id': p.id,
        'title': p.title,
        'start_date': p.start_date,
        'end_date': p.end_date,
        'is_active': p.is_active
    } for p in periods])