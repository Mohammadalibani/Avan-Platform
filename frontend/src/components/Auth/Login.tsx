// frontend/src/components/Auth/Login.tsx
import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';

const { Title, Text } = Typography;

const Login: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const { login } = useAuthStore();

    const onFinish = async (values: { username: string; password: string }) => {
        setLoading(true);
        try {
            await login(values.username, values.password);
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '100vh',
            background: '#f0f2f5'
        }}>
            <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <Title level={2}>Avan Platform</Title>
                    <Text type="secondary">Sign in to your account</Text>
                </div>
                <Form
                    name="login"
                    onFinish={onFinish}
                    autoComplete="off"
                    size="large"
                >
                    <Form.Item
                        name="username"
                        rules={[{ required: true, message: 'Please input your username!' }]}
                    >
                        <Input prefix={<UserOutlined />} placeholder="Username" defaultValue="admin" />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Please input your password!' }]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Password" defaultValue="admin123" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block>
                            {loading ? 'Logging in...' : 'Login'}
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default Login;