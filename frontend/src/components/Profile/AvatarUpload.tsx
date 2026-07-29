// frontend/src/components/Profile/AvatarUpload.tsx
import React, { useState } from 'react';
import { Upload, Button, message, Avatar, Spin } from 'antd';
import { UploadOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import { profileApi } from '../../api/profile';
import { useAuthStore } from '../../store/authStore';

interface AvatarUploadProps {
    currentAvatar?: string;
    onAvatarChange?: (avatar: string) => void;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({ currentAvatar, onAvatarChange }) => {
    const { user, setUser } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [avatar, setAvatar] = useState<string | undefined>(currentAvatar || user?.avatar);

    const handleUpload = async (file: File) => {
        try {
            setLoading(true);
            const res = await profileApi.uploadAvatar(file);
            if (res.data.success) {
                const newAvatar = res.data.data.avatar;
                setAvatar(newAvatar);
                
                // به‌روزرسانی در store
                if (user) {
                    setUser({ ...user, avatar: newAvatar });
                }
                
                if (onAvatarChange) {
                    onAvatarChange(newAvatar);
                }
                
                message.success('عکس پروفایل با موفقیت آپلود شد');
            }
        } catch (error: any) {
            console.error('Error uploading avatar:', error);
            message.error(error.response?.data?.message || 'خطا در آپلود عکس');
        } finally {
            setLoading(false);
        }
        return false;
    };

    const handleDelete = async () => {
        try {
            setLoading(true);
            const res = await profileApi.deleteAvatar();
            if (res.data.success) {
                setAvatar(undefined);
                if (user) {
                    setUser({ ...user, avatar: undefined });
                }
                if (onAvatarChange) {
                    onAvatarChange('');
                }
                message.success('عکس پروفایل با موفقیت حذف شد');
            }
        } catch (error: any) {
            console.error('Error deleting avatar:', error);
            message.error(error.response?.data?.message || 'خطا در حذف عکس');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ textAlign: 'center' }}>
            <Spin spinning={loading}>
                <Avatar
                    size={100}
                    src={avatar}
                    icon={<UserOutlined />}
                    style={{ marginBottom: 16 }}
                />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <Upload
                        showUploadList={false}
                        beforeUpload={handleUpload}
                        accept="image/*"
                    >
                        <Button icon={<UploadOutlined />}>
                            انتخاب عکس
                        </Button>
                    </Upload>
                    {avatar && (
                        <Button icon={<DeleteOutlined />} danger onClick={handleDelete}>
                            حذف
                        </Button>
                    )}
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
                    فرمت‌های مجاز: JPG, PNG, GIF (حداکثر ۵ مگابایت)
                </div>
            </Spin>
        </div>
    );
};

export default AvatarUpload;