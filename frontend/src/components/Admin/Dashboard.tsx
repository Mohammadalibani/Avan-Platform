// frontend/src/components/Admin/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import {
    Card,
    Row,
    Col,
    Statistic,
    Typography,
    Spin,
    message,
    Button,
    Space,
    Tag,
    Table,
    Alert,
} from 'antd';
import {
    UserOutlined,
    TeamOutlined,
    ApartmentOutlined,
    AppstoreOutlined,
    ReloadOutlined,
    PlusOutlined,
    FileTextOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';
import { adminApi, AdminStats } from '../../api/admin';
import { ActivityLog } from '../../types';
import DashboardCharts from '../Charts/DashboardCharts';
const { Title, Text } = Typography;

const AdminDashboard: React.FC = () => {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [activities, setActivities] = useState<ActivityLog[]>([]);

    // ========== بارگذاری داده‌ها ==========
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            
            const statsRes = await adminApi.getStats();
            if (statsRes.data.success) {
                setStats(statsRes.data.data);
            }

            // داده‌های آزمایشی برای فعالیت‌ها
            setActivities([
                { id: 1, user_name: 'احمدی', message: 'کاربر جدید اضافه شد', badge: 'success', created_at: new Date().toISOString() },
                { id: 2, user_name: 'کریمی', message: 'درخواست تایید شد', badge: 'info', created_at: new Date().toISOString() },
                { id: 3, user_name: 'محمدی', message: 'دوره جدید ایجاد شد', badge: 'warning', created_at: new Date().toISOString() },
            ]);
        } catch (error) {
            console.error('Error fetching data:', error);
            message.error('خطا در دریافت اطلاعات');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        fetchData();
        message.success('اطلاعات به‌روزرسانی شد');
    };

    // ========== نمایش ==========
    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}>
                <Spin size="large" />
            </div>
        );
    }
    <DashboardCharts />
    return (
        <div style={{ padding: 24 }}>
            {/* ===== هدر خوش‌آمدگویی ===== */}
            <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border: 'none' }}>
                <Row gutter={16} align="middle">
                    <Col flex="auto">
                        <Title level={3} style={{ color: 'white', margin: 0 }}>
                            👋 خوش آمدید {user?.full_name} عزیز
                        </Title>
                        <Space size="large" style={{ marginTop: 8 }}>
                            <Tag color="gold">👑 نقش: مدیر کل سیستم</Tag>
                            <Tag color="purple">🕒 تاریخ امروز: {new Date().toLocaleDateString('fa-IR')}</Tag>
                        </Space>
                    </Col>
                    <Col>
                        <Button type="primary" ghost icon={<ReloadOutlined />} onClick={handleRefresh}>
                            به‌روزرسانی
                        </Button>
                    </Col>
                </Row>
            </Card>

            {/* ===== هشدار مهلت باقی‌مانده ===== */}
            {stats?.days_remaining !== undefined && stats.days_remaining <= 10 && stats.days_remaining > 0 && (
                <Alert
                    message={`⚠️ مهلت باقی‌مانده تا سررسید: ${stats.days_remaining} روز`}
                    description={`دوره فعال "${stats.active_period?.title}" در تاریخ ${stats.active_period?.end_date} به پایان می‌رسد.`}
                    type="warning"
                    showIcon
                    style={{ marginBottom: 24 }}
                />
            )}

            {/* ===== دکمه‌های میانبر ===== */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={6} lg={4}>
                    <Button type="primary" block icon={<PlusOutlined />} style={{ height: 56 }}>
                        افزودن پرسنل
                    </Button>
                </Col>
                <Col xs={12} sm={6} lg={4}>
                    <Button block icon={<UserOutlined />} style={{ height: 56 }}>
                        افزودن کاربر
                    </Button>
                </Col>
                <Col xs={12} sm={6} lg={4}>
                    <Button block icon={<ApartmentOutlined />} style={{ height: 56 }}>
                        افزودن اداره
                    </Button>
                </Col>
                <Col xs={12} sm={6} lg={4}>
                    <Button block icon={<AppstoreOutlined />} style={{ height: 56 }}>
                        افزودن واحد
                    </Button>
                </Col>
                <Col xs={12} sm={6} lg={4}>
                    <Button block icon={<FileTextOutlined />} style={{ height: 56 }}>
                        افزودن دوره
                    </Button>
                </Col>
                <Col xs={12} sm={6} lg={4}>
                    <Button block icon={<TeamOutlined />} style={{ height: 56 }}>
                        مدیریت اعلان‌ها
                    </Button>
                </Col>
            </Row>

            {/* ===== کارت‌های آماری ===== */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="ادارات"
                            value={stats?.total_departments || 0}
                            prefix={<ApartmentOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="واحدها"
                            value={stats?.total_units || 0}
                            prefix={<AppstoreOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="پرسنل"
                            value={stats?.total_personnel || 0}
                            prefix={<TeamOutlined />}
                            valueStyle={{ color: '#722ed1' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="کاربران"
                            value={stats?.total_users || 0}
                            prefix={<UserOutlined />}
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* ===== فعالیت‌های اخیر ===== */}
            <Card title="📋 آخرین فعالیت‌ها">
                <Table
                    dataSource={activities}
                    columns={[
                        { 
                            title: 'زمان', 
                            dataIndex: 'created_at', 
                            key: 'created_at', 
                            render: (date: string) => new Date(date).toLocaleString('fa-IR') 
                        },
                        { title: 'کاربر', dataIndex: 'user_name', key: 'user_name' },
                        { title: 'پیام', dataIndex: 'message', key: 'message' },
                        { 
                            title: 'نوع', 
                            dataIndex: 'badge', 
                            key: 'badge', 
                            render: (badge: string) => {
                                const map: Record<string, { color: string; text: string }> = {
                                    success: { color: 'green', text: 'موفقیت' },
                                    info: { color: 'blue', text: 'اطلاعات' },
                                    warning: { color: 'orange', text: 'هشدار' },
                                    danger: { color: 'red', text: 'خطا' },
                                };
                                const item = map[badge] || { color: 'default', text: badge || 'عمومی' };
                                return <Tag color={item.color}>{item.text}</Tag>;
                            }
                        },
                    ]}
                    pagination={{ pageSize: 10 }}
                    rowKey="id"
                    bordered={false}
                    locale={{ emptyText: 'هیچ فعالیتی یافت نشد' }}
                />
            </Card>

            {/* ===== اطلاعات سیستم ===== */}
            <Card title="ℹ️ اطلاعات سیستم" style={{ marginTop: 16 }}>
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12}>
                        <div>
                            <Text strong>دوره فعال:</Text>
                            <div>{stats?.active_period?.title || 'هیچ دوره فعالی وجود ندارد'}</div>
                        </div>
                    </Col>
                    <Col xs={24} sm={12}>
                        <div>
                            <Text strong>تاریخ شروع:</Text>
                            <div>{stats?.active_period?.start_date || '-'}</div>
                        </div>
                    </Col>
                    <Col xs={24} sm={12}>
                        <div>
                            <Text strong>تاریخ پایان:</Text>
                            <div>{stats?.active_period?.end_date || '-'}</div>
                        </div>
                    </Col>
                    <Col xs={24} sm={12}>
                        <div>
                            <Text strong>مهلت باقی‌مانده:</Text>
                            <div>
                                {stats?.days_remaining !== undefined && stats.days_remaining > 0 ? (
                                    <Tag color={stats.days_remaining <= 10 ? 'red' : 'green'}>
                                        {stats.days_remaining} روز
                                    </Tag>
                                ) : stats?.days_remaining === 0 ? (
                                    <Tag color="red">امروز آخرین مهلت است</Tag>
                                ) : (
                                    <Tag color="default">-</Tag>
                                )}
                            </div>
                        </div>
                    </Col>
                </Row>
            </Card>
        </div>
    );
};

export default AdminDashboard;