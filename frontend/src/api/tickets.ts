// frontend/src/api/tickets.ts
import api from './axios';
import { ApiResponse } from '../types';

export interface Ticket {
    id: number;
    title: string;
    message: string;
    sender_id: number;
    sender_name: string;
    receiver_id: number;
    receiver_name: string;
    status: 'open' | 'in_progress' | 'closed';
    priority: 'normal' | 'important' | 'urgent';
    message_type: 'ticket' | 'message';
    created_at: string;
    updated_at: string;
    replies?: TicketReply[];
    reply_count?: number;
}

export interface TicketReply {
    id: number;
    ticket_id: number;
    user_id: number;
    user_name: string;
    message: string;
    is_admin_reply: boolean;
    created_at: string;
}

export interface WorkMessage {
    id: number;
    personnel_id: number;
    personnel_name: string;
    period_title: string;
    message: string;
    sender_id: number;
    sender_name: string;
    status: string;
    created_at: string;
    replies?: WorkMessageReply[];
}

export interface WorkMessageReply {
    id: number;
    work_message_id: number;
    user_id: number;
    user_name: string;
    message: string;
    created_at: string;
}

export const ticketsApi = {
    // ===== تیکت‌ها =====
    getTickets: (params?: { status?: string; page?: number; per_page?: number }) =>
        api.get<ApiResponse<{ tickets: Ticket[]; total: number }>>('/tickets', { params }),
    
    getTicket: (id: number) =>
        api.get<ApiResponse<Ticket>>(`/tickets/${id}`),
    
    createTicket: (data: { title: string; message: string; priority: string; receiver_id?: number }) =>
        api.post<ApiResponse<Ticket>>('/tickets', data),
    
    replyTicket: (id: number, message: string) =>
        api.post<ApiResponse<TicketReply>>(`/tickets/${id}/reply`, { message }),
    
    deleteTicket: (id: number) =>
        api.delete<ApiResponse<null>>(`/tickets/${id}`),
    
    updateTicketStatus: (id: number, status: string) =>
        api.patch<ApiResponse<Ticket>>(`/tickets/${id}/status`, { status }),

    // ===== پیام‌های کاری =====
    getWorkMessages: (params?: { status?: string; page?: number; per_page?: number }) =>
        api.get<ApiResponse<{ messages: WorkMessage[]; total: number }>>('/work-messages', { params }),
    
    getWorkMessage: (id: number) =>
        api.get<ApiResponse<WorkMessage>>(`/work-messages/${id}`),
    
    replyWorkMessage: (id: number, message: string) =>
        api.post<ApiResponse<WorkMessageReply>>(`/work-messages/${id}/reply`, { message }),
};