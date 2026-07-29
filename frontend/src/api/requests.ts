// frontend/src/api/requests.ts
import api from './axios';
import { ApiResponse } from '../types';

export interface Request {
    id: number;
    request_type: string;
    request_type_persian: string;
    requester_id: number;
    requester_name: string;
    unit_supervisor_id?: number;
    status: 'pending_unit' | 'approved' | 'rejected' | 'revision';
    status_persian: string;
    request_date: string;
    reviewed_at?: string;
    revision_note?: string;
    reject_reason?: string;
    extra_data?: Record<string, any>;
    has_attachment?: boolean;
    created_at: string;
    updated_at: string;
}

export interface RequestFormData {
    request_type: string;
    data: Record<string, any>;
}

export const requestsApi = {
    // دریافت درخواست‌های کاربر
    getMyRequests: (params?: { status?: string; type?: string; page?: number; per_page?: number }) =>
        api.get<ApiResponse<{ requests: Request[]; total: number }>>('/requests', { params }),

    // دریافت جزئیات یک درخواست
    getRequest: (id: number) =>
        api.get<ApiResponse<Request>>(`/requests/${id}`),

    // ایجاد درخواست جدید
    createRequest: (data: RequestFormData) =>
        api.post<ApiResponse<Request>>('/requests', data),

    // ویرایش درخواست (برای وضعیت revision)
    updateRequest: (id: number, data: RequestFormData) =>
        api.put<ApiResponse<Request>>(`/requests/${id}`, data),

    // حذف درخواست
    deleteRequest: (id: number) =>
        api.delete<ApiResponse<null>>(`/requests/${id}`),
};