// frontend/src/components/Layout/Layout.tsx
import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Layout as AntLayout, Menu, Button, Typography, Space } from 'antd';
import { 
  DashboardOutlined, 
  ProjectOutlined, 
  UnorderedListOutlined, 
  UserOutlined, 
  LogoutOutlined 
} from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';

const { Header, Content } = AntLayout;
const { Title } = Typography;

const Layout: React.FC = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = [
        { key: '/', icon: <DashboardOutlined />, label: <Link to="/">Dashboard</Link> },
        { key: '/projects', icon: <ProjectOutlined />, label: <Link to="/projects">Projects</Link> },
        { key: '/tasks', icon: <UnorderedListOutlined />, label: <Link to="/tasks">Tasks</Link> },
        { key: '/users', icon: <UserOutlined />, label: <Link to="/users">Users</Link> },
    ];

    return (
        <AntLayout style={{ minHeight: '100vh' }}>
            <Header style={{ display: 'flex', alignItems: 'center', padding: '0 24px' }}>
                <Title level={4} style={{ color: 'white', margin: 0, marginRight: 40 }}>
                    Avan Platform
                </Title>
                <Menu
                    theme="dark"
                    mode="horizontal"
                    items={menuItems}
                    style={{ flex: 1 }}
                />
                <Space>
                    <span style={{ color: 'white' }}>
                        {user?.full_name || user?.username}
                    </span>
                    <Button 
                        type="primary" 
                        icon={<LogoutOutlined />} 
                        onClick={handleLogout}
                    >
                        Logout
                    </Button>
                </Space>
            </Header>
            <Content style={{ padding: '24px', background: '#f0f2f5' }}>
                <Outlet />
            </Content>
        </AntLayout>
    );
};

export default Layout;