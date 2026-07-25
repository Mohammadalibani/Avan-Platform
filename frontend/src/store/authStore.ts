// frontend/src/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import { authApi } from '../api/auth';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    checkAuth: () => Promise<void>;
    setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: true,
            
            login: async (username: string, password: string) => {
                try {
                    const response = await authApi.login(username, password);
                    const { token, user } = response.data.data;
                    
                    localStorage.setItem('token', token);
                    set({ 
                        user, 
                        token, 
                        isAuthenticated: true,
                        isLoading: false 
                    });
                    
                    // بعد از لاگین موفق، به صفحه اصلی بروید
                    window.location.href = '/';
                } catch (error: any) {
                    console.error('Login failed:', error);
                    set({ isLoading: false });
                    throw error;
                }
            },
            
            logout: () => {
                localStorage.removeItem('token');
                set({ user: null, token: null, isAuthenticated: false, isLoading: false });
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
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);