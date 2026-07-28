// frontend/src/components/Notifications/NotificationBell.tsx
import React, { useState, useEffect } from 'react';
import { Badge, Dropdown, List, Button, Typography, Space, Spin, message } from 'antd';
import { BellOutlined, CheckOutlined } from '@ant-design/icons';
import { notificationApi, Notification } from '../../api/notifications';
import { useAuthStore } from '../../store/authStore';

const { Text } = Typography;

const NotificationBell: React.FC = () => {
    const { user } = useAuthStore();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (user) {
            fetchNotifications();
        }
    }, [user]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await notificationApi.getNotifications();
            if (res.data.success) {
                setNotifications(res.data.data.notifications || []);
                setUnreadCount(res.data.data.unread_count || 0);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
            setNotifications([]);
            setUnreadCount(0);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id: number) => {
        try {
            const res = await notificationApi.markAsRead(id);
            if (res.data.success) {
                setNotifications(notifications.map(n => 
                    n.id === id ? { ...n, is_read: true } : n
                ));
                setUnreadCount(Math.max(0, unreadCount - 1));
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const res = await notificationApi.markAllAsRead();
            if (res.data.success) {
                setNotifications(notifications.map(n => ({ ...n, is_read: true })));
                setUnreadCount(0);
                message.success('همه اعلان‌ها خوانده شدند');
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'warning': return '⚠️';
            default: return '📌';
        }
    };

    const renderContent = () => (
        <div style={{ 
            width: 380, 
            maxHeight: 420, 
            overflow: 'auto',
            background: '#fff',
            borderRadius: 8,
            boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
        }}>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '12px 16px',
                borderBottom: '1px solid #f0f0f0',
                position: 'sticky',
                top: 0,
                background: '#fff',
                zIndex: 1,
            }}>
                <Text strong>اعلان‌ها</Text>
                {unreadCount > 0 && (
                    <Button type="link" size="small" onClick={handleMarkAllAsRead}>
                        <CheckOutlined /> همه را خوانده
                    </Button>
                )}
            </div>
            <Spin spinning={loading}>
                {notifications.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
                        <BellOutlined style={{ fontSize: 32, marginBottom: 8 }} />
                        <div>هیچ اعلانی وجود ندارد</div>
                    </div>
                ) : (
                    <List
                        dataSource={notifications}
                        renderItem={(item) => (
                            <List.Item
                                style={{
                                    padding: '12px 16px',
                                    background: item.is_read ? 'transparent' : '#f0f7ff',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid #f5f5f5',
                                    transition: 'background 0.2s',
                                }}
                                onClick={() => !item.is_read && handleMarkAsRead(item.id)}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#f5f5f5';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = item.is_read ? 'transparent' : '#f0f7ff';
                                }}
                            >
                                <List.Item.Meta
                                    avatar={
                                        <span style={{ fontSize: 20 }}>
                                            {getNotificationIcon(item.type)}
                                        </span>
                                    }
                                    title={
                                        <Space>
                                            <Text strong={!item.is_read}>{item.title}</Text>
                                            {!item.is_read && (
                                                <Badge status="processing" />
                                            )}
                                        </Space>
                                    }
                                    description={
                                        <div>
                                            <div style={{ fontSize: 13, color: '#555' }}>{item.message}</div>
                                            <Text type="secondary" style={{ fontSize: 11 }}>
                                                {new Date(item.created_at).toLocaleString('fa-IR')}
                                            </Text>
                                        </div>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                )}
            </Spin>
        </div>
    );

    return (
        <Dropdown
            open={open}
            onOpenChange={setOpen}
            dropdownRender={() => renderContent()}
            placement="bottomRight"
            trigger={['click']}
        >
            <Badge count={unreadCount} size="small" offset={[-5, 5]}>
                <Button 
                    type="text" 
                    icon={<BellOutlined />} 
                    onClick={() => setOpen(!open)}
                    style={{ color: 'inherit' }}
                />
            </Badge>
        </Dropdown>
    );
};

export default NotificationBell;