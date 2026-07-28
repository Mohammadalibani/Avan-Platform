// frontend/src/api/dashboard.ts
import api from './axios';

export interface DashboardStats {
    totalUsers: number;
    totalProjects: number;
    completedTasks: number;
    pendingTasks: number;
    totalTasks: number;
}

export interface RecentActivity {
    id: number;
    user: string;
    action: string;
    time: string;
}

export const dashboardApi = {
    getStats: () =>
        api.get<{ success: boolean; data: DashboardStats }>('/dashboard/stats'),
    
    getRecentActivities: () =>
        api.get<{ success: boolean; data: RecentActivity[] }>('/dashboard/recent-activities'),
};