// frontend/src/api/reports.ts
import api from './axios';

export const reportsApi = {
    // خروجی اکسل پرسنل
    exportPersonnel: (params?: {
        period_id?: number;
        department_id?: number;
        unit_id?: number;
    }) =>
        api.get('/reports/personnel/export', {
            params,
            responseType: 'blob',
        }),
    
    // خروجی اکسل درخواست‌ها
    exportRequests: (params?: { status?: string }) =>
        api.get('/reports/requests/export', {
            params,
            responseType: 'blob',
        }),
};