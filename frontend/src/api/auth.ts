import apiClient from './client';

export interface User {
  id: number;
  national_code: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: string;
  role_persian: string;
  phone: string;
  is_active: boolean;
  is_approved: boolean;
  profile_picture: string | null;
}

export interface LoginResponse {
  success: boolean;
  access_token: string;
  refresh_token: string;
  user: User;
}

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  const response = await apiClient.post('/auth/login', { username, password });
  return response.data;
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};

export const logout = async (): Promise<void> => {
  await apiClient.post('/auth/logout');
};