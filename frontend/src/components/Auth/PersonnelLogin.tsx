// frontend/src/components/Auth/PersonnelLogin.tsx
import React, { useState } from 'react';
import {
    Card,
    Form,
    Input,
    Button,
    Typography,
    message,
    Spin,
    Space,
    Alert,
} from 'antd';
import {
    UserOutlined,
    LockOutlined,
    ArrowLeftOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const { Title, Text } = Typography;

const PersonnelLogin: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const onFinish = async (values: { personnel_code: string; password: string }) => {
        try {
            setLoading(true);
            // در اینجا باید API مخصوص ورود پرسنل را صدا بزنیم
            // فعلاً از login معمولی استفاده می‌کنیم
            await login(values.personnel_code, values.password);
            setShowSuccess(true);
            setTimeout(() => {
                navigate('/');
            }, 1500);
        } catch (error: any) {
            console.error('Personnel login failed:', error);
            message.error(error.response?.data?.message || 'خطا در ورود');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
        >
            <Card
                style={{
                    width: 420,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    borderRadius: 16,
                }}
                bodyStyle={{ padding: 32 }}
            >
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ fontSize: 48, marginBottom: 8 }}>👤</div>
                    <Title level={2} style={{ margin: 0 }}>ورود پرسنل</Title>
                    <Text type="secondary">سامانه آوان - ورود اختصاصی پرسنل</Text>
                </div>

                {showSuccess && (
                    <Alert
                        message="ورود موفقیت‌آمیز"
                        description="در حال انتقال به داشبورد..."
                        type="success"
                        showIcon
                        icon={<CheckCircleOutlined />}
                        style={{ marginBottom: 16 }}
                    />
                )}

                <Spin spinning={loading}>
                    <Form
                        name="personnel_login"
                        onFinish={onFinish}
                        layout="vertical"
                        size="large"
                    >
                        <Form.Item
                            name="personnel_code"
                            label="کد پرسنلی"
                            rules={[
                                { required: true, message: 'لطفاً کد پرسنلی را وارد کنید' },
                            ]}
                        >
                            <Input
                                prefix={<UserOutlined />}
                                placeholder="مثال: EMP001"
                                dir="ltr"
                            />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            label="رمز عبور"
                            rules={[
                                { required: true, message: 'لطفاً رمز عبور را وارد کنید' },
                            ]}
                        >
                            <Input.Password
                                prefix={<LockOutlined />}
                                placeholder="رمز عبور"
                            />
                        </Form.Item>

                        <Form.Item style={{ marginBottom: 8 }}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                block
                                loading={loading}
                            >
                                ورود به سامانه
                            </Button>
                        </Form.Item>

                        <div style={{ textAlign: 'center', marginTop: 16 }}>
                            <Space>
                                <Button
                                    type="link"
                                    icon={<ArrowLeftOutlined />}
                                    onClick={() => navigate('/login')}
                                >
                                    بازگشت به صفحه ورود اصلی
                                </Button>
                            </Space>
                        </div>

                        <div style={{ textAlign: 'center', marginTop: 16 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                راهنمای ورود برای پرسنل جدید:
                                <br />
                                کد پرسنلی خود را از واحد منابع انسانی دریافت کنید.
                                <br />
                                رمز عبور پیش‌فرض: ۴ رقم آخر کد ملی
                            </Text>
                        </div>
                    </Form>
                </Spin>
            </Card>
        </div>
    );
};

export default PersonnelLogin;