// frontend/src/components/HrManager/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import {
    Card,
    Row,
    Col,
    Statistic,
    Table,
    Typography,
    Spin,
    message,
    Select,
    Button,
    Space,
    Tag,
    Badge,
    Input,
    Tooltip,
    Modal,
    Form,
    Tabs,
    Image,
    Empty,
    Popconfirm,
} from 'antd';
import {
    UserOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined,
    FileDoneOutlined,
    FileTextOutlined,
    ReloadOutlined,
    SearchOutlined,
    EditOutlined,
    EyeOutlined,
    DownloadOutlined,
    DeleteOutlined,
    FileImageOutlined,
    CheckOutlined,
    CloseOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';
import { hrManagerApi, HrStats, UserDocument } from '../../api/hrManager';
import { User } from '../../types';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

const HrManagerDashboard: React.FC = () => {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<HrStats | null>(null);
    const [searchText, setSearchText] = useState('');
    const [selectedRole, setSelectedRole] = useState<string>();
    const [selectedStatus, setSelectedStatus] = useState<string>();
    const [pagination, setPagination] = useState({ current: 1, pageSize: 25, total: 0 });

    // ===== مودال‌ها =====
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [docModalVisible, setDocModalVisible] = useState(false);
    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userDocuments, setUserDocuments] = useState<UserDocument[]>([]);
    const [reviewingDoc, setReviewingDoc] = useState<UserDocument | null>(null);
    const [reviewNote, setReviewNote] = useState('');
    const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected'>('approved');
    const [reviewLoading, setReviewLoading] = useState(false);

    // ===== فرم ویرایش =====
    const [editForm] = Form.useForm();

    // ========== بارگذاری داده‌ها ==========
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                fetchStats(),
                fetchUsers(),
            ]);
        } catch (error) {
            console.error('Error fetching data:', error);
            message.error('خطا در دریافت اطلاعات');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await hrManagerApi.getStats();
            if (res.data.success) {
                setStats(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchUsers = async (page = 1) => {
        try {
            const res = await hrManagerApi.getUsers({
                search: searchText || undefined,
                role: selectedRole,
                status: selectedStatus,
                page,
                per_page: pagination.pageSize,
            });
            if (res.data.success) {
                setUsers(res.data.data.users);
                setPagination({
                    ...pagination,
                    current: page,
                    total: res.data.total || 0,
                });
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            message.error('خطا در دریافت کاربران');
        }
    };

    const fetchUserDocuments = async (userId: number) => {
        try {
            const res = await hrManagerApi.getUserDocuments(userId);
            if (res.data.success) {
                setUserDocuments(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching documents:', error);
            message.error('خطا در دریافت مدارک');
        }
    };

    // ========== تغییرات ==========
    const handleSearch = (value: string) => {
        setSearchText(value);
        fetchUsers(1);
    };

    const handleRoleChange = (value: string) => {
        setSelectedRole(value);
        fetchUsers(1);
    };

    const handleStatusChange = (value: string) => {
        setSelectedStatus(value);
        fetchUsers(1);
    };

    const handleRefresh = () => {
        fetchData();
        message.success('اطلاعات به‌روزرسانی شد');
    };

    // ========== عملیات کاربران ==========
    const handleEditUser = (user: User) => {
        setSelectedUser(user);
        editForm.setFieldsValue({
            full_name: user.full_name,
            phone: user.phone,
            national_code: user.national_code,
            email: user.email,
        });
        setEditModalVisible(true);
    };

    const handleUpdateUser = async (values: any) => {
        try {
            const res = await hrManagerApi.updateUser(selectedUser!.id, values);
            if (res.data.success) {
                message.success('اطلاعات کاربر با موفقیت به‌روزرسانی شد');
                setEditModalVisible(false);
                fetchUsers(pagination.current);
            }
        } catch (error: any) {
            console.error('Error updating user:', error);
            message.error(error.response?.data?.message || 'خطا در به‌روزرسانی کاربر');
        }
    };

    // ========== عملیات مدارک ==========
    const handleViewDocuments = async (user: User) => {
        setSelectedUser(user);
        await fetchUserDocuments(user.id);
        setDocModalVisible(true);
    };

    const handleReviewDocument = (doc: UserDocument) => {
        setReviewingDoc(doc);
        setReviewNote('');
        setReviewStatus('approved');
        setReviewModalVisible(true);
    };

    const handleSubmitReview = async () => {
        if (!reviewingDoc) return;
        try {
            setReviewLoading(true);
            const res = await hrManagerApi.reviewDocument(
                reviewingDoc.id,
                reviewStatus,
                reviewNote || undefined
            );
            if (res.data.success) {
                message.success(`مدرک با موفقیت ${reviewStatus === 'approved' ? 'تایید' : 'رد'} شد`);
                setReviewModalVisible(false);
                await fetchUserDocuments(selectedUser!.id);
                fetchStats();
            }
        } catch (error: any) {
            console.error('Error reviewing document:', error);
            message.error(error.response?.data?.message || 'خطا در بررسی مدرک');
        } finally {
            setReviewLoading(false);
        }
    };

    // ========== وضعیت ==========
    const getStatusBadge = (status: string) => {
        const map: Record<string, { color: string; text: string }> = {
            active: { color: 'green', text: 'فعال' },
            inactive: { color: 'red', text: 'غیرفعال' },
            pending: { color: 'gold', text: 'در انتظار تایید' },
        };
        return map[status] || { color: 'default', text: status };
    };

    const getDocStatusBadge = (status: string) => {
        const map: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
            pending: { color: 'gold', text: 'در انتظار', icon: <ClockCircleOutlined /> },
            approved: { color: 'green', text: 'تایید شده', icon: <CheckCircleOutlined /> },
            rejected: { color: 'red', text: 'رد شده', icon: <CloseCircleOutlined /> },
        };
        return map[status] || { color: 'default', text: status, icon: null };
    };

    const getRoleDisplay = (role: string) => {
        const map: Record<string, string> = {
            admin: 'مدیر کل سیستم',
            org_manager: 'مدیر سازمان',
            dept_manager: 'مدیر اداره',
            hr_manager: 'مدیر منابع انسانی',
            unit_supervisor: 'سرپرست واحد',
            subordinate: 'کاربر عادی',
        };
        return map[role] || role;
    };

    // ========== ستون‌های جدول ==========
    const columns = [
        {
            title: 'ردیف',
            dataIndex: 'id',
            key: 'id',
            render: (_: any, __: any, index: number) => (pagination.current - 1) * pagination.pageSize + index + 1,
            width: 60,
        },
        {
            title: 'کد ملی',
            dataIndex: 'national_code',
            key: 'national_code',
            render: (text: string) => <span dir="ltr">{text || '-'}</span>,
        },
        {
            title: 'نام و نام خانوادگی',
            dataIndex: 'full_name',
            key: 'full_name',
            render: (text: string) => <Text strong>{text}</Text>,
        },
        {
            title: 'کد پرسنلی',
            dataIndex: 'personnel_code',
            key: 'personnel_code',
            render: (text: string) => text || '-',
        },
        {
            title: 'شماره تماس',
            dataIndex: 'phone',
            key: 'phone',
            render: (text: string) => <span dir="ltr">{text || '-'}</span>,
        },
        {
            title: 'نقش',
            dataIndex: 'role',
            key: 'role',
            render: (role: string) => (
                <Tag color={role === 'admin' ? 'red' : 'blue'}>
                    {getRoleDisplay(role)}
                </Tag>
            ),
        },
        {
            title: 'وضعیت',
            dataIndex: 'is_active',
            key: 'status',
            render: (isActive: boolean, record: any) => {
                const status = !record.is_approved ? 'pending' : isActive ? 'active' : 'inactive';
                const info = getStatusBadge(status);
                return <Badge status={info.color as any} text={info.text} />;
            },
        },
        {
            title: 'عملیات',
            key: 'actions',
            render: (_: any, record: User) => (
                <Space size="small">
                    <Tooltip title="مدارک">
                        <Button
                            type="text"
                            icon={<FileTextOutlined />}
                            size="small"
                            style={{ color: '#1890ff' }}
                            onClick={() => handleViewDocuments(record)}
                        />
                    </Tooltip>
                    <Tooltip title="ویرایش">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            size="small"
                            style={{ color: '#faad14' }}
                            onClick={() => handleEditUser(record)}
                        />
                    </Tooltip>
                </Space>
            ),
            width: 120,
        },
    ];

    // ========== ستون‌های مدارک ==========
    const docColumns = [
        {
            title: 'نوع مدرک',
            dataIndex: 'doc_type',
            key: 'doc_type',
            render: (type: string) => {
                const map: Record<string, string> = {
                    national_id: 'کارت ملی',
                    birth_certificate: 'شناسنامه',
                    education: 'مدرک تحصیلی',
                    military: 'کارت پایان خدمت',
                    police: 'سوء پیشینه',
                    other: 'سایر',
                };
                return map[type] || type;
            },
        },
        {
            title: 'عنوان',
            dataIndex: 'doc_title',
            key: 'doc_title',
            render: (text: string) => text || '-',
        },
        {
            title: 'تاریخ آپلود',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date: string) => new Date(date).toLocaleDateString('fa-IR'),
        },
        {
            title: 'حجم',
            dataIndex: 'doc_size',
            key: 'doc_size',
            render: (size: number) => {
                if (size < 1024) return `${size} B`;
                if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
                return `${(size / (1024 * 1024)).toFixed(1)} MB`;
            },
        },
        {
            title: 'وضعیت',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const info = getDocStatusBadge(status);
                return <Badge status={info.color as any} text={info.text} />;
            },
        },
        {
            title: 'عملیات',
            key: 'actions',
            render: (_: any, record: UserDocument) => (
                <Space size="small">
                    <Tooltip title="مشاهده تصویر">
                        <Button
                            type="text"
                            icon={<FileImageOutlined />}
                            size="small"
                            onClick={() => window.open(`/uploads/documents/${record.doc_filename}`, '_blank')}
                        />
                    </Tooltip>
                    {record.status === 'pending' && (
                        <>
                            <Tooltip title="تایید">
                                <Button
                                    type="text"
                                    icon={<CheckOutlined />}
                                    size="small"
                                    style={{ color: '#52c41a' }}
                                    onClick={() => handleReviewDocument(record)}
                                />
                            </Tooltip>
                            <Tooltip title="رد">
                                <Button
                                    type="text"
                                    icon={<CloseOutlined />}
                                    size="small"
                                    danger
                                    onClick={() => {
                                        setReviewingDoc(record);
                                        setReviewStatus('rejected');
                                        setReviewModalVisible(true);
                                    }}
                                />
                            </Tooltip>
                        </>
                    )}
                </Space>
            ),
            width: 150,
        },
    ];

    // ========== نمایش ==========
    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div style={{ padding: 24 }}>
            {/* ===== هدر خوش‌آمدگویی ===== */}
            <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', border: 'none' }}>
                <Row gutter={16} align="middle">
                    <Col flex="auto">
                        <Title level={3} style={{ color: 'white', margin: 0 }}>
                            👋 خوش آمدید {user?.full_name} عزیز
                        </Title>
                        <Space size="large" style={{ marginTop: 8 }}>
                            <Tag color="pink">🏢 نقش: مدیر منابع انسانی</Tag>
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

            {/* ===== کارت‌های آماری ===== */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="کل کاربران"
                            value={stats?.total_users || 0}
                            prefix={<UserOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="کاربران فعال"
                            value={stats?.active_users || 0}
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="در انتظار تایید"
                            value={stats?.pending_users || 0}
                            prefix={<ClockCircleOutlined />}
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="مدارک در انتظار"
                            value={stats?.pending_documents || 0}
                            prefix={<FileTextOutlined />}
                            valueStyle={{ color: '#722ed1' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* ===== فیلترها ===== */}
            <Card style={{ marginBottom: 24 }}>
                <Row gutter={16} align="middle">
                    <Col>
                        <Text strong>نقش:</Text>
                        <Select
                            style={{ width: 150, marginLeft: 8 }}
                            allowClear
                            placeholder="همه نقش‌ها"
                            value={selectedRole}
                            onChange={handleRoleChange}
                        >
                            <Option value="admin">مدیر کل</Option>
                            <Option value="org_manager">مدیر سازمان</Option>
                            <Option value="dept_manager">مدیر اداره</Option>
                            <Option value="hr_manager">مدیر منابع انسانی</Option>
                            <Option value="unit_supervisor">سرپرست واحد</Option>
                            <Option value="subordinate">کاربر عادی</Option>
                        </Select>
                    </Col>
                    <Col>
                        <Text strong>وضعیت:</Text>
                        <Select
                            style={{ width: 150, marginLeft: 8 }}
                            allowClear
                            placeholder="همه وضعیت‌ها"
                            value={selectedStatus}
                            onChange={handleStatusChange}
                        >
                            <Option value="active">فعال</Option>
                            <Option value="inactive">غیرفعال</Option>
                            <Option value="pending">در انتظار تایید</Option>
                        </Select>
                    </Col>
                    <Col flex="auto">
                        <Input.Search
                            placeholder="جستجو بر اساس کد ملی، نام، نام خانوادگی، کد پرسنلی..."
                            allowClear
                            onSearch={handleSearch}
                            style={{ width: 350 }}
                            prefix={<SearchOutlined />}
                            enterButton
                        />
                    </Col>
                    <Col>
                        <Button icon={<DownloadOutlined />}>
                            خروجی اکسل
                        </Button>
                    </Col>
                </Row>
            </Card>

            {/* ===== جدول کاربران ===== */}
            <Card title="لیست کاربران">
                <Table
                    dataSource={users}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        showSizeChanger: true,
                        showTotal: (total) => `${total} کاربر`,
                        position: ['bottomRight'],
                    }}
                    onChange={(newPagination) => fetchUsers(newPagination.current)}
                    bordered={false}
                    scroll={{ x: 'max-content' }}
                />
            </Card>

            {/* ===== مودال ویرایش کاربر ===== */}
            <Modal
                title="ویرایش کاربر"
                open={editModalVisible}
                onCancel={() => setEditModalVisible(false)}
                footer={null}
                width={600}
                destroyOnClose
            >
                <Form form={editForm} layout="vertical" onFinish={handleUpdateUser}>
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
                            >
                                <Input placeholder="۰۹۱۲۳۴۵۶۷۸۹" dir="ltr" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="national_code"
                                label="کد ملی"
                            >
                                <Input placeholder="۱۲۳۴۵۶۷۸۹۰" dir="ltr" disabled />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="email"
                                label="ایمیل"
                                rules={[{ type: 'email', message: 'ایمیل معتبر وارد کنید' }]}
                            >
                                <Input placeholder="example@avan.com" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item>
                        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button onClick={() => setEditModalVisible(false)}>
                                انصراف
                            </Button>
                            <Button type="primary" htmlType="submit">
                                ذخیره تغییرات
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* ===== مودال مدارک ===== */}
            <Modal
                title={`مدارک ${selectedUser?.full_name}`}
                open={docModalVisible}
                onCancel={() => setDocModalVisible(false)}
                footer={null}
                width={900}
                destroyOnClose
            >
                <Tabs defaultActiveKey="1">
                    <TabPane tab="📎 مدارک" key="1">
                        <Table
                            dataSource={userDocuments}
                            columns={docColumns}
                            rowKey="id"
                            pagination={false}
                            bordered={false}
                            locale={{
                                emptyText: <Empty description="هیچ مدرکی برای این کاربر یافت نشد" />,
                            }}
                        />
                    </TabPane>
                </Tabs>
            </Modal>

            {/* ===== مودال بررسی مدرک ===== */}
            <Modal
                title="بررسی مدرک"
                open={reviewModalVisible}
                onCancel={() => setReviewModalVisible(false)}
                onOk={handleSubmitReview}
                confirmLoading={reviewLoading}
                okText={reviewStatus === 'approved' ? 'تایید' : 'رد'}
                cancelText="انصراف"
                okButtonProps={{
                    danger: reviewStatus === 'rejected',
                }}
            >
                <div style={{ marginBottom: 16 }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <Space>
                            <Text strong>نوع مدرک:</Text>
                            <Tag color="blue">{reviewingDoc?.doc_type}</Tag>
                        </Space>
                        <Space>
                            <Text strong>عنوان:</Text>
                            <Text>{reviewingDoc?.doc_title || '-'}</Text>
                        </Space>
                    </Space>
                </div>

                <div style={{ marginBottom: 16 }}>
                    <Text strong>وضعیت:</Text>
                    <Space style={{ marginLeft: 8 }}>
                        <Button
                            type={reviewStatus === 'approved' ? 'primary' : 'default'}
                            size="small"
                            onClick={() => setReviewStatus('approved')}
                            style={{ background: reviewStatus === 'approved' ? '#52c41a' : '' }}
                        >
                            ✓ تایید
                        </Button>
                        <Button
                            type={reviewStatus === 'rejected' ? 'primary' : 'default'}
                            size="small"
                            danger={reviewStatus === 'rejected'}
                            onClick={() => setReviewStatus('rejected')}
                        >
                            ✗ رد
                        </Button>
                    </Space>
                </div>

                <Form.Item label="توضیحات (اختیاری)">
                    <TextArea
                        rows={3}
                        placeholder="توضیحات..."
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                    />
                </Form.Item>
            </Modal>
        </div>
    );
};

export default HrManagerDashboard;