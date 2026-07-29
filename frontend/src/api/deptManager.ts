// frontend/src/api/deptManager.ts
import api from './axios';
import { ApiResponse, Personnel, WorkPeriod, UnitStats } from '../types';

export interface DeptStats extends UnitStats {
    department_id: number;
    department_name: string;
    units_count: number;
    total_personnel: number;
    completion_rate: number;
    approved_count: number;
    pending_count: number;
    dept_approved_count: number;
}

export interface DeptPersonnelFilters {
    period_id?: number;
    unit_id?: number;
    search?: string;
    work_status?: string;
    page?: number;
    per_page?: number;
}

export const deptManagerApi = {
    // ==================== دوره‌های کاری ====================
    getWorkPeriods: () =>
        api.get<ApiResponse<WorkPeriod[]>>('/dept-manager/periods'),

    // ==================== آمار اداره ====================
    getDeptStats: (periodId?: number) =>
        api.get<ApiResponse<DeptStats>>('/dept-manager/stats', { params: { period_id: periodId } }),

    // ==================== پرسنل اداره ====================
    getDeptPersonnel: (filters?: DeptPersonnelFilters) =>
        api.get<ApiResponse<{ personnel: Personnel[]; total: number }>>('/dept-manager/personnel', { params: filters }),

    // ==================== کارکرد پرسنل ====================
    approveDeptWork: (personnelId: number, note?: string) =>
        api.post<ApiResponse<null>>(`/dept-manager/personnel/${personnelId}/approve`, { note }),

    approveDirectWork: (personnelId: number, note?: string) =>
        api.post<ApiResponse<null>>(`/dept-manager/personnel/${personnelId}/approve-direct`, { note }),

    rejectWork: (personnelId: number, note?: string) =>
        api.post<ApiResponse<null>>(`/dept-manager/personnel/${personnelId}/reject`, { note }),

    approveGroupWork: (personnelIds: number[], note?: string) =>
        api.post<ApiResponse<null>>('/dept-manager/personnel/group-approve', { personnel_ids: personnelIds, note }),

    approveDirectGroupWork: (personnelIds: number[], note?: string) =>
        api.post<ApiResponse<null>>('/dept-manager/personnel/group-approve-direct', { personnel_ids: personnelIds, note }),

    // ==================== واحدها ====================
    getDepartmentUnits: (periodId?: number) =>
        api.get<ApiResponse<{ units: any[]; total: number }>>('/dept-manager/units', { params: { period_id: periodId } }),

    // ==================== اکسل ====================
    exportExcel: (params?: { period_id?: number; unit_id?: number }) =>
        api.get('/dept-manager/personnel/export', { params, responseType: 'blob' }),
};