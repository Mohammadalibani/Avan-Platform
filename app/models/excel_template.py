# app/models/excel_template.py
from app.extensions import db

class ExcelTemplate(db.Model):
    __tablename__ = 'excel_templates'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, default='قالب پیش‌فرض')
    header_bg_color = db.Column(db.String(7), default='#2c3e50')
    header_text_color = db.Column(db.String(7), default='#ffffff')
    even_row_color = db.Column(db.String(7), default='#f8f9fa')
    odd_row_color = db.Column(db.String(7), default='#ffffff')
    outer_border_style = db.Column(db.String(20), default='thick')
    vertical_border_style = db.Column(db.String(20), default='thin')
    horizontal_border_style = db.Column(db.String(20), default='dotted')
    border_color = db.Column(db.String(7), default='#000000')
    font_name = db.Column(db.String(50), default='B Nazanin')
    header_font_size = db.Column(db.Integer, default=12)
    data_font_size = db.Column(db.Integer, default=11)