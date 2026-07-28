// frontend/src/components/Admin/Settings.tsx
import React, { useState, useEffect } from 'react';
import {
    Card,
    Tabs,
    Form,
    Input,
    Button,
    ColorPicker,
    Upload,
    message,
    Spin,
    Space,
    Typography,
    Row,
    Col,
    Select,
    Table,
    Popconfirm,
    Modal,
    TimePicker,
    Divider,
} from 'antd';
import {
    SaveOutlined,
    UploadOutlined,
    DownloadOutlined,
    DeleteOutlined,
    ReloadOutlined,
    CloudUploadOutlined,
    WarningOutlined,
} from '@ant-design/icons';
import { settingsApi, AppearanceSettings, NetworkSettings, BackupSettings } from '../../api/settings';
import { useAuthStore } from '../../store/authStore';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

const Settings: React.FC = () => {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('appearance');
    
    // ===== State =====
    const [appearance, setAppearance] = useState<AppearanceSettings>({
        header_title: 'سامانه آوان',
        header_color: '#1890ff',
        header_text_color: '#ffffff',
        logo: null,
    });
    const [network, setNetwork] = useState<NetworkSettings>({
        base_url: 'localhost',
        port: 5000,
    });
    const [backup, setBackup] = useState<BackupSettings>({
        auto_backup_time: '00:00',
        backups: [],
    });

    const [resetModalVisible, setResetModalVisible] = useState(false);

    // ===== بارگذاری داده‌ها =====
    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await settingsApi.getSettings();
            if (res.data.success) {
                const data = res.data.data;
                setAppearance(data.appearance);
                setNetwork(data.network);
                setBackup(data.backup);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            message.error('خطا در دریافت تنظیمات');
        } finally {
            setLoading(false);
        }
    };

    // ===== ذخیره تنظیمات =====
    const handleSaveAppearance = async (values: any) => {
        try {
            setSaving(true);
            await settingsApi.updateAppearance(values);
            message.success('تنظیمات ظاهر با موفقیت ذخیره شد');
            fetchSettings();
        } catch (error) {
            console.error('Error saving appearance:', error);
            message.error('خطا در ذخیره تنظیمات');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveNetwork = async (values: any) => {
        try {
            setSaving(true);
            await settingsApi.updateNetwork(values);
            message.success('تنظیمات شبکه با موفقیت ذخیره شد');
            fetchSettings();
        } catch (error) {
            console.error('Error saving network:', error);
            message.error('خطا در ذخیره تنظیمات');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveBackup = async (values: any) => {
        try {
            setSaving(true);
            await settingsApi.updateBackup(values);
            message.success('تنظیمات بکاپ با موفقیت ذخیره شد');
            fetchSettings();
        } catch (error) {
            console.error('Error saving backup:', error);
            message.error('خطا در ذخیره تنظیمات');
        } finally {
            setSaving(false);
        }
    };

    // ===== عملیات بکاپ =====
    const handleCreateBackup = async () => {
        try {
            const res = await settingsApi.createBackup();
            if (res.data.success) {
                message.success('بکاپ با موفقیت ایجاد شد');
                fetchSettings();
            }
        } catch (error) {
            console.error('Error creating backup:', error);
            message.error('خطا در ایجاد بکاپ');
        }
    };

    const handleDownloadBackup = async (filename: string) => {
        try {
            const res = await settingsApi.downloadBackup(filename);
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            message.success('دانلود بکاپ شروع شد');
        } catch (error) {
            console.error('Error downloading backup:', error);
            message.error('خطا در دانلود بکاپ');
        }
    };

    const handleDeleteBackup = async (filename: string) => {
        try {
            await settingsApi.deleteBackup(filename);
            message.success('بکاپ با موفقیت حذف شد');
            fetchSettings();
        } catch (error) {
            console.error('Error deleting backup:', error);
            message.error('خطا در حذف بکاپ');
        }
    };

    // ===== بازنشانی سیستم =====
    const handleResetSystem = async () => {
        try {
            await settingsApi.resetSystem();
            message.success('سیستم با موفقیت بازنشانی شد');
            setResetModalVisible(false);
        } catch (error) {
            console.error('Error resetting system:', error);
            message.error('خطا در بازنشانی سیستم');
        }
    };

    // ===== ستون‌های جدول بکاپ =====
    const backupColumns = [
        {
            title: 'نام فایل',
            dataIndex: 'filename',
            key: 'filename',
        },
        {
            title: 'حجم',
            dataIndex: 'size',
            key: 'size',
            render: (size: number) => {
                if (size < 1024) return `${size} B`;
                if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
                return `${(size / (1024 * 1024)).toFixed(1)} MB`;
            },
        },
        {
            title: 'تاریخ',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date: string) => new Date(date).toLocaleDateString('fa-IR'),
        },
        {
            title: 'عملیات',
            key: 'actions',
            render: (_: any, record: any) => (
                <Space>
                    <Button
                        type="text"
                        icon={<DownloadOutlined />}
                        onClick={() => handleDownloadBackup(record.filename)}
                    />
                    <Popconfirm
                        title="حذف بکاپ"
                        description={`آیا از حذف بکاپ "${record.filename}" اطمینان دارید؟`}
                        onConfirm={() => handleDeleteBackup(record.filename)}
                        okText="بله"
                        cancelText="انصراف"
                    >
                        <Button type="text" icon={<DeleteOutlined />} danger />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // ===== نمایش =====
    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div style={{ padding: 24 }}>
            <Title level={3}>🔧 تنظیمات سامانه</Title>
            <Text type="secondary">مدیریت تنظیمات ظاهر، شبکه و بکاپ‌گیری</Text>

            <Card style={{ marginTop: 16 }}>
                <Tabs activeKey={activeTab} onChange={setActiveTab}>
                    {/* ===== تب ظاهر ===== */}
                    <TabPane tab="🎨 ظاهر" key="appearance">
                        <Form
                            layout="vertical"
                            initialValues={appearance}
                            onFinish={handleSaveAppearance}
                        >
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item name="header_title" label="عنوان هدر">
                                        <Input />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="header_color" label="رنگ پس‌زمینه هدر">
                                        <ColorPicker showText />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item name="header_text_color" label="رنگ متن هدر">
                                        <ColorPicker showText />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item>
                                <Button type="primary" htmlType="submit" loading={saving} icon={<SaveOutlined />}>
                                    ذخیره تغییرات ظاهر
                                </Button>
                            </Form.Item>
                        </Form>
                    </TabPane>

                    {/* ===== تب شبکه ===== */}
                    <TabPane tab="🌐 شبکه" key="network">
                        <Form
                            layout="vertical"
                            initialValues={network}
                            onFinish={handleSaveNetwork}
                        >
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item name="base_url" label="آدرس IP یا دامنه">
                                        <Input placeholder="localhost یا 192.168.1.100" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="port" label="پورت">
                                        <Input type="number" placeholder="5000" />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item>
                                <Button type="primary" htmlType="submit" loading={saving} icon={<SaveOutlined />}>
                                    ذخیره تنظیمات شبکه
                                </Button>
                            </Form.Item>
                        </Form>
                    </TabPane>

                    {/* ===== تب بکاپ ===== */}
                    <TabPane tab="💾 بکاپ" key="backup">
                        <div style={{ marginBottom: 16 }}>
                            <Space>
                                <Form.Item label="زمان خودکار بکاپ" style={{ marginBottom: 0 }}>
                                    <TimePicker
                                        value={dayjs(backup.auto_backup_time, 'HH:mm')}
                                        format="HH:mm"
                                        onChange={(time) => {
                                            setBackup({
                                                ...backup,
                                                auto_backup_time: time?.format('HH:mm') || '00:00',
                                            });
                                        }}
                                    />
                                </Form.Item>
                                <Button
                                    type="primary"
                                    onClick={handleSaveBackup}
                                    loading={saving}
                                    icon={<SaveOutlined />}
                                >
                                    ذخیره زمان بکاپ
                                </Button>
                                <Button
                                    type="default"
                                    onClick={handleCreateBackup}
                                    icon={<CloudUploadOutlined />}
                                >
                                    ایجاد بکاپ دستی
                                </Button>
                            </Space>
                        </div>

                        <Table
                            dataSource={backup.backups}
                            columns={backupColumns}
                            rowKey="filename"
                            pagination={false}
                            locale={{ emptyText: 'هیچ بکاپی یافت نشد' }}
                        />
                    </TabPane>

                    {/* ===== تب مدیریت داده ===== */}
                    <TabPane tab="🗑️ مدیریت داده" key="data">
                        <Card title="عملیات حذف" bordered={false} style={{ background: '#fff2f0' }}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <div>
                                    <Text strong>⚠️ هشدار:</Text>
                                    <Text> این عملیات غیرقابل بازگشت است. لطفاً با دقت عمل کنید.</Text>
                                </div>
                                <Space>
                                    <Popconfirm
                                        title="حذف پرسنل"
                                        description="آیا از حذف تمام پرسنل دوره انتخاب‌شده اطمینان دارید؟"
                                        okText="بله، حذف کن"
                                        cancelText="انصراف"
                                        okButtonProps={{ danger: true }}
                                    >
                                        <Button danger>🗑️ حذف پرسنل دوره</Button>
                                    </Popconfirm>
                                    <Popconfirm
                                        title="حذف همه پرسنل"
                                        description="آیا از حذف تمام پرسنل اطمینان دارید؟"
                                        okText="بله، حذف کن"
                                        cancelText="انصراف"
                                        okButtonProps={{ danger: true }}
                                    >
                                        <Button danger>⚠️ حذف همه پرسنل</Button>
                                    </Popconfirm>
                                    <Popconfirm
                                        title="حذف همه کاربران"
                                        description="آیا از حذف همه کاربران (به جز ادمین) اطمینان دارید؟"
                                        okText="بله، حذف کن"
                                        cancelText="انصراف"
                                        okButtonProps={{ danger: true }}
                                    >
                                        <Button danger>⚠️ حذف همه کاربران</Button>
                                    </Popconfirm>
                                    <Button
                                        danger
                                        icon={<WarningOutlined />}
                                        onClick={() => setResetModalVisible(true)}
                                    >
                                        🔥 بازنشانی کامل سامانه
                                    </Button>
                                </Space>
                            </Space>
                        </Card>
                    </TabPane>
                </Tabs>
            </Card>

            {/* ===== مودال بازنشانی ===== */}
            <Modal
                title="⚠️ بازنشانی کامل سامانه"
                open={resetModalVisible}
                onCancel={() => setResetModalVisible(false)}
                onOk={handleResetSystem}
                okText="بله، بازنشانی کن"
                cancelText="انصراف"
                okButtonProps={{ danger: true }}
            >
                <div style={{ padding: 16 }}>
                    <Text strong style={{ color: 'red' }}>
                        هشدار: این عملیات غیرقابل بازگشت است!
                    </Text>
                    <div style={{ marginTop: 8 }}>
                        <Text>با بازنشانی کامل سامانه:</Text>
                        <ul>
                            <li>همه کاربران (به جز ادمین) حذف می‌شوند</li>
                            <li>همه پرسنل حذف می‌شوند</li>
                            <li>همه ادارات و واحدها حذف می‌شوند</li>
                            <li>همه فیلدهای پویا حذف می‌شوند</li>
                            <li>همه دوره‌ها حذف می‌شوند</li>
                            <li>همه درخواست‌ها حذف می‌شوند</li>
                        </ul>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Settings;