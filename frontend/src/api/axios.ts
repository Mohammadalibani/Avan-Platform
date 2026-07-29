// frontend/src/api/axios.ts
import axios from 'axios';

// ===== استفاده از IP ثابت =====
const API_URL = 'http://10.86.109.205:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    timeout: 30000,
    withCredentials: true,
});

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        console.log('🔑 Token being sent:', token ? 'Yes (exists)' : 'No (missing)');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle token expiration and errors
api.interceptors.response.use(
    (response) => {
        console.log('✅ API Response:', response.status, response.config.url);
        return response;
    },
    (error) => {
        console.error('❌ API Error:', {
            status: error.response?.status,
            data: error.response?.data,
            url: error.config?.url,
            method: error.config?.method
        });
        
        if (error.response?.status === 401) {
            console.warn('⚠️ Token expired or invalid, redirecting to login');
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        
        if (error.response?.status === 422) {
            console.warn('⚠️ Unprocessable entity - check user approval status');
            // اگر کاربر تایید نشده باشد
            if (error.response?.data?.code === 'pending_approval') {
                alert('حساب کاربری شما در انتظار تایید ادمین است');
            }
        }
        
        return Promise.reject(error);
    }
);

export default api;