// frontend/src/api/orgManager.ts
import api from './axios';
import { ApiResponse, Personnel, WorkPeriod } from '../types';

export interface OrgStats {
    total_personnel: number;
    departments_count: number;
    units_count: number;
    completion_rate: number;
    approved_count: number;
    pending_count: number;
    org_approved_count: number;
    period_title?: string;
}

export interface DepartmentStats {
    id: number;
    name: string;
    color: string;
    personnel_count: number;
    completion_rate: number;
    units_count: number;
    managers: string[];
}

export interface UnitStats {
    id: number;
    name: string;
    department_id: number;
    department_name: string;
    personnel_count: number;
    completion_rate: number;
    supervisor_names: string[];
}

export interface OrgPersonnelFilters {
    period_id?: number;
    department_id?: number;
    unit_id?: number;
    search?: string;
    work_status?: string;
    page?: number;
    per_page?: number;
}

export const orgManagerApi = {
    // ==================== دوره‌های کاری ====================
    getWorkPeriods: () =>
        api.get<ApiResponse<WorkPeriod[]>>('/org-manager/periods'),

    // ==================== آمار سازمان ====================
    getOrgStats: (periodId?: number) =>
        api.get<ApiResponse<OrgStats>>('/org-manager/stats', { params: { period_id: periodId } }),

    // ==================== ادارات ====================
    getDepartments: (periodId?: number) =>
        api.get<ApiResponse<DepartmentStats[]>>('/org-manager/departments', { params: { period_id: periodId } }),

    getDepartmentUnits: (departmentId: number, periodId?: number) =>
        api.get<ApiResponse<UnitStats[]>>(`/org-manager/departments/${departmentId}/units`, { params: { period_id: periodId } }),

    // ==================== پرسنل سازمان ====================
    getOrgPersonnel: (filters?: OrgPersonnelFilters) =>
        api.get<ApiResponse<{ personnel: Personnel[]; total: number }>>('/org-manager/personnel', { params: filters }),

    // ==================== کارکرد پرسنل ====================
    finalApproveWork: (personnelId: number, note?: string) =>
        api.post<ApiResponse<null>>(`/org-manager/personnel/${personnelId}/final-approve`, { note }),

    finalApproveGroupWork: (personnelIds: number[], note?: string) =>
        api.post<ApiResponse<null>>('/org-manager/personnel/group-final-approve', { personnel_ids: personnelIds, note }),

    rejectToDept: (personnelId: number, note?: string) =>
        api.post<ApiResponse<null>>(`/org-manager/personnel/${personnelId}/reject-to-dept`, { note }),

    // ==================== اکسل ====================
    exportExcel: (params?: { period_id?: number; department_id?: number }) =>
        api.get('/org-manager/personnel/export', { params, responseType: 'blob' }),
};