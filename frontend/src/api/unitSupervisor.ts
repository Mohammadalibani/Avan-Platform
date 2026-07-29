// frontend/src/api/unitSupervisor.ts
import api from './axios';
import { ApiResponse, Personnel, WorkPeriod, PersonnelRequest, UnitStats, RequestFilters } from '../types';

export const unitSupervisorApi = {
    // ==================== دوره‌های کاری ====================
    getWorkPeriods: () =>
        api.get<ApiResponse<WorkPeriod[]>>('/unit-supervisor/periods'),

    // ==================== پرسنل ====================
    getUnitPersonnel: (params?: { period_id?: number; search?: string; page?: number; per_page?: number }) =>
        api.get<ApiResponse<{ personnel: Personnel[]; total: number }>>('/unit-supervisor/personnel', { params }),

    getUnitStats: (periodId?: number) =>
        api.get<ApiResponse<UnitStats>>('/unit-supervisor/stats', { params: { period_id: periodId } }),

    // ==================== کارکرد پرسنل ====================
    approvePersonnelWork: (personnelId: number, note?: string) =>
        api.post<ApiResponse<null>>(`/unit-supervisor/personnel/${personnelId}/approve`, { note }),

    approveGroupWork: (personnelIds: number[], note?: string) =>
        api.post<ApiResponse<null>>('/unit-supervisor/personnel/group-approve', { personnel_ids: personnelIds, note }),

    // ==================== درخواست‌های پرسنل ====================
    getRequests: (filters?: RequestFilters) =>
        api.get<ApiResponse<{ requests: PersonnelRequest[]; total: number }>>('/unit-supervisor/requests', { params: filters }),

    getRequestDetail: (requestId: number) =>
        api.get<ApiResponse<PersonnelRequest>>(`/unit-supervisor/requests/${requestId}`),

    handleRequest: (requestId: number, action: 'approve' | 'reject' | 'revision', note?: string) =>
        api.post<ApiResponse<null>>(`/unit-supervisor/requests/${requestId}/handle`, { action, note }),

    // ==================== پرسنل (CRUD) ====================
    addPersonnel: (data: any) =>
        api.post<ApiResponse<null>>('/unit-supervisor/personnel', data),

    updatePersonnel: (personnelId: number, data: any) =>
        api.put<ApiResponse<null>>(`/unit-supervisor/personnel/${personnelId}`, data),

    deletePersonnel: (personnelId: number) =>
        api.delete<ApiResponse<null>>(`/unit-supervisor/personnel/${personnelId}`),

    // ==================== اکسل ====================
    uploadExcel: (formData: FormData) =>
        api.post<ApiResponse<{ added: number; duplicate: number; errors: string[] }>>('/unit-supervisor/personnel/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    downloadExcel: (params?: { period_id?: number }) =>
        api.get('/unit-supervisor/personnel/export', { params, responseType: 'blob' }),
};