// frontend/src/components/Admin/UsersList.tsx
import React, { useState, useEffect } from 'react';
import {
    Card,
    Table,
    Typography,
    Space,
    Button,
    Input,
    Select,
    Tag,
    Badge,
    Tooltip,
    Popconfirm,
    message,
    Spin,
    Avatar,
    Modal,
    Form,
    Switch,
    Row,
    Col,
    Upload,
    UploadProps,
} from 'antd';
import {
    SearchOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    ReloadOutlined,
    UserOutlined,
    UploadOutlined,
    DownloadOutlined,
    KeyOutlined,
    EyeOutlined,
    MailOutlined,
    PhoneOutlined,
} from '@ant-design/icons';
import { adminApi } from '../../api/admin';
import { User } from '../../types';
import { useAuthStore } from '../../store/authStore';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const UsersList: React.FC = () => {
    const { user: currentUser } = useAuthStore();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [selectedRole, setSelectedRole] = useState<string>();
    const [pagination, setPagination] = useState({ current: 1, pageSize: 25, total: 0 });

    // ===== مودال‌ها =====
    const [modalVisible, setModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [form] = Form.useForm();
    const [formLoading, setFormLoading] = useState(false);

    // ===== بارگذاری داده‌ها =====
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async (page = 1) => {
        try {
            setLoading(true);
            const res = await adminApi.getUsers({
                page,
                per_page: pagination.pageSize,
                search: searchText || undefined,
                role: selectedRole,
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
        } finally {
            setLoading(false);
        }
    };

    // ===== عملیات =====
    const handleAddUser = () => {
        setEditingUser(null);
        form.resetFields();
        form.setFieldsValue({ is_active: true, role: 'subordinate' });
        setModalVisible(true);
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        form.setFieldsValue({
            full_name: user.full_name,
            phone: user.phone,
            role: user.role,
            is_active: user.is_active,
            national_code: user.national_code,
            email: user.email,
            personnel_code: user.personnel_code,
        });
        setModalVisible(true);
    };

    const handleDeleteUser = async (userId: number, userName: string) => {
        try {
            setLoading(true);
            const res = await adminApi.deleteUser(userId);
            if (res.data.success) {
                message.success(`کاربر ${userName} با موفقیت حذف شد`);
                fetchUsers(pagination.current);
            }
        } catch (error: any) {
            console.error('Error deleting user:', error);
            message.error(error.response?.data?.message || 'خطا در حذف کاربر');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (userId: number, userName: string) => {
        try {
            const res = await adminApi.resetPassword(userId);
            if (res.data.success) {
                message.success(`رمز عبور کاربر ${userName} با موفقیت بازنشانی شد`);
            }
        } catch (error: any) {
            console.error('Error resetting password:', error);
            message.error(error.response?.data?.message || 'خطا در بازنشانی رمز عبور');
        }
    };

    const handleSubmit = async (values: any) => {
        try {
            setFormLoading(true);
            if (editingUser) {
                const res = await adminApi.updateUser(editingUser.id, values);
                if (res.data.success) {
                    message.success('کاربر با موفقیت ویرایش شد');
                }
            } else {
                const res = await adminApi.createUser(values);
                if (res.data.success) {
                    message.success('کاربر با موفقیت ایجاد شد');
                }
            }
            setModalVisible(false);
            fetchUsers(pagination.current);
        } catch (error: any) {
            console.error('Error saving user:', error);
            message.error(error.response?.data?.message || 'خطا در ذخیره کاربر');
        } finally {
            setFormLoading(false);
        }
    };

    // ===== فیلترها =====
    const handleSearch = (value: string) => {
        setSearchText(value);
        fetchUsers(1);
    };

    const handleRoleChange = (value: string) => {
        setSelectedRole(value);
        fetchUsers(1);
    };

    const handleRefresh = () => {
        fetchUsers(pagination.current);
        message.success('اطلاعات به‌روزرسانی شد');
    };

    // ===== ستون‌های جدول =====
    const columns = [
        {
            title: 'ردیف',
            dataIndex: 'id',
            key: 'id',
            render: (_: any, __: any, index: number) => (pagination.current - 1) * pagination.pageSize + index + 1,
            width: 60,
        },
        {
            title: 'کاربر',
            dataIndex: 'full_name',
            key: 'full_name',
            render: (text: string, record: User) => (
                <Space>
                    <Avatar icon={<UserOutlined />} style={{ backgroundColor: record.role === 'admin' ? '#f56a00' : '#1890ff' }}>
                        {text?.charAt(0)}
                    </Avatar>
                    <div>
                        <div style={{ fontWeight: 500 }}>{text}</div>
                        <div style={{ fontSize: 12, color: '#888' }}>@{record.username}</div>
                    </div>
                </Space>
            ),
        },
        {
            title: 'کد ملی',
            dataIndex: 'national_code',
            key: 'national_code',
            render: (text: string) => <span dir="ltr">{text || '-'}</span>,
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
            render: (role: string) => {
                const map: Record<string, { color: string; text: string }> = {
                    admin: { color: 'red', text: 'مدیر کل' },
                    org_manager: { color: 'purple', text: 'مدیر سازمان' },
                    dept_manager: { color: 'blue', text: 'مدیر اداره' },
                    hr_manager: { color: 'pink', text: 'مدیر منابع انسانی' },
                    unit_supervisor: { color: 'cyan', text: 'سرپرست واحد' },
                    subordinate: { color: 'green', text: 'کاربر عادی' },
                };
                const info = map[role] || { color: 'default', text: role };
                return <Tag color={info.color}>{info.text}</Tag>;
            },
        },
        {
            title: 'وضعیت',
            dataIndex: 'is_active',
            key: 'status',
            render: (isActive: boolean, record: User) => {
                const status = !record.is_approved ? 'pending' : isActive ? 'active' : 'inactive';
                const map: Record<string, { color: string; text: string }> = {
                    active: { color: 'green', text: 'فعال' },
                    inactive: { color: 'red', text: 'غیرفعال' },
                    pending: { color: 'gold', text: 'در انتظار' },
                };
                const info = map[status] || { color: 'default', text: status };
                return <Badge status={info.color as any} text={info.text} />;
            },
        },
        {
            title: 'عملیات',
            key: 'actions',
            render: (_: any, record: User) => (
                <Space size="small">
                    <Tooltip title="ویرایش">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            size="small"
                            style={{ color: '#faad14' }}
                            onClick={() => handleEditUser(record)}
                        />
                    </Tooltip>
                    {record.id !== currentUser?.id && (
                        <>
                            <Tooltip title="بازنشانی رمز">
                                <Popconfirm
                                    title="بازنشانی رمز عبور"
                                    description={`آیا از بازنشانی رمز عبور کاربر "${record.full_name}" اطمینان دارید؟`}
                                    onConfirm={() => handleResetPassword(record.id, record.full_name)}
                                    okText="بله"
                                    cancelText="انصراف"
                                >
                                    <Button
                                        type="text"
                                        icon={<KeyOutlined />}
                                        size="small"
                                        style={{ color: '#1890ff' }}
                                    />
                                </Popconfirm>
                            </Tooltip>
                            <Tooltip title="حذف">
                                <Popconfirm
                                    title="حذف کاربر"
                                    description={`آیا از حذف کاربر "${record.full_name}" اطمینان دارید؟`}
                                    onConfirm={() => handleDeleteUser(record.id, record.full_name)}
                                    okText="بله، حذف کن"
                                    cancelText="انصراف"
                                    okButtonProps={{ danger: true }}
                                >
                                    <Button type="text" icon={<DeleteOutlined />} size="small" danger />
                                </Popconfirm>
                            </Tooltip>
                        </>
                    )}
                </Space>
            ),
            width: 150,
        },
    ];

    // ===== Upload Excel =====
    const uploadProps: UploadProps = {
        name: 'file',
        action: '/api/admin/users/upload',
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        accept: '.xlsx,.xls',
        showUploadList: false,
        onChange(info) {
            if (info.file.status === 'done') {
                message.success(`${info.file.name} با موفقیت آپلود شد`);
                fetchUsers(pagination.current);
            } else if (info.file.status === 'error') {
                message.error(`خطا در آپلود ${info.file.name}`);
            }
        },
    };

    // ===== نمایش =====
    return (
        <div style={{ padding: 24 }}>
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                        <Title level={4} style={{ margin: 0 }}>👥 مدیریت کاربران</Title>
                        <Text type="secondary">{pagination.total} کاربر</Text>
                    </div>
                    <Space>
                        <Tooltip title="بارگذاری مجدد">
                            <Button icon={<ReloadOutlined />} onClick={handleRefresh} />
                        </Tooltip>
                        <Select
                            style={{ width: 150 }}
                            allowClear
                            placeholder="نقش"
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
                        <Input.Search
                            placeholder="جستجو..."
                            allowClear
                            onSearch={handleSearch}
                            style={{ width: 200 }}
                            prefix={<SearchOutlined />}
                            enterButton
                        />
                        <Upload {...uploadProps}>
                            <Button icon={<UploadOutlined />}>آپلود اکسل</Button>
                        </Upload>
                        <Button icon={<DownloadOutlined />}>خروجی اکسل</Button>
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddUser}>
                            کاربر جدید
                        </Button>
                    </Space>
                </div>

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

            {/* ===== مودال افزودن/ویرایش کاربر ===== */}
            <Modal
                title={editingUser ? 'ویرایش کاربر' : 'افزودن کاربر جدید'}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
                width={700}
                destroyOnClose
            >
                <Spin spinning={formLoading}>
                    <Form form={form} layout="vertical" onFinish={handleSubmit}>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="full_name"
                                    label="نام کامل"
                                    rules={[{ required: true, message: 'لطفاً نام کامل را وارد کنید' }]}
                                >
                                    <Input placeholder="نام و نام خانوادگی" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="username"
                                    label="نام کاربری"
                                    rules={[{ required: true, message: 'لطفاً نام کاربری را وارد کنید' }]}
                                >
                                    <Input placeholder="نام کاربری" disabled={!!editingUser} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="national_code"
                                    label="کد ملی"
                                    rules={[
                                        { required: true, message: 'لطفاً کد ملی را وارد کنید' },
                                        { len: 10, message: 'کد ملی باید ۱۰ رقم باشد' },
                                    ]}
                                >
                                    <Input placeholder="۱۲۳۴۵۶۷۸۹۰" maxLength={10} dir="ltr" disabled={!!editingUser} />
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
                                    name="role"
                                    label="نقش"
                                    rules={[{ required: true, message: 'لطفاً نقش را انتخاب کنید' }]}
                                >
                                    <Select placeholder="انتخاب نقش">
                                        <Option value="admin">مدیر کل</Option>
                                        <Option value="org_manager">مدیر سازمان</Option>
                                        <Option value="dept_manager">مدیر اداره</Option>
                                        <Option value="hr_manager">مدیر منابع انسانی</Option>
                                        <Option value="unit_supervisor">سرپرست واحد</Option>
                                        <Option value="subordinate">کاربر عادی</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="personnel_code" label="کد پرسنلی">
                                    <Input placeholder="کد پرسنلی" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="is_active" label="وضعیت" valuePropName="checked">
                                    <Switch checkedChildren="فعال" unCheckedChildren="غیرفعال" />
                                </Form.Item>
                            </Col>
                        </Row>

                        {!editingUser && (
                            <Form.Item
                                name="password"
                                label="رمز عبور"
                                help="پیش‌فرض: ۴ رقم آخر کد ملی"
                            >
                                <Input.Password placeholder="رمز عبور (اختیاری)" />
                            </Form.Item>
                        )}

                        <Form.Item>
                            <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Button onClick={() => setModalVisible(false)}>
                                    انصراف
                                </Button>
                                <Button type="primary" htmlType="submit" loading={formLoading}>
                                    {editingUser ? 'ذخیره تغییرات' : 'ایجاد کاربر'}
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Spin>
            </Modal>
        </div>
    );
};

export default UsersList;