// frontend/src/components/Profile/ProfileComplete.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, message, Spin } from 'antd';
import { UserOutlined, PhoneOutlined, IdcardOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';
import { profileApi } from '../../api/profile';

const { Title, Text } = Typography;

const ProfileComplete: React.FC = () => {
    const navigate = useNavigate();
    const { user, setUser } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const onFinish = async (values: any) => {
        try {
            setLoading(true);
            const res = await profileApi.completeProfile(values);
            if (res.data.success) {
                // به‌روزرسانی کاربر در store
                if (user) {
                    setUser({ 
                        ...user, 
                        ...res.data.data,
                        is_profile_complete: true 
                    });
                }
                message.success('اطلاعات با موفقیت تکمیل شد');
                navigate('/');
            }
        } catch (error: any) {
            console.error('Error completing profile:', error);
            message.error(error.response?.data?.message || 'خطا در تکمیل اطلاعات');
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
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '20px',
        }}>
            <Card
                style={{
                    width: 480,
                    borderRadius: 16,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                }}
                bodyStyle={{ padding: 32 }}
            >
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{ fontSize: 48, marginBottom: 8 }}>📝</div>
                    <Title level={2} style={{ margin: 0 }}>تکمیل اطلاعات</Title>
                    <Text type="secondary">
                        لطفاً اطلاعات خود را تکمیل کنید
                    </Text>
                </div>

                <Spin spinning={loading}>
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        initialValues={{
                            full_name: user?.full_name || '',
                            phone: user?.phone || '',
                            national_code: user?.national_code || '',
                            personnel_code: user?.personnel_code || '',
                        }}
                    >
                        <Form.Item
                            name="full_name"
                            label="نام کامل"
                            rules={[{ required: true, message: 'لطفاً نام کامل را وارد کنید' }]}
                        >
                            <Input
                                prefix={<UserOutlined />}
                                placeholder="نام و نام خانوادگی"
                                size="large"
                            />
                        </Form.Item>

                        <Form.Item
                            name="national_code"
                            label="کد ملی"
                            rules={[
                                { required: true, message: 'لطفاً کد ملی را وارد کنید' },
                                { len: 10, message: 'کد ملی باید ۱۰ رقم باشد' },
                            ]}
                        >
                            <Input
                                prefix={<IdcardOutlined />}
                                placeholder="۱۲۳۴۵۶۷۸۹۰"
                                dir="ltr"
                                size="large"
                                maxLength={10}
                            />
                        </Form.Item>

                        <Form.Item
                            name="phone"
                            label="شماره تماس"
                            rules={[
                                { required: true, message: 'لطفاً شماره تماس را وارد کنید' },
                            ]}
                        >
                            <Input
                                prefix={<PhoneOutlined />}
                                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                                dir="ltr"
                                size="large"
                            />
                        </Form.Item>

                        <Form.Item
                            name="personnel_code"
                            label="کد پرسنلی"
                            rules={[{ required: true, message: 'لطفاً کد پرسنلی را وارد کنید' }]}
                        >
                            <Input
                                prefix={<IdcardOutlined />}
                                placeholder="کد پرسنلی"
                                size="large"
                            />
                        </Form.Item>

                        <Form.Item style={{ marginBottom: 0 }}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                block
                                loading={loading}
                                size="large"
                                style={{
                                    borderRadius: 10,
                                    height: 48,
                                    fontSize: 16,
                                }}
                            >
                                تکمیل اطلاعات و ورود
                            </Button>
                        </Form.Item>
                    </Form>
                </Spin>
            </Card>
        </div>
    );
};

export default ProfileComplete;