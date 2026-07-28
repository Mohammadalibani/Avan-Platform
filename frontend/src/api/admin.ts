// frontend/src/api/admin.ts
import api from './axios';
import { ApiResponse, User, Personnel, WorkPeriod } from '../types';

// ==================== تایپ‌ها ====================
export interface AdminStats {
    total_users: number;
    total_personnel: number;
    total_departments: number;
    total_units: number;
    active_period?: WorkPeriod;
    days_remaining?: number;
}

export interface Department {
    id: number;
    name: string;
    color: string;
    description?: string;
    is_active: boolean;
    created_at: string;
    managers: { id: number; full_name: string }[];
}

export interface Unit {
    id: number;
    name: string;
    department_id: number;
    department_name: string;
    description?: string;
    is_active: boolean;
    needs_approval: boolean;
    created_at: string;
    supervisors: { id: number; full_name: string }[];
}

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
    created_at: string;
}

export interface ApprovalRequest {
    id: number;
    request_type: 'add' | 'delete';
    requester_id: number;
    requester_name: string;
    unit_id: number;
    unit_name: string;
    status: 'pending' | 'approved' | 'rejected';
    personnel_data?: any;
    admin_note?: string;
    created_at: string;
    reviewed_at?: string;
}

// ==================== API ====================
export const adminApi = {
    // ===== آمار =====
    getStats: () =>
        api.get<ApiResponse<AdminStats>>('/admin/stats'),

    // ===== کاربران =====
    getUsers: (params?: { page?: number; per_page?: number; search?: string; role?: string }) =>
        api.get<ApiResponse<{ users: User[]; total: number }>>('/admin/users', { params }),
    
    createUser: (data: any) =>
        api.post<ApiResponse<User>>('/admin/users', data),
    
    updateUser: (userId: number, data: any) =>
        api.put<ApiResponse<User>>(`/admin/users/${userId}`, data),
    
    deleteUser: (userId: number) =>
        api.delete<ApiResponse<null>>(`/admin/users/${userId}`),
    
    resetPassword: (userId: number) =>
        api.post<ApiResponse<null>>(`/admin/users/${userId}/reset-password`),

    // ===== ادارات =====
    getDepartments: () =>
        api.get<ApiResponse<Department[]>>('/admin/departments'),
    
    createDepartment: (data: any) =>
        api.post<ApiResponse<Department>>('/admin/departments', data),
    
    updateDepartment: (id: number, data: any) =>
        api.put<ApiResponse<Department>>(`/admin/departments/${id}`, data),
    
    deleteDepartment: (id: number) =>
        api.delete<ApiResponse<null>>(`/admin/departments/${id}`),

    // ===== واحدها =====
    getUnits: () =>
        api.get<ApiResponse<Unit[]>>('/admin/units'),
    
    createUnit: (data: any) =>
        api.post<ApiResponse<Unit>>('/admin/units', data),
    
    updateUnit: (id: number, data: any) =>
        api.put<ApiResponse<Unit>>(`/admin/units/${id}`, data),
    
    deleteUnit: (id: number) =>
        api.delete<ApiResponse<null>>(`/admin/units/${id}`),

    // ===== پرسنل =====
    getPersonnel: (params?: { page?: number; per_page?: number; search?: string; department_id?: number; unit_id?: number; period_id?: number }) =>
        api.get<ApiResponse<{ personnel: Personnel[]; total: number }>>('/admin/personnel', { params }),
    
    createPersonnel: (data: any) =>
        api.post<ApiResponse<Personnel>>('/admin/personnel', data),
    
    updatePersonnel: (id: number, data: any) =>
        api.put<ApiResponse<Personnel>>(`/admin/personnel/${id}`, data),
    
    deletePersonnel: (id: number) =>
        api.delete<ApiResponse<null>>(`/admin/personnel/${id}`),
    
    duplicatePersonnel: (sourcePeriodId: number, targetPeriodId: number, behavior: 'skip' | 'replace') =>
        api.post<ApiResponse<{ added: number; skipped: number; replaced: number }>>('/admin/personnel/duplicate', {
            source_period_id: sourcePeriodId,
            target_period_id: targetPeriodId,
            behavior,
        }),

    // ===== فیلدهای پویا =====
    getFields: () =>
        api.get<ApiResponse<DynamicField[]>>('/admin/fields'),
    
    createField: (data: any) =>
        api.post<ApiResponse<DynamicField>>('/admin/fields', data),
    
    updateField: (id: number, data: any) =>
        api.put<ApiResponse<DynamicField>>(`/admin/fields/${id}`, data),
    
    deleteField: (id: number) =>
        api.delete<ApiResponse<null>>(`/admin/fields/${id}`),
    
    reorderFields: (fieldIds: number[]) =>
        api.post<ApiResponse<null>>('/admin/fields/reorder', { field_ids: fieldIds }),

    // ===== دوره‌ها =====
    getPeriods: () =>
        api.get<ApiResponse<WorkPeriod[]>>('/admin/periods'),
    
    createPeriod: (data: any) =>
        api.post<ApiResponse<WorkPeriod>>('/admin/periods', data),
    
    updatePeriod: (id: number, data: any) =>
        api.put<ApiResponse<WorkPeriod>>(`/admin/periods/${id}`, data),
    
    deletePeriod: (id: number) =>
        api.delete<ApiResponse<null>>(`/admin/periods/${id}`),
    
    setActivePeriod: (id: number) =>
        api.post<ApiResponse<null>>(`/admin/periods/${id}/set-active`),
    
    reorderPeriods: (periodIds: number[]) =>
        api.post<ApiResponse<null>>('/admin/periods/reorder', { period_ids: periodIds }),

    // ===== درخواست‌های تایید =====
    getApprovalRequests: (params?: { status?: string; page?: number; per_page?: number }) =>
        api.get<ApiResponse<{ requests: ApprovalRequest[]; total: number }>>('/admin/approvals', { params }),
    
    handleApproval: (requestId: number, action: 'approve' | 'reject' | 'revision', note?: string) =>
        api.post<ApiResponse<null>>(`/admin/approvals/${requestId}/handle`, { action, note }),

    // ===== تنظیمات =====
    getSettings: () =>
        api.get<ApiResponse<any>>('/admin/settings'),
    
    updateSettings: (data: any) =>
        api.put<ApiResponse<null>>('/admin/settings', data),

    // ===== اکسل =====
    exportPersonnel: (params?: { period_id?: number; department_id?: number }) =>
        api.get('/admin/personnel/export', { params, responseType: 'blob' }),
    
    uploadPersonnel: (formData: FormData) =>
        api.post<ApiResponse<{ added: number; duplicate: number; errors: string[] }>>('/admin/personnel/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
};