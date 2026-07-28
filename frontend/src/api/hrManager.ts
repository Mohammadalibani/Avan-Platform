// frontend/src/api/hrManager.ts
import api from './axios';
import { ApiResponse, User } from '../types';

export interface HrStats {
    total_users: number;
    active_users: number;
    inactive_users: number;
    pending_users: number;
    pending_documents: number;
    approved_documents: number;
    rejected_documents: number;
}

export interface UserDocument {
    id: number;
    user_id: number;
    user_name: string;
    doc_type: string;
    doc_title: string;
    doc_filename: string;
    doc_original_name: string;
    doc_size: number;
    status: 'pending' | 'approved' | 'rejected';
    admin_note?: string;
    created_at: string;
    reviewed_at?: string;
}

export interface HrUserFilters {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
    per_page?: number;
}

export const hrManagerApi = {
    // ==================== آمار ====================
    getStats: () =>
        api.get<ApiResponse<HrStats>>('/hr-manager/stats'),

    // ==================== کاربران ====================
    getUsers: (filters?: HrUserFilters) =>
        api.get<ApiResponse<{ users: User[]; total: number }>>('/hr-manager/users', { params: filters }),

    updateUser: (userId: number, data: Partial<User>) =>
        api.put<ApiResponse<User>>(`/hr-manager/users/${userId}`, data),

    // ==================== مدارک ====================
    getUserDocuments: (userId: number) =>
        api.get<ApiResponse<UserDocument[]>>(`/hr-manager/users/${userId}/documents`),

    reviewDocument: (documentId: number, status: 'approved' | 'rejected', note?: string) =>
        api.post<ApiResponse<null>>(`/hr-manager/documents/${documentId}/review`, { status, note }),

    // ==================== اکسل ====================
    exportUsers: (params?: { role?: string; status?: string }) =>
        api.get('/hr-manager/users/export', { params, responseType: 'blob' }),
};