// frontend/src/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import { authApi } from '../api/auth';
import { message } from 'antd';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    pendingApproval: boolean;
    
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    checkAuth: () => Promise<void>;
    setUser: (user: User) => void;
    setPendingApproval: (status: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: true,
            pendingApproval: false,
            
            login: async (username: string, password: string) => {
                try {
                    const response = await authApi.login(username, password);
                    const { token, user } = response.data.data;
                    
                    localStorage.setItem('token', token);
                    set({ 
                        user, 
                        token, 
                        isAuthenticated: true,
                        isLoading: false,
                        pendingApproval: false
                    });
                    
                    // بررسی تکمیل پروفایل
                    if (!user.is_profile_complete) {
                        window.location.href = '/profile/complete';
                    } else {
                        window.location.href = '/';
                    }
                } catch (error: any) {
                    console.error('Login failed:', error);
                    set({ isLoading: false });
                    
                    // بررسی خطای تایید
                    if (error.response?.data?.code === 'pending_approval') {
                        set({ pendingApproval: true });
                        message.warning('حساب کاربری شما در انتظار تایید ادمین است');
                    } else {
                        message.error(error.response?.data?.message || 'خطا در ورود');
                    }
                    throw error;
                }
            },
            
            logout: () => {
                localStorage.removeItem('token');
                set({ user: null, token: null, isAuthenticated: false, isLoading: false, pendingApproval: false });
                window.location.href = '/login';
            },
            
            checkAuth: async () => {
                const token = localStorage.getItem('token');
                
                if (!token) {
                    set({ isAuthenticated: false, isLoading: false });
                    return;
                }
                
                try {
                    const response = await authApi.getMe();
                    set({ 
                        user: response.data.data,
                        isAuthenticated: true,
                        isLoading: false
                    });
                } catch (error) {
                    console.error('Auth check failed:', error);
                    localStorage.removeItem('token');
                    set({ 
                        user: null, 
                        isAuthenticated: false, 
                        isLoading: false
                    });
                }
            },
            
            setUser: (user: User) => set({ user }),
            
            setPendingApproval: (status: boolean) => set({ pendingApproval: status }),
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
                pendingApproval: state.pendingApproval,
            }),
        }
    )
);