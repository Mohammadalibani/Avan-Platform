// frontend/src/api/tasks.ts
import api from './axios';
import { Task, ApiResponse } from '../types';

export const tasksApi = {
    getAll: () =>
        api.get<ApiResponse<Task[]>>('/tasks'),
    
    getById: (id: number) =>
        api.get<ApiResponse<Task>>(`/tasks/${id}`),
    
    create: (data: Partial<Task>) =>
        api.post<ApiResponse<Task>>('/tasks', data),
    
    update: (id: number, data: Partial<Task>) =>
        api.put<ApiResponse<Task>>(`/tasks/${id}`, data),
    
    delete: (id: number) =>
        api.delete<ApiResponse<null>>(`/tasks/${id}`),
    
    getByProject: (projectId: number) =>
        api.get<ApiResponse<Task[]>>(`/tasks/project/${projectId}`),
    
    getByUser: (userId: number) =>
        api.get<ApiResponse<Task[]>>(`/tasks/user/${userId}`),
    
    updateStatus: (id: number, status: string) =>
        api.patch<ApiResponse<Task>>(`/tasks/${id}/status/${status}`),
    
    assign: (id: number, userId: number) =>
        api.post<ApiResponse<Task>>(`/tasks/${id}/assign`, { user_id: userId }),
    
    getOverdue: () =>
        api.get<ApiResponse<Task[]>>('/tasks/overdue'),
};