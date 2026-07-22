// frontend/src/api/client.ts
import axios from 'axios';

// ✅ استفاده از متغیر محیطی
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor - اضافه کردن توکن
apiClient.interceptors.request.use(
  (config) => {
    // ✅ خواندن توکن از localStorage
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Token added to request');
    } else {
      console.warn('⚠️ No token found in localStorage');
    }
    console.log('📤 Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - مدیریت خطاها
apiClient.interceptors.response.use(
  (response) => {
    console.log('📥 Response:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    console.error('❌ Response Error:', error.response?.status, error.response?.data);
    
    // ✅ اگر خطای ۴۰۱ و در مسیر لاگین نیستیم
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      // پاک کردن توکن
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // اگر قبلاً در حال لاگین نیستیم، هدایت به لاگین
      if (!localStorage.getItem('_redirecting')) {
        localStorage.setItem('_redirecting', 'true');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;