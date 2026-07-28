// frontend/src/components/Profile/Profile.tsx
import React, { useState } from 'react';
import {
    Card,
    Typography,
    Tabs,
    Descriptions,
    Avatar,
    Space,
    Button,
    Form,
    Input,
    message,
    Spin,
    Badge,
    Row,
    Col,
    Divider,
} from 'antd';
import {
    UserOutlined,
    FileTextOutlined,
    MailOutlined,
    PhoneOutlined,
    CalendarOutlined,
    ClockCircleOutlined,
    SaveOutlined,
    LockOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';
import DocumentsSection from './DocumentsSection';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const Profile: React.FC = () => {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    const [passwordForm] = Form.useForm();

    // ===== ویرایش اطلاعات =====
    const handleUpdateProfile = async (values: any) => {
        try {
            setLoading(true);
            // در اینجا API به‌روزرسانی پروفایل را صدا بزنید
            message.success('اطلاعات با موفقیت به‌روزرسانی شد');
        } catch (error) {
            console.error('Error updating profile:', error);
            message.error('خطا در به‌روزرسانی اطلاعات');
        } finally {
            setLoading(false);
        }
    };

    // ===== تغییر رمز عبور =====
    const handleChangePassword = async (values: any) => {
        if (values.new_password !== values.confirm_password) {
            message.error('رمز عبور جدید و تکرار آن مطابقت ندارند');
            return;
        }
        try {
            setLoading(true);
            // در اینجا API تغییر رمز عبور را صدا بزنید
            message.success('رمز عبور با موفقیت تغییر کرد');
            passwordForm.resetFields();
        } catch (error) {
            console.error('Error changing password:', error);
            message.error('خطا در تغییر رمز عبور');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
            <Title level={2}>👤 پروفایل کاربری</Title>
            <Text type="secondary">مدیریت اطلاعات شخصی و مدارک</Text>

            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                {/* ===== کارت اطلاعات کاربر ===== */}
                <Col xs={24} lg={8}>
                    <Card style={{ textAlign: 'center' }}>
                        <Avatar
                            size={100}
                            icon={<UserOutlined />}
                            style={{ backgroundColor: '#1890ff' }}
                        />
                        <Title level={4} style={{ marginTop: 16 }}>
                            {user.full_name}
                        </Title>
                        <Text type="secondary">{user.role_persian || user.role}</Text>
                        <Divider />
                        <div style={{ textAlign: 'right' }}>
                            <Descriptions column={1} size="small">
                                <Descriptions.Item label="کد پرسنلی">
                                    {user.personnel_code || '-'}
                                </Descriptions.Item>
                                <Descriptions.Item label="کد ملی">
                                    {user.national_code || '-'}
                                </Descriptions.Item>
                                <Descriptions.Item label="شماره تماس">
                                    {user.phone || '-'}
                                </Descriptions.Item>
                                <Descriptions.Item label="وضعیت">
                                    <Badge
                                        status={user.is_active ? 'success' : 'error'}
                                        text={user.is_active ? 'فعال' : 'غیرفعال'}
                                    />
                                </Descriptions.Item>
                            </Descriptions>
                        </div>
                    </Card>
                </Col>

                {/* ===== تب‌های اطلاعات ===== */}
                <Col xs={24} lg={16}>
                    <Card>
                        <Tabs defaultActiveKey="1">
                            {/* ===== تب اطلاعات شخصی ===== */}
                            <TabPane
                                tab={<span><UserOutlined /> اطلاعات شخصی</span>}
                                key="1"
                            >
                                <Spin spinning={loading}>
                                    <Form
                                        form={form}
                                        layout="vertical"
                                        initialValues={{
                                            full_name: user.full_name,
                                            phone: user.phone,
                                            email: user.email,
                                            national_code: user.national_code,
                                        }}
                                        onFinish={handleUpdateProfile}
                                    >
                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item
                                                    name="full_name"
                                                    label="نام کامل"
                                                    rules={[{ required: true, message: 'لطفاً نام کامل را وارد کنید' }]}
                                                >
                                                    <Input placeholder="نام کامل" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item
                                                    name="phone"
                                                    label="شماره تماس"
                                                    rules={[{ required: true, message: 'لطفاً شماره تماس را وارد کنید' }]}
                                                >
                                                    <Input placeholder="۰۹۱۲۳۴۵۶۷۸۹" dir="ltr" />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item
                                                    name="email"
                                                    label="ایمیل"
                                                    rules={[{ type: 'email', message: 'ایمیل معتبر وارد کنید' }]}
                                                >
                                                    <Input placeholder="example@avan.com" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item
                                                    name="national_code"
                                                    label="کد ملی"
                                                >
                                                    <Input placeholder="۱۲۳۴۵۶۷۸۹۰" dir="ltr" disabled />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Form.Item>
                                            <Button
                                                type="primary"
                                                htmlType="submit"
                                                loading={loading}
                                                icon={<SaveOutlined />}
                                            >
                                                ذخیره اطلاعات
                                            </Button>
                                        </Form.Item>
                                    </Form>
                                </Spin>
                            </TabPane>

                            {/* ===== تب تغییر رمز عبور ===== */}
                            <TabPane
                                tab={<span><LockOutlined /> تغییر رمز عبور</span>}
                                key="2"
                            >
                                <Spin spinning={loading}>
                                    <Form
                                        form={passwordForm}
                                        layout="vertical"
                                        onFinish={handleChangePassword}
                                    >
                                        <Row gutter={16}>
                                            <Col span={24}>
                                                <Form.Item
                                                    name="current_password"
                                                    label="رمز عبور فعلی"
                                                    rules={[{ required: true, message: 'لطفاً رمز عبور فعلی را وارد کنید' }]}
                                                >
                                                    <Input.Password placeholder="رمز عبور فعلی" />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item
                                                    name="new_password"
                                                    label="رمز عبور جدید"
                                                    rules={[
                                                        { required: true, message: 'لطفاً رمز عبور جدید را وارد کنید' },
                                                        { min: 4, message: 'حداقل ۴ کاراکتر' },
                                                    ]}
                                                >
                                                    <Input.Password placeholder="رمز عبور جدید" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item
                                                    name="confirm_password"
                                                    label="تکرار رمز عبور جدید"
                                                    rules={[{ required: true, message: 'لطفاً رمز عبور را تکرار کنید' }]}
                                                >
                                                    <Input.Password placeholder="تکرار رمز عبور جدید" />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Form.Item>
                                            <Button
                                                type="primary"
                                                htmlType="submit"
                                                loading={loading}
                                                icon={<LockOutlined />}
                                            >
                                                تغییر رمز عبور
                                            </Button>
                                        </Form.Item>
                                    </Form>
                                </Spin>
                            </TabPane>

                            {/* ===== تب مدارک ===== */}
                            <TabPane
                                tab={<span><FileTextOutlined /> مدارک</span>}
                                key="3"
                            >
                                <DocumentsSection />
                            </TabPane>
                        </Tabs>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Profile;