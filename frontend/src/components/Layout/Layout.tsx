// frontend/src/components/Layout/Layout.tsx
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Menu, Button, Avatar, Dropdown, Space, MenuProps, Modal, Form, Input, Spin, message } from 'antd';
import {
    UserOutlined,
    LogoutOutlined,
    MenuOutlined,
    DownOutlined,
    LockOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';
import { User } from '../../types';
import { settingsApi, AppearanceSettings } from '../../api/settings';
import { usersApi } from '../../api/users';
import NotificationBell from '../Notifications/NotificationBell';
import '@fortawesome/fontawesome-free/css/all.min.css';

const { Header, Content, Sider } = AntLayout;

// ===== تابع کمکی برای دریافت نقش کاربر =====
const getEffectiveRole = (user: User | null): string => {
    if (!user) return 'subordinate';
    if (user.role) return user.role;
    if (user.roles && user.roles.length > 0) {
        return user.roles[0];
    }
    return 'subordinate';
};

// ===== تابع کمکی برای نقش فارسی =====
const getRolePersian = (role: string): string => {
    const map: Record<string, string> = {
        admin: 'مدیر کل سیستم',
        org_manager: 'مدیر سازمان',
        dept_manager: 'مدیر اداره',
        hr_manager: 'مدیر منابع انسانی',
        unit_supervisor: 'سرپرست واحد',
        subordinate: 'کاربر عادی'
    };
    return map[role] || role;
};

const Layout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuthStore();
    const [collapsed, setCollapsed] = useState(false);
    const [appearance, setAppearance] = useState<AppearanceSettings>({
        header_title: 'سامانه آوان',
        header_color: '#ffffff',
        header_text_color: '#1a1a2e',
        logo: null,
    });
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);
    const [passwordForm] = Form.useForm();
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const role = getEffectiveRole(user);
    const currentDate = new Date();
    const persianDate = currentDate.toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).replace(/\//g, '/');
    const persianTime = currentDate.toLocaleTimeString('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
    });

    // ===== دریافت تنظیمات ظاهر =====
    useEffect(() => {
        fetchAppearance();
    }, []);

    const fetchAppearance = async () => {
        try {
            const res = await settingsApi.getAppearance();
            if (res.data.success) {
                setAppearance(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching appearance:', error);
        }
    };

    // ===== تغییر رمز عبور =====
    const handleChangePassword = async (values: { current_password: string; new_password: string; confirm_password: string }) => {
        if (values.new_password !== values.confirm_password) {
            message.error('رمز عبور جدید و تکرار آن مطابقت ندارند');
            return;
        }
        
        try {
            setPasswordLoading(true);
            const res = await usersApi.changePassword({
                old_password: values.current_password,
                new_password: values.new_password
            });
            if (res.data.success) {
                message.success('رمز عبور با موفقیت تغییر کرد');
                setPasswordModalVisible(false);
                passwordForm.resetFields();
            }
        } catch (error: any) {
            console.error('Error changing password:', error);
            message.error(error.response?.data?.message || 'خطا در تغییر رمز عبور');
        } finally {
            setPasswordLoading(false);
        }
    };

    // ===== منوی اصلی بر اساس نقش =====
    const getMenuItems = () => {
        const baseItems = [
            { key: '/', icon: <i className="fas fa-home" />, label: 'داشبورد' },
            { key: '/profile', icon: <i className="fas fa-user" />, label: 'پروفایل' },
        ];

        const unitSupervisorItems = [
            { key: '/unit-supervisor/dashboard', icon: <i className="fas fa-users-cog" />, label: 'کارکرد پرسنل' },
            { key: '/unit-supervisor/requests', icon: <i className="fas fa-list-alt" />, label: 'درخواست‌های پرسنل' },
        ];

        const deptManagerItems = [
            { key: '/dept-manager/dashboard', icon: <i className="fas fa-building" />, label: 'مدیریت اداره' },
        ];

        const orgManagerItems = [
            { key: '/org-manager/dashboard', icon: <i className="fas fa-sitemap" />, label: 'مدیریت سازمان' },
        ];

        const hrManagerItems = [
            { key: '/hr-manager/dashboard', icon: <i className="fas fa-user-friends" />, label: 'مدیریت منابع انسانی' },
        ];

        const subordinateItems = [
            { key: '/requests', icon: <i className="fas fa-clipboard-list" />, label: 'درخواست‌ها' },
            { key: '/tickets', icon: <i className="fas fa-ticket-alt" />, label: 'تیکت‌ها' },
            { key: '/work-messages', icon: <i className="fas fa-envelope" />, label: 'پیام‌های کاری' },
        ];

        const adminItems = [
            { key: '/admin/dashboard', icon: <i className="fas fa-chart-pie" />, label: 'داشبورد مدیریت' },
            { key: '/admin/users', icon: <i className="fas fa-users" />, label: 'مدیریت کاربران' },
            { key: '/admin/personnel', icon: <i className="fas fa-user-tie" />, label: 'مدیریت پرسنل' },
            { key: '/admin/departments', icon: <i className="fas fa-building" />, label: 'مدیریت ادارات' },
            { key: '/admin/units', icon: <i className="fas fa-folder-open" />, label: 'مدیریت واحدها' },
            { key: '/admin/fields', icon: <i className="fas fa-cogs" />, label: 'مدیریت فیلدها' },
            { key: '/admin/periods', icon: <i className="fas fa-calendar-alt" />, label: 'مدیریت دوره‌ها' },
            { key: '/admin/approvals', icon: <i className="fas fa-check-double" />, label: 'درخواست‌های تایید' },
            { key: '/admin/settings', icon: <i className="fas fa-wrench" />, label: 'تنظیمات' },
            { key: '/admin/inbox', icon: <i className="fas fa-inbox" />, label: 'صندوق پیام' },
            { key: '/admin/excel-template', icon: <i className="fas fa-file-excel" />, label: 'قالب اکسل' },
        ];

        let items = [];

        switch (role) {
            case 'admin':
                items = [...baseItems, ...adminItems, ...subordinateItems];
                break;
            case 'hr_manager':
                items = [...baseItems, ...hrManagerItems, ...subordinateItems];
                break;
            case 'org_manager':
                items = [...baseItems, ...orgManagerItems, ...subordinateItems];
                break;
            case 'dept_manager':
                items = [...baseItems, ...deptManagerItems, ...subordinateItems];
                break;
            case 'unit_supervisor':
                items = [...baseItems, ...unitSupervisorItems, ...subordinateItems];
                break;
            default:
                items = [...baseItems, ...subordinateItems];
        }

        return items;
    };

    const handleMenuClick = (e: any) => {
        navigate(e.key);
    };

    // ===== منوی کاربر =====
    const userMenuItems: MenuProps['items'] = [
        {
            key: 'user_info',
            label: (
                <div style={{ 
                    textAlign: 'center', 
                    padding: '16px 0 14px 0',
                    borderBottom: '1px solid #f0f0f0',
                    marginBottom: 4,
                }}>
                    <div style={{
                        position: 'relative',
                        display: 'inline-block',
                        marginBottom: 8,
                    }}>
                        <Avatar 
                            size={64} 
                            src={user?.avatar} 
                            icon={<UserOutlined />}
                            style={{ 
                                backgroundColor: '#1890ff',
                                border: '3px solid #e6f7ff',
                            }}
                        />
                        <div style={{
                            position: 'absolute',
                            bottom: 2,
                            right: 0,
                            backgroundColor: '#52c41a',
                            width: 14,
                            height: 14,
                            borderRadius: '50%',
                            border: '2px solid #fff',
                        }} />
                    </div>
                    <div style={{ fontWeight: '600', fontSize: 15, color: '#1a1a2e' }}>
                        {user?.full_name || 'کاربر'}
                    </div>
                    <div style={{ 
                        fontSize: 12, 
                        color: '#1890ff',
                        backgroundColor: '#e6f7ff',
                        padding: '2px 14px',
                        borderRadius: 12,
                        display: 'inline-block',
                        marginTop: 2,
                    }}>
                        {getRolePersian(role)}
                    </div>
                    <div style={{ 
                        fontSize: 11, 
                        color: '#8c8c8c',
                        marginTop: 6,
                        backgroundColor: '#fafafa',
                        padding: '4px 12px',
                        borderRadius: 4,
                        direction: 'ltr',
                    }}>
                        <i className="fas fa-clock" style={{ marginLeft: 4, color: '#bfbfbf' }} />
                        آخرین بازدید: {user?.last_login ? new Date(user.last_login).toLocaleDateString('fa-IR') + ' - ' + new Date(user.last_login).toLocaleTimeString('fa-IR') : 'امروز'}
                    </div>
                </div>
            ),
            disabled: true,
        },
        {
            key: 'profile',
            label: (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0' }}>
                    <i className="fas fa-user" style={{ fontSize: 15, color: '#555', width: 20, textAlign: 'center' }} />
                    <span style={{ fontSize: 13 }}>پروفایل کاربری</span>
                </div>
            ),
            onClick: () => navigate('/profile'),
        },
        {
            key: 'change_password',
            label: (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0' }}>
                    <i className="fas fa-lock" style={{ fontSize: 15, color: '#555', width: 20, textAlign: 'center' }} />
                    <span style={{ fontSize: 13 }}>تغییر رمز عبور</span>
                </div>
            ),
            onClick: () => setPasswordModalVisible(true),
        },
        { type: 'divider' },
        {
            key: 'logout',
            label: (
                <div 
                    style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 12, 
                        padding: '6px 0',
                        borderRadius: 6,
                        transition: 'all 0.3s ease',
                    }}
                    className="logout-menu-item"
                >
                    <i className="fas fa-sign-out-alt" style={{ fontSize: 15, color: '#ff4d4f', width: 20, textAlign: 'center' }} />
                    <span style={{ fontSize: 13, color: '#ff4d4f' }}>خروج از حساب</span>
                </div>
            ),
            danger: true,
            onClick: async () => {
                await logout();
                navigate('/login');
            },
        },
    ];

    const selectedKey = location.pathname;

    const headerBgColor = appearance.header_color || '#ffffff';
    const headerTextColor = appearance.header_text_color || '#1a1a2e';
    const isLightHeader = headerBgColor === '#ffffff' || headerBgColor === '#fff';

    // استایل‌های انیمیشن
    const headerStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        background: headerBgColor,
        borderBottom: `1px solid ${isLightHeader ? '#e8e8e8' : 'rgba(255,255,255,0.1)'}`,
        position: 'sticky' as const,
        top: 0,
        zIndex: 100,
        direction: 'rtl' as const,
        transition: 'all 0.3s ease',
        boxShadow: isLightHeader ? '0 1px 4px rgba(0,0,0,0.04)' : '0 1px 4px rgba(0,0,0,0.1)',
    };

    const userButtonStyle = {
        cursor: 'pointer',
        padding: '6px 14px',
        borderRadius: '10px',
        transition: 'all 0.3s ease',
        background: dropdownOpen ? (isLightHeader ? '#f0f0f0' : 'rgba(255,255,255,0.12)') : 'transparent',
        border: `1px solid ${isLightHeader ? 'transparent' : 'rgba(255,255,255,0.08)'}`,
    };

    return (
        <AntLayout style={{ minHeight: '100vh' }}>
            {/* ===== هدر ===== */}
            <Header style={headerStyle}>
                {/* ===== سمت راست: همبرگر + لوگو + عنوان ===== */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Button
                        type="text"
                        icon={<MenuOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        style={{ 
                            fontSize: 16, 
                            color: headerTextColor,
                            transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = isLightHeader ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                        }}
                    />
                    {appearance.logo && (
                        <img 
                            src={appearance.logo} 
                            alt="logo" 
                            style={{ height: 40, width: 'auto', transition: 'all 0.3s ease' }}
                        />
                    )}
                    <div 
                        style={{ 
                            fontSize: 20, 
                            fontWeight: 'bold', 
                            color: headerTextColor, 
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                        }}
                        onClick={() => navigate('/')}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '0.8';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '1';
                        }}
                    >
                        {appearance.header_title || 'سامانه آوان'}
                    </div>
                </div>

                {/* ===== سمت چپ: زنگوله + نام کاربر + تاریخ + عکس ===== */}
                <Space size="large" align="center">
                    <div style={{ transform: 'scale(1.1)' }}>
                        <NotificationBell />
                    </div>

                    <Dropdown
                        menu={{ items: userMenuItems }}
                        placement="bottomRight"
                        trigger={['click']}
                        onOpenChange={(open) => setDropdownOpen(open)}
                    >
                        <div style={userButtonStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ textAlign: 'left', lineHeight: 1.3 }}>
                                    <div style={{ 
                                        fontWeight: '600', 
                                        fontSize: 14, 
                                        color: '#1a1a2e',
                                        letterSpacing: '0.3px',
                                    }}>
                                        {user?.full_name || 'کاربر'}
                                    </div>
                                    <div style={{ 
                                        fontSize: 11, 
                                        color: '#8c8c8c',
                                        direction: 'ltr',
                                        letterSpacing: '0.2px',
                                    }}>
                                        {persianDate} - {persianTime}
                                    </div>
                                </div>
                                <DownOutlined style={{ 
                                    fontSize: 10, 
                                    color: '#8c8c8c',
                                    transition: 'transform 0.3s ease',
                                    transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                }} />
                                <div
                                    style={{
                                        transition: 'transform 0.3s ease',
                                        cursor: 'pointer',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'scale(1.05)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'scale(1)';
                                    }}
                                >
                                    <Avatar
                                        src={user?.avatar}
                                        icon={<UserOutlined />}
                                        style={{ backgroundColor: '#1890ff' }}
                                        size={38}
                                    />
                                </div>
                            </div>
                        </div>
                    </Dropdown>
                </Space>
            </Header>

            {/* ===== بدنه ===== */}
            <AntLayout style={{ direction: 'rtl' }}>
                <Sider
                    width={250}
                    collapsible
                    collapsed={collapsed}
                    onCollapse={setCollapsed}
                    style={{ 
                        background: '#fff', 
                        borderRight: '1px solid #f0f0f0',
                        transition: 'all 0.3s ease',
                    }}
                    trigger={null}
                >
                    <Menu
                        mode="inline"
                        selectedKeys={[selectedKey]}
                        items={getMenuItems()}
                        onClick={handleMenuClick}
                        style={{ 
                            height: '100%', 
                            borderRight: 0, 
                            paddingTop: 8,
                        }}
                    />
                </Sider>
                <Content style={{ padding: 24, minHeight: 280, background: '#f0f2f5' }}>
                    <Outlet />
                </Content>
            </AntLayout>

            {/* ===== مودال تغییر رمز عبور ===== */}
            <Modal
                title={<span style={{ fontSize: 16, fontWeight: 600 }}>🔒 تغییر رمز عبور</span>}
                open={passwordModalVisible}
                onCancel={() => {
                    setPasswordModalVisible(false);
                    passwordForm.resetFields();
                }}
                footer={null}
                width={450}
                destroyOnClose
            >
                <Spin spinning={passwordLoading}>
                    <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword}>
                        <Form.Item
                            name="current_password"
                            label="رمز عبور فعلی"
                            rules={[{ required: true, message: 'لطفاً رمز عبور فعلی را وارد کنید' }]}
                        >
                            <Input.Password 
                                placeholder="رمز عبور فعلی" 
                                prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                                size="large"
                            />
                        </Form.Item>

                        <Form.Item
                            name="new_password"
                            label="رمز عبور جدید"
                            rules={[
                                { required: true, message: 'لطفاً رمز عبور جدید را وارد کنید' },
                                { min: 4, message: 'حداقل ۴ کاراکتر' },
                            ]}
                        >
                            <Input.Password 
                                placeholder="رمز عبور جدید" 
                                prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                                size="large"
                            />
                        </Form.Item>

                        <Form.Item
                            name="confirm_password"
                            label="تکرار رمز عبور جدید"
                            rules={[
                                { required: true, message: 'لطفاً رمز عبور را تکرار کنید' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('new_password') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('رمز عبور جدید و تکرار آن مطابقت ندارند'));
                                    },
                                }),
                            ]}
                        >
                            <Input.Password 
                                placeholder="تکرار رمز عبور جدید" 
                                prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                                size="large"
                            />
                        </Form.Item>

                        <Form.Item style={{ marginBottom: 0 }}>
                            <Space style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                <Button 
                                    onClick={() => {
                                        setPasswordModalVisible(false);
                                        passwordForm.resetFields();
                                    }}
                                    size="large"
                                >
                                    انصراف
                                </Button>
                                <Button 
                                    type="primary" 
                                    htmlType="submit" 
                                    loading={passwordLoading}
                                    size="large"
                                    style={{ borderRadius: 8 }}
                                >
                                    تغییر رمز عبور
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Spin>
            </Modal>

            {/* ===== استایل سفارشی برای دکمه خروج ===== */}
            <style>{`
                .logout-menu-item:hover {
                    background-color: #fff1f0 !important;
                }
                .logout-menu-item:hover i,
                .logout-menu-item:hover span {
                    color: #ff4d4f !important;
                }
                .ant-dropdown-menu-item-danger:hover {
                    background-color: #fff1f0 !important;
                }
                .ant-dropdown-menu-item-danger:hover .logout-menu-item i,
                .ant-dropdown-menu-item-danger:hover .logout-menu-item span {
                    color: #ff4d4f !important;
                }
            `}</style>
        </AntLayout>
    );
};

export default Layout;