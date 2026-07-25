// frontend/src/types/index.ts
export interface User {
    id: number;
    username: string;
    email: string;
    full_name: string;
    avatar?: string;
    is_active: boolean;
    is_verified: boolean;
    roles: string[];
    created_at: string;
    updated_at: string;
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
    count?: number;
}