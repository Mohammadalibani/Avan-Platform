// frontend/src/api/users.ts
import api from './axios';
import { User, ApiResponse } from '../types';

export const usersApi = {
    getAll: () =>
        api.get<ApiResponse<User[]>>('/users'),
    
    getById: (id: number) =>
        api.get<ApiResponse<User>>(`/users/${id}`),
    
    create: (data: Partial<User> & { password: string }) =>
        api.post<ApiResponse<User>>('/users', data),
    
    update: (id: number, data: Partial<User>) =>
        api.put<ApiResponse<User>>(`/users/${id}`, data),
    
    delete: (id: number) =>
        api.delete<ApiResponse<null>>(`/users/${id}`),
    
    search: (query: string) =>
        api.get<ApiResponse<User[]>>(`/users/search?q=${query}`),
};