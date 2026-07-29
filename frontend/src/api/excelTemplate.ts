// frontend/src/api/excelTemplate.ts
import api from './axios';
import { ApiResponse } from '../types';

export interface ExcelTemplate {
    id: number;
    name: string;
    header_bg_color: string;
    header_text_color: string;
    even_row_color: string;
    odd_row_color: string;
    outer_border_style: 'thick' | 'medium' | 'thin' | 'double';
    vertical_border_style: 'thin' | 'medium' | 'dotted' | 'dashed';
    horizontal_border_style: 'dotted' | 'dashed' | 'thin' | 'medium';
    border_color: string;
    font_name: string;
    header_font_size: number;
    data_font_size: number;
}

export const excelTemplateApi = {
    // دریافت قالب فعلی
    getTemplate: () =>
        api.get<ApiResponse<ExcelTemplate>>('/admin/excel-template'),

    // به‌روزرسانی قالب
    updateTemplate: (data: Partial<ExcelTemplate>) =>
        api.put<ApiResponse<ExcelTemplate>>('/admin/excel-template', data),

    // بازنشانی به پیش‌فرض
    resetTemplate: () =>
        api.post<ApiResponse<ExcelTemplate>>('/admin/excel-template/reset'),
};