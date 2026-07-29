// frontend/src/api/notifications.ts
import api from './axios';
import { ApiResponse } from '../types';

export interface Notification {
    id: number;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    link?: string;
    is_read: boolean;
    created_at: string;
}

export const notificationApi = {
    // دریافت اعلان‌های کاربر
    getNotifications: (limit?: number) =>
        api.get<ApiResponse<{ notifications: Notification[]; unread_count: number }>>('/notifications', {
            params: { limit }
        }),
    
    // علامت‌گذاری اعلان به عنوان خوانده شده
    markAsRead: (id: number) =>
        api.post<ApiResponse<null>>(`/notifications/${id}/read`),
    
    // علامت‌گذاری همه اعلان‌ها به عنوان خوانده شده
    markAllAsRead: () =>
        api.post<ApiResponse<null>>('/notifications/read-all'),
};

// ===== این خط را اضافه کنید تا فایل به عنوان ماژول شناخته شود =====
export {};