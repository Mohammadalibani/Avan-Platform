// frontend/src/components/Dashboard/Dashboard.tsx
import React from 'react';
import { Card, Row, Col, Statistic, Typography, Spin } from 'antd';
import { UserOutlined, ProjectOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';
import { useApiQuery } from '../../hooks/useApiQuery';
import { dashboardApi } from '../../api/dashboard';
import { DashboardStats } from '../../types';

const { Title } = Typography;

const Dashboard: React.FC = () => {
    const { user } = useAuthStore();
    
    const { data: stats, isLoading } = useApiQuery<DashboardStats>(
        ['dashboard', 'stats'],
        () => dashboardApi.getStats()
    );

    if (isLoading) {
        return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 50 }} />;
    }

    return (
        <div style={{ padding: 24 }}>
            <Title level={2}>خوش آمدید، {user?.full_name || 'کاربر'} 👋</Title>
            <p style={{ color: '#888', marginBottom: 24 }}>
                خلاصه وضعیت سیستم در یک نگاه
            </p>

            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="کاربران فعال"
                            value={stats?.totalUsers || 0}
                            prefix={<UserOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="پروژه‌ها"
                            value={stats?.totalProjects || 0}
                            prefix={<ProjectOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="تسک‌های انجام شده"
                            value={stats?.completedTasks || 0}
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ color: '#722ed1' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="تسک‌های در انتظار"
                            value={stats?.pendingTasks || 0}
                            prefix={<ClockCircleOutlined />}
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Dashboard;