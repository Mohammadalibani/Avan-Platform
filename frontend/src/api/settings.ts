// frontend/src/api/settings.ts
import api from './axios';
import { ApiResponse } from '../types';

export interface AppearanceSettings {
    header_title: string;
    header_color: string;
    header_text_color: string;
    logo: string | null;
}

export interface NetworkSettings {
    base_url: string;
    port: number;
}

export interface BackupSettings {
    auto_backup_time: string;
    backups: {
        filename: string;
        size: number;
        created_at: string;
    }[];
}

export const settingsApi = {
    // ===== تنظیمات ظاهر =====
    getAppearance: () =>
        api.get<ApiResponse<AppearanceSettings>>('/settings/appearance'),
    
    updateAppearance: (data: Partial<AppearanceSettings>) =>
        api.put<ApiResponse<null>>('/settings/appearance', data),
    
    uploadLogo: (file: File) => {
        const formData = new FormData();
        formData.append('logo', file);
        return api.post<ApiResponse<{ logo: string }>>('/settings/upload-logo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    
    // ===== تنظیمات شبکه =====
    getNetwork: () =>
        api.get<ApiResponse<NetworkSettings>>('/settings/network'),
    
    updateNetwork: (data: Partial<NetworkSettings>) =>
        api.put<ApiResponse<null>>('/settings/network', data),
    
    // ===== تنظیمات بکاپ =====
    getBackup: () =>
        api.get<ApiResponse<BackupSettings>>('/settings/backup'),
    
    updateBackup: (data: Partial<BackupSettings>) =>
        api.put<ApiResponse<null>>('/settings/backup', data),
    
    createBackup: () =>
        api.post<ApiResponse<{ filename: string }>>('/settings/backup/create'),
    
    downloadBackup: (filename: string) =>
        api.get(`/settings/backup/${filename}`, { responseType: 'blob' }),
    
    deleteBackup: (filename: string) =>
        api.delete<ApiResponse<null>>(`/settings/backup/${filename}`),
    
    // ===== تنظیمات کلی (برای Settings.tsx) =====
    getSettings: () =>
        api.get<ApiResponse<{
            appearance: AppearanceSettings;
            network: NetworkSettings;
            backup: BackupSettings;
        }>>('/settings'),
    
    resetSystem: () =>
        api.post<ApiResponse<null>>('/settings/reset'),
};