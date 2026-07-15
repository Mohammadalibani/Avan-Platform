import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getToken = (): string | null => {
  return localStorage.getItem('access_token');
};

export const setToken = (token: string): void => {
  localStorage.setItem('access_token', token);
};

export const removeToken = (): void => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

export const toPersianNumber = (num: number | string): string => {
  if (num === undefined || num === null) return '۰';
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  return String(num).replace(/\d/g, (x) => persianDigits[parseInt(x)]);
};

export const getRolePersian = (role: string): string => {
  const roles: Record<string, string> = {
    admin: 'مدیر کل سیستم',
    org_manager: 'مدیر سازمان',
    dept_manager: 'مدیر اداره',
    hr_manager: 'مدیر منابع انسانی',
    unit_supervisor: 'سرپرست واحد',
    subordinate: 'کاربر عادی',
  };
  return roles[role] || 'نامشخص';
};