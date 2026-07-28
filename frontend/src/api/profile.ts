// frontend/src/api/profile.ts
import api from './axios';
import { ApiResponse, User } from '../types';

export const profileApi = {
    // آپلود عکس پروفایل
    uploadAvatar: (file: File) => {
        const formData = new FormData();
        formData.append('avatar', file);
        return api.post<ApiResponse<{ avatar: string }>>('/profile/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    
    // حذف عکس پروفایل
    deleteAvatar: () =>
        api.delete<ApiResponse<null>>('/profile/avatar'),
    
    // به‌روزرسانی اطلاعات کاربر
    updateProfile: (data: Partial<User>) =>
        api.put<ApiResponse<User>>('/profile', data),
    
    // تکمیل پروفایل
    completeProfile: (data: Partial<User>) =>
        api.post<ApiResponse<User>>('/profile/complete', data),
};