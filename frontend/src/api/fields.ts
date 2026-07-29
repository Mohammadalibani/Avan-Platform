// frontend/src/api/fields.ts
import api from './axios';
import { ApiResponse } from '../types';

export interface DynamicField {
    id: number;
    title: string;
    field_type: 'text' | 'number' | 'date' | 'decimal';
    is_required: boolean;
    is_locked: boolean;
    is_monitoring: boolean;
    is_key: boolean;
    field_order: number;
    is_active: boolean;
    created_at?: string;
}

export const fieldsApi = {
    // دریافت لیست فیلدها
    getFields: () =>
        api.get<ApiResponse<DynamicField[]>>('/admin/fields'),
    
    // ایجاد فیلد جدید
    createField: (data: Partial<DynamicField>) =>
        api.post<ApiResponse<{ id: number }>>('/admin/fields', data),
    
    // به‌روزرسانی فیلد
    updateField: (id: number, data: Partial<DynamicField>) =>
        api.put<ApiResponse<null>>(`/admin/fields/${id}`, data),
    
    // حذف فیلد
    deleteField: (id: number) =>
        api.delete<ApiResponse<null>>(`/admin/fields/${id}`),
    
    // تغییر ترتیب فیلدها
    reorderFields: (fieldIds: number[]) =>
        api.post<ApiResponse<null>>('/admin/fields/reorder', { field_ids: fieldIds }),
    
    // دریافت فیلدهای فعال برای فرم
    getActiveFields: () =>
        api.get<ApiResponse<DynamicField[]>>('/personnel/fields'),
};