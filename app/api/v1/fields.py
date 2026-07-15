from flask import jsonify
from flask_jwt_extended import jwt_required
from app.api.v1 import api_v1_bp
from app.models import DynamicField

@api_v1_bp.route('/fields', methods=['GET'])
@jwt_required()
def get_fields():
    fields = DynamicField.query.filter_by(is_active=True).order_by(DynamicField.field_order).all()
    return jsonify([{
        'id': f.id,
        'title': f.title,
        'field_type': f.field_type,
        'is_required': f.is_required,
        'is_key': f.is_key
    } for f in fields])