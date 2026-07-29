# app/blueprints/report_routes.py
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.personnel import Personnel
from app.models.request import Request
from app.models.work_period import WorkPeriod
from app.models.department import Department
from app.models.unit import Unit
from app.services.excel_service import ExcelService
from app.decorators import role_required
from io import BytesIO
from datetime import datetime

report_bp = Blueprint('report', __name__, url_prefix='/api/reports')


@report_bp.route('/personnel/export', methods=['GET'])
@jwt_required()
def export_personnel():
    """خروجی اکسل پرسنل"""
    try:
        # دریافت پارامترها
        period_id = request.args.get('period_id', type=int)
        department_id = request.args.get('department_id', type=int)
        unit_id = request.args.get('unit_id', type=int)
        
        # دریافت داده‌ها
        query = Personnel.query.filter_by(is_deleted=False)
        
        if period_id:
            query = query.filter_by(period_id=period_id)
        if department_id:
            query = query.filter_by(department_id=department_id)
        if unit_id:
            query = query.filter_by(unit_id=unit_id)
        
        personnel = query.all()
        
        # تبدیل به لیست دیکشنری
        data = []
        for p in personnel:
            dept = Department.query.get(p.department_id)
            unit = Unit.query.get(p.unit_id)
            period = WorkPeriod.query.get(p.period_id)
            
            data.append({
                'national_code': p.national_code,
                'first_name': p.first_name or '',
                'last_name': p.last_name or '',
                'full_name': p.get_full_name(),
                'phone': p.phone or '',
                'position': p.position or '',
                'department_name': dept.name if dept else '-',
                'unit_name': unit.name if unit else '-',
                'period_title': period.title if period else '-',
                'created_at': p.created_at.isoformat() if p.created_at else '',
            })
        
        # ستون‌های گزارش
        columns = [
            {'key': 'national_code', 'title': 'کد ملی'},
            {'key': 'full_name', 'title': 'نام و نام خانوادگی'},
            {'key': 'phone', 'title': 'شماره تماس'},
            {'key': 'position', 'title': 'سمت'},
            {'key': 'department_name', 'title': 'اداره'},
            {'key': 'unit_name', 'title': 'واحد'},
            {'key': 'period_title', 'title': 'دوره'},
            {'key': 'created_at', 'title': 'تاریخ ثبت', 'type': 'date'},
        ]
        
        # ایجاد فایل اکسل
        excel_service = ExcelService()
        output = excel_service.create_personnel_report(data, columns, "گزارش پرسنل")
        
        # ارسال فایل
        filename = f"personnel_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        return send_file(
            output,
            as_attachment=True,
            download_name=filename,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@report_bp.route('/requests/export', methods=['GET'])
@jwt_required()
def export_requests():
    """خروجی اکسل درخواست‌ها"""
    try:
        status = request.args.get('status')
        
        query = Request.query
        if status:
            query = query.filter_by(status=status)
        
        requests = query.order_by(Request.created_at.desc()).all()
        
        data = [r.to_dict() for r in requests]
        
        excel_service = ExcelService()
        output = excel_service.create_requests_report(data, "گزارش درخواست‌ها")
        
        filename = f"requests_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        return send_file(
            output,
            as_attachment=True,
            download_name=filename,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500