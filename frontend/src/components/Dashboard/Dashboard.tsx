// frontend/src/components/Dashboard/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Statistic } from 'antd';
import { ProjectOutlined, UnorderedListOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';
import { projectsApi } from '../../api/projects';
import { tasksApi } from '../../api/tasks';

const { Title } = Typography;

const Dashboard: React.FC = () => {
    const { user } = useAuthStore();
    const [stats, setStats] = useState({
        projects: 0,
        tasks: 0,
        completed: 0,
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [projectsRes, tasksRes] = await Promise.all([
                    projectsApi.getAll(),
                    tasksApi.getAll(),
                ]);
                setStats({
                    projects: projectsRes.data.data?.length || 0,
                    tasks: tasksRes.data.data?.length || 0,
                    completed: tasksRes.data.data?.filter((t: any) => t.status === 'completed').length || 0,
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
            }
        };
        fetchStats();
    }, []);

    return (
        <div>
            <Title level={2}>Welcome, {user?.full_name || user?.username}!</Title>
            
            <Row gutter={24} style={{ marginTop: 24 }}>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Total Projects"
                            value={stats.projects}
                            prefix={<ProjectOutlined />}
                            // استفاده از styles.content به جای valueStyle
                            styles={{ content: { color: '#1890ff' } }}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Total Tasks"
                            value={stats.tasks}
                            prefix={<UnorderedListOutlined />}
                            styles={{ content: { color: '#faad14' } }}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Completed Tasks"
                            value={stats.completed}
                            prefix={<CheckCircleOutlined />}
                            styles={{ content: { color: '#52c41a' } }}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Dashboard;