// frontend/src/components/Auth/Login.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';
import './Login.css';

const { Text } = Typography;

const Login: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true);

    const onFinish = async (values: { username: string; password: string }) => {
        try {
            setLoading(true);
            await login(values.username, values.password);
            message.success('ورود موفقیت‌آمیز');
            navigate('/');
        } catch (error: any) {
            console.error('Login failed:', error);
            message.error(error.response?.data?.message || 'خطا در ورود');
        } finally {
            setLoading(false);
        }
    };

    const onRegisterFinish = async (values: { national_code: string; password: string }) => {
        try {
            setLoading(true);
            // API ثبت‌نام
            message.success('ثبت‌نام با موفقیت انجام شد');
            setIsLogin(true);
        } catch (error: any) {
            console.error('Register failed:', error);
            message.error(error.response?.data?.message || 'خطا در ثبت‌نام');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                {/* پس‌زمینه متحرک با افکت شیشه‌ای */}
                <div className={`card-bg ${isLogin ? 'login' : ''}`}>
                    <div className="card-bg-glow" />
                </div>

                {/* ===== پنل ثبت‌نام (سمت راست) ===== */}
                <div className={`hero-panel register ${!isLogin ? 'active' : ''}`}>
                    <div className="hero-content">
                        <h2>خوش آمدید!</h2>
                        <p>برای ورود به سامانه، لطفاً وارد حساب کاربری خود شوید</p>
                        <button className="hero-btn" onClick={() => setIsLogin(true)}>
                            ورود
                        </button>
                    </div>
                </div>

                {/* ===== فرم ثبت‌نام ===== */}
                <div className={`form-panel register ${!isLogin ? 'active' : ''}`}>
                    <div className="form-content">
                        <h2>ثبت‌نام</h2>
                        <p>با ثبت‌نام در سامانه کارکرد آوان</p>

                        <Form
                            name="register"
                            onFinish={onRegisterFinish}
                            layout="vertical"
                            size="large"
                        >
                            <Form.Item
                                name="national_code"
                                rules={[
                                    { required: true, message: 'لطفاً کد ملی را وارد کنید' },
                                    { len: 10, message: 'کد ملی باید ۱۰ رقم باشد' },
                                ]}
                            >
                                <Input
                                    prefix={<UserOutlined />}
                                    placeholder="کد ملی"
                                    dir="ltr"
                                />
                            </Form.Item>

                            <Form.Item
                                name="password"
                                rules={[
                                    { required: true, message: 'لطفاً رمز عبور را وارد کنید' },
                                    { min: 4, message: 'حداقل ۴ کاراکتر' },
                                ]}
                            >
                                <Input.Password
                                    prefix={<LockOutlined />}
                                    placeholder="رمز عبور"
                                />
                            </Form.Item>

                            <Form.Item style={{ marginBottom: 0 }}>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    block
                                    loading={loading}
                                    className="submit-btn"
                                >
                                    ثبت‌نام
                                </Button>
                            </Form.Item>
                        </Form>
                    </div>
                </div>

                {/* ===== پنل ورود (سمت چپ) ===== */}
                <div className={`hero-panel login ${isLogin ? 'active' : ''}`}>
                    <div className="hero-content">
                        <h2>سلام کاربر گرامی</h2>
                        <p>با ورود به سامانه، از امکانات پیشرفته مدیریت کارکرد بهره‌مند شوید</p>
                        <button className="hero-btn" onClick={() => setIsLogin(false)}>
                            ثبت‌نام
                        </button>
                    </div>
                </div>

                {/* ===== فرم ورود ===== */}
                <div className={`form-panel login ${isLogin ? 'active' : ''}`}>
                    <div className="form-content">
                        <h2>ورود به سامانه کارکرد آوان</h2>

                        <Form
                            name="login"
                            onFinish={onFinish}
                            layout="vertical"
                            size="large"
                        >
                            <Form.Item
                                name="username"
                                rules={[{ required: true, message: 'لطفاً نام کاربری را وارد کنید' }]}
                            >
                                <Input
                                    prefix={<UserOutlined />}
                                    placeholder="کد ملی / نام کاربری"
                                    dir="ltr"
                                />
                            </Form.Item>

                            <Form.Item
                                name="password"
                                rules={[{ required: true, message: 'لطفاً رمز عبور را وارد کنید' }]}
                            >
                                <Input.Password
                                    prefix={<LockOutlined />}
                                    placeholder="رمز عبور"
                                />
                            </Form.Item>

                            <Form.Item style={{ marginBottom: 0 }}>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    block
                                    loading={loading}
                                    className="submit-btn"
                                >
                                    ورود
                                </Button>
                            </Form.Item>

                            <div className="footer-links">
                                <Text type="secondary">ورود ویژه پرسنل</Text>
                            </div>
                        </Form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;