// frontend/src/api/personnel.ts
import api from './axios';
import { ApiResponse } from '../types';

export const personnelApi = {
    // دریافت مقادیر فیلدهای پویا
    getValues: (personnelId: number, periodId: number) =>
        api.get<ApiResponse<Record<string, any>>>(`/personnel/${personnelId}/values`, {
            params: { period_id: periodId }
        }),
    
    // ذخیره مقادیر فیلدهای پویا
    saveValues: (personnelId: number, periodId: number, values: Record<string, any>) =>
        api.post<ApiResponse<null>>(`/personnel/${personnelId}/values`, {
            period_id: periodId,
            values
        }),
};