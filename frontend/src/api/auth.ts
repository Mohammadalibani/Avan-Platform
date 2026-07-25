// frontend/src/api/auth.ts
import api from './axios';
import { AuthResponse, User } from '../types';

export const authApi = {
    login: (username: string, password: string) =>
        api.post<AuthResponse>('/auth/login', { username, password }),
    
    getMe: () =>
        api.get<{ success: boolean; data: User }>('/auth/me'),
    
    refresh: () =>
        api.post<{ success: boolean; data: { token: string } }>('/auth/refresh'),
    
    changePassword: (oldPassword: string, newPassword: string) =>
        api.post('/auth/change-password', { old_password: oldPassword, new_password: newPassword }),
    
    logout: () => {
        localStorage.removeItem('token');
    },
};