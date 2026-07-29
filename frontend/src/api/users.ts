// frontend/src/api/users.ts
import api from './axios';
import { User, ApiResponse } from '../types';

export const usersApi = {
    // ===== مدیریت کاربران =====
    // دریافت لیست کاربران با صفحه‌بندی
    getAll: (params?: { page?: number; per_page?: number; search?: string; role?: string }) =>
        api.get<ApiResponse<{ users: User[]; total: number }>>('/admin/users', { params }),
    
    // دریافت یک کاربر
    getById: (id: number) =>
        api.get<ApiResponse<User>>(`/admin/users/${id}`),
    
    // ایجاد کاربر جدید
    create: (data: Partial<User>) =>
        api.post<ApiResponse<User>>('/admin/users', data),
    
    // به‌روزرسانی کاربر
    update: (id: number, data: Partial<User>) =>
        api.put<ApiResponse<User>>(`/admin/users/${id}`, data),
    
    // حذف کاربر
    delete: (id: number) =>
        api.delete<ApiResponse<null>>(`/admin/users/${id}`),
    
    // تایید کاربر
    approve: (id: number) =>
        api.post<ApiResponse<null>>(`/admin/users/${id}/approve`),

    // ===== احراز هویت =====
    // تغییر رمز عبور
    changePassword: (data: { old_password: string; new_password: string }) =>
        api.post<ApiResponse<null>>('/auth/change-password', data),
};