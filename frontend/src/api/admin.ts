// frontend/src/api/admin.ts
import api from './axios';
import { ApiResponse } from '../types';

// ===== تایپ‌های مدیریتی =====
export interface AdminStats {
    total_users: number;
    total_personnel: number;
    total_departments: number;
    total_units: number;
    pending_users: number;
    active_users?: number;
    inactive_users?: number;
    days_remaining?: number;
    active_period?: {
        id: number;
        title: string;
        start_date: string;
        end_date: string;
        deadline?: string;
        is_active: boolean;
    };
}

export interface Department {
    id: number;
    name: string;
    color?: string;
    description?: string;
    is_active?: boolean;
    managers?: { id: number; full_name: string }[];
    units_count?: number;
    personnel_count?: number;
    created_at?: string;
}

export interface Unit {
    id: number;
    name: string;
    department_id: number;
    description?: string;
    needs_approval?: boolean;
    is_active?: boolean;
    supervisors?: { id: number; full_name: string }[];
    department_name?: string;
    personnel_count?: number;
    created_at?: string;
}

export interface Period {
    id: number;
    title: string;
    start_date: string;
    end_date: string;
    deadline?: string;
    display_order: number;
    is_active: boolean;
    created_at?: string;
    created_at_jalali?: string;
}

export interface Personnel {
    id: number;
    national_code: string;
    first_name: string;
    last_name: string;
    full_name: string;
    phone?: string;
    position?: string;
    department_id?: number;
    department_name?: string;
    unit_id?: number;
    unit_name?: string;
    period_id?: number;
    period_title?: string;
    is_complete?: boolean;
    values?: Record<number, string>;
    created_at?: string;
    updated_at?: string;
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

export const adminApi = {
    // ============================================================
    // آمار
    // ============================================================
    getStats: () =>
        api.get<ApiResponse<AdminStats>>('/admin/stats'),

    // ============================================================
    // کاربران
    // ============================================================
    getUsers: (params?: {
        page?: number;
        per_page?: number;
        search?: string;
        role?: string;
    }) =>
        api.get<ApiResponse<{ users: any[]; total: number }>>('/admin/users', { params }),

    getUserHistory: (userId: number) =>
        api.get<ApiResponse<any[]>>(`/admin/users/${userId}/history`),

    createUser: (data: any) =>
        api.post<ApiResponse<{ id: number }>>('/admin/users/create', data),

    updateUser: (userId: number, data: any) =>
        api.put<ApiResponse<null>>(`/admin/users/${userId}/edit`, data),

    deleteUser: (userId: number) =>
        api.delete<ApiResponse<null>>(`/admin/users/${userId}`),

    approveUser: (userId: number) =>
        api.post<ApiResponse<null>>(`/admin/users/${userId}/approve`),

    resetPassword: (userId: number) =>
        api.post<ApiResponse<null>>(`/admin/users/${userId}/reset-password`),

    // ============================================================
    // آپلود عکس پروفایل
    // ============================================================
    uploadAvatar: (formData: FormData) =>
        api.post<ApiResponse<{ url: string; filename: string }>>(
            '/admin/upload-avatar',
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        ),

    // ============================================================
    // آپلود و خروجی اکسل
    // ============================================================
    uploadUsersExcel: (formData: FormData) =>
        api.post<ApiResponse<{
            total: number;
            added: number;
            duplicates: number;
            errors: string[];
        }>>('/admin/users/import-excel', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    exportUsersExcel: () =>
        api.get('/admin/export-users-excel', { responseType: 'blob' }),

    downloadTemplate: () =>
        api.get('/admin/users/download-template', { responseType: 'blob' }),

    syncAvatars: () =>
        api.post<ApiResponse<{
            updated: number;
            errors: string[];
        }>>('/admin/sync-avatars'),

    // ============================================================
    // دپارتمان‌ها
    // ============================================================
    getDepartments: () =>
        api.get<ApiResponse<Department[]>>('/admin/departments'),

	createDepartment: (data: { name: string; color?: string; description?: string; manager_ids?: number[] }) =>
		api.post<ApiResponse<{ id: number }>>('/admin/departments/create', data),

	updateDepartment: (id: number, data: { name: string; color?: string; description?: string; manager_ids?: number[] }) =>
		api.put<ApiResponse<null>>(`/admin/departments/${id}/edit`, data),

    deleteDepartment: (id: number) =>
        api.delete<ApiResponse<null>>(`/admin/departments/${id}`),

    // ============================================================
    // واحدها
    // ============================================================
    getUnits: (departmentId?: number) =>
        api.get<ApiResponse<Unit[]>>('/admin/units', {
            params: departmentId ? { department_id: departmentId } : undefined,
        }),

    createUnit: (data: { name: string; department_id: number; description?: string; needs_approval?: boolean; supervisor_ids?: number[] }) =>
        api.post<ApiResponse<{ id: number }>>('/admin/units/create', data),

    updateUnit: (id: number, data: { name: string; department_id: number; description?: string; needs_approval?: boolean; supervisor_ids?: number[] }) =>
        api.put<ApiResponse<null>>(`/admin/units/${id}/edit`, data),

    deleteUnit: (id: number) =>
        api.delete<ApiResponse<null>>(`/admin/units/${id}`),

// ============================================================
// دوره‌ها
// ============================================================
getPeriods: () =>
    api.get<ApiResponse<Period[]>>('/admin/periods'),

createPeriod: (data: { title: string; start_date: string; end_date: string; deadline?: string }) =>
    api.post<ApiResponse<{ id: number }>>('/admin/periods/create', data),

updatePeriod: (id: number, data: { title: string; start_date: string; end_date: string; deadline?: string }) =>
    api.put<ApiResponse<null>>(`/admin/periods/${id}/edit`, data),

deletePeriod: (id: number) =>
    api.delete<ApiResponse<null>>(`/admin/periods/${id}`),

setActivePeriod: (id: number) =>
    api.post<ApiResponse<null>>(`/admin/periods/${id}/set-active`),

// ===== اضافه کردن متد reorderPeriods =====
reorderPeriods: (orders: { id: number; display_order: number }[]) =>
    api.post<ApiResponse<null>>('/admin/periods/update-order', { orders }),
    // ============================================================
    // پرسنل
    // ============================================================
    getPersonnel: (params?: {
        page?: number;
        per_page?: number;
        search?: string;
        department_id?: number;
        unit_id?: number;
        period_id?: number;
    }) =>
        api.get<ApiResponse<{ personnel: Personnel[]; total: number }>>('/admin/personnel', { params }),

    createPersonnel: (data: any) =>
        api.post<ApiResponse<{ id: number }>>('/admin/personnel/create', data),

    updatePersonnel: (id: number, data: any) =>
        api.put<ApiResponse<null>>(`/admin/personnel/${id}/edit`, data),

    deletePersonnel: (id: number) =>
        api.delete<ApiResponse<null>>(`/admin/personnel/${id}`),

    duplicatePersonnel: (sourcePeriodId: number, targetPeriodId: number, behavior: 'skip' | 'overwrite') =>
        api.post<ApiResponse<{ count: number; message: string }>>('/admin/personnel/copy-to-period', {
            source_period_id: sourcePeriodId,
            target_period_id: targetPeriodId,
            duplicate_action: behavior,
        }),

    uploadPersonnel: (formData: FormData) =>
        api.post<ApiResponse<{ total: number; added: number; errors: string[] }>>(
            '/admin/personnel/import-excel',
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        ),

    // ============================================================
    // درخواست‌های تایید
    // ============================================================
    getApprovalRequests: (params?: {
        status?: string;
        page?: number;
        per_page?: number;
    }) =>
        api.get<ApiResponse<{ requests: ApprovalRequest[]; total: number }>>('/admin/approvals', { params }),

    handleApproval: (requestId: number, action: 'approve' | 'reject' | 'revision', note?: string) =>
        api.post<ApiResponse<null>>(`/admin/approvals/${requestId}/${action}`, { admin_note: note }),

    // ============================================================
    // فیلدهای داینامیک
    // ============================================================
    getFields: () =>
        api.get<ApiResponse<{ id: number; title: string; field_type: string; is_required: boolean; is_key: boolean }[]>>(
            '/admin/fields'
        ),

    createField: (data: { title: string; field_type: string; is_required?: boolean; is_key?: boolean }) =>
        api.post<ApiResponse<{ id: number }>>('/admin/fields', data),

    updateField: (id: number, data: { title: string; field_type: string; is_required?: boolean; is_key?: boolean }) =>
        api.put<ApiResponse<null>>(`/admin/fields/${id}`, data),

    deleteField: (id: number) =>
        api.delete<ApiResponse<null>>(`/admin/fields/${id}`),

    reorderFields: (orders: { id: number; order: number }[]) =>
        api.post<ApiResponse<null>>('/admin/fields/reorder', { orders }),
};