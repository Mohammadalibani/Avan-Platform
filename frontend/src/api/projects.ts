// frontend/src/api/projects.ts
import api from './axios';
import { Project, ApiResponse } from '../types';

export const projectsApi = {
    getAll: () =>
        api.get<ApiResponse<Project[]>>('/projects'),
    
    getById: (id: number) =>
        api.get<ApiResponse<Project>>(`/projects/${id}`),
    
    create: (data: Partial<Project>) =>
        api.post<ApiResponse<Project>>('/projects', data),
    
    update: (id: number, data: Partial<Project>) =>
        api.put<ApiResponse<Project>>(`/projects/${id}`, data),
    
    delete: (id: number) =>
        api.delete<ApiResponse<null>>(`/projects/${id}`),
    
    getStatistics: (id: number) =>
        api.get<ApiResponse<any>>(`/projects/${id}/statistics`),
    
    getByUser: (userId: number) =>
        api.get<ApiResponse<Project[]>>(`/projects/user/${userId}`),
};