// frontend/src/types/index.ts
export interface User {
    id: number;
    username: string;
    email: string;
    full_name: string;
    first_name?: string;
    last_name?: string;
    national_code?: string;
    phone?: string;
    avatar?: string;
    role: string;
    role_persian?: string;
    roles?: string[];
    is_active: boolean;
    is_approved?: boolean;
    is_profile_complete?: boolean;
    personnel_code?: string;
    department_id?: number;
    unit_id?: number;
    department_name?: string;
    unit_name?: string;
    has_assignment?: boolean;
    created_at?: string;
    last_login?: string;
}

export interface Project {
    id: number;
    name: string;
    code: string;
    description?: string;
    status: string;
    priority: string;
    owner_id: number;
    owner_name?: string;
    progress: number;
    task_count: number;
    created_at: string;
    updated_at: string;
}

export interface Task {
    id: number;
    title: string;
    description?: string;
    status: string;
    priority: string;
    due_date?: string;
    estimated_hours?: number;
    actual_hours?: number;
    project_id: number;
    assigned_to_id?: number;
    assigned_to_name?: string;
    project_name?: string;
    created_at: string;
    updated_at: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data: {
        token: string;
        user: User;
    };
}

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data: T;
    total?: number;
}

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

export interface ActivityLog {
    id: number;
    user_id?: number;
    user_name?: string;
    message: string;
    badge?: string;
    log_type?: string;
    created_at: string;
}

export interface WorkPeriod {
    id: number;
    title: string;
    start_date: string;
    end_date: string;
    deadline?: string;
    display_order: number;
    is_active: boolean;
    created_at: string;
}

export interface Personnel {
    id: number;
    national_code: string;
    first_name: string;
    last_name: string;
    full_name: string;
    phone?: string;
    position?: string;
    hire_date?: string;
    department_id: number;
    department_name?: string;
    unit_id: number;
    unit_name?: string;
    period_id: number;
    period_title?: string;
    is_complete: boolean;
    work_status?: 'draft' | 'unit_pending' | 'dept_pending' | 'org_pending' | 'org_approved' | 'revision';
    values?: Record<string, any>;
    created_at?: string;
    updated_at?: string;
}

export interface PersonnelRequest {
    id: number;
    request_type: 'add' | 'delete';
    requester_id: number;
    requester_name: string;
    unit_id: number;
    unit_name: string;
    status: 'pending' | 'approved' | 'rejected';
    personnel_data?: any;
    admin_note?: string;
    created_at: string;
    reviewed_at?: string;
}

export interface UnitStats {
    unit_id: number;
    unit_name: string;
    department_name: string;
    period_title: string;
    total_personnel: number;
    complete_count: number;
    incomplete_count: number;
    completion_rate: number;
    pending_count: number;
    approved_count: number;
    draft_count: number;
}

export interface RequestFilters {
    status?: string;
    type?: string;
    requester_id?: number;
    page?: number;
    per_page?: number;
}