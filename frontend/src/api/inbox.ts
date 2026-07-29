// frontend/src/api/inbox.ts
import api from './axios';
import { ApiResponse } from '../types';

export interface InboxMessage {
    id: number;
    title: string;
    message: string;
    sender_id: number;
    sender_name: string;
    receiver_id: number;
    receiver_name: string;
    status: 'read' | 'unread';
    created_at: string;
    replies?: InboxReply[];
}

export interface InboxReply {
    id: number;
    message_id: number;
    user_id: number;
    user_name: string;
    message: string;
    created_at: string;
}

export const inboxApi = {
    // دریافت پیام‌ها
    getMessages: (params?: { status?: string; page?: number; per_page?: number }) =>
        api.get<ApiResponse<{ messages: InboxMessage[]; total: number }>>('/admin/inbox', { params }),

    // دریافت جزئیات پیام
    getMessage: (id: number) =>
        api.get<ApiResponse<InboxMessage>>(`/admin/inbox/${id}`),

    // ارسال پاسخ
    replyMessage: (id: number, message: string) =>
        api.post<ApiResponse<InboxReply>>(`/admin/inbox/${id}/reply`, { message }),

    // علامت‌گذاری به عنوان خوانده شده
    markAsRead: (id: number) =>
        api.patch<ApiResponse<null>>(`/admin/inbox/${id}/read`),

    // حذف پیام
    deleteMessage: (id: number) =>
        api.delete<ApiResponse<null>>(`/admin/inbox/${id}`),
};