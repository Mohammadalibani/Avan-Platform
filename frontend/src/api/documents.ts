// frontend/src/api/documents.ts
import api from './axios';
import { ApiResponse } from '../types';

export interface UserDocument {
    id: number;
    user_id: number;
    doc_type: string;
    doc_title: string;
    doc_filename: string;
    doc_original_name: string;
    doc_size: number;
    status: 'pending' | 'approved' | 'rejected';
    admin_note?: string;
    reviewed_by?: number;
    reviewed_at?: string;
    created_at: string;
    updated_at: string;
}

export interface DocumentUploadData {
    doc_type: string;
    doc_title?: string;
    file: File;
}

export const documentsApi = {
    // دریافت مدارک کاربر
    getMyDocuments: () =>
        api.get<ApiResponse<UserDocument[]>>('/documents'),

    // آپلود مدرک
    uploadDocument: (data: FormData) =>
        api.post<ApiResponse<UserDocument>>('/documents/upload', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    // حذف مدرک
    deleteDocument: (id: number) =>
        api.delete<ApiResponse<null>>(`/documents/${id}`),

    // دریافت تصویر مدرک
    getDocumentImage: (filename: string) =>
        api.get(`/documents/image/${filename}`, { responseType: 'blob' }),
};