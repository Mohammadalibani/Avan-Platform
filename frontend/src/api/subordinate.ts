// frontend/src/api/subordinate.ts
import api from './axios';
import { ApiResponse } from '../types';

export interface SubordinateStats {
    total_requests: number;
    pending_requests: number;
    approved_requests: number;
    rejected_requests: number;
    membership_days: number;
    membership_months: number;
    membership_years: number;
}

export interface AttendanceRecord {
    id: number;
    date: string;
    day_of_week: string;
    check_in: string;
    check_out: string;
    status: 'present' | 'absent' | 'late' | 'leave' | 'holiday';
}

export const subordinateApi = {
    // دریافت آمار کاربر
    getStats: () =>
        api.get<ApiResponse<SubordinateStats>>('/subordinate/stats'),

    // دریافت حضور و غیاب
    getAttendance: (params?: { from_date?: string; to_date?: string; month?: string }) =>
        api.get<ApiResponse<AttendanceRecord[]>>('/subordinate/attendance', { params }),
};