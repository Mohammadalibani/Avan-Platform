// frontend/src/components/Users/UsersList.tsx
import React, { useState, useEffect } from 'react';
import {
    Table,
    Card,
    Typography,
    Tag,
    Space,
    Button,
    Input,
    Avatar,
    Tooltip,
    Popconfirm,
    message,
    Switch,
    Spin,
} from 'antd';
import {
    SearchOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    UserOutlined,
    EyeOutlined,
    ReloadOutlined,
} from '@ant-design/icons';
import { usersApi } from '../../api/users';
import { User } from '../../types';
import UserFormModal from './UserFormModal';

const { Title } = Typography;
const { Search } = Input;

// داده‌های آزمایشی (Mock Data)
const mockUsers: User[] = [
    {
        id: 1,
        username: 'admin',
        full_name: 'مدیر سیستم',
        national_code: '1234567890',
        phone: '09123456789',
        email: 'admin@avan.com',
        role: 'admin',
        role_persian: 'مدیر کل سیستم',
        is_active: true,
        created_at: '2026-07-22T10:08:40.722370',
        last_login: '2026-07-25T10:50:50.775522',
    },
    {
        id: 2,
        username: 'ahmadi',
        full_name: 'رضا احمدی',
        national_code: '0987654321',
        phone: '09129876543',
        email: 'ahmadi@avan.com',
        role: 'user',
        role_persian: 'کاربر عادی',
        is_active: true,
        created_at: '2026-07-23T14:30:00.000000',
        last_login: '2026-07-24T09:15:00.000000',
    },
    {
        id: 3,
        username: 'karimi',
        full_name: 'سارا کریمی',
        national_code: '1122334455',
        phone: '09131122334',
        email: 'karimi@avan.com',
        role: 'user',
        role_persian: 'کاربر عادی',
        is_active: false,
        created_at: '2026-07-24T08:20:00.000000',
        last_login: '2026-07-23T16:45:00.000000',
    },
    {
        id: 4,
        username: 'mohammadi',
        full_name: 'محمد محمدی',
        national_code: '2233445566',
        phone: '09132233445',
        email: 'mohammadi@avan.com',
        role: 'user',
        role_persian: 'کاربر عادی',
        is_active: true,
        created_at: '2026-07-25T11:00:00.000000',
        last_login: undefined,
    },
];

const UsersList: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 8, total: 0 });

    // بارگذاری کاربران
    const fetchUsers = async (page = 1, search = '') => {
        try {
            setLoading(true);
            
            // **تغییر: استفاده از داده‌های آزمایشی به جای API**
            // این بخش را موقتاً غیرفعال می‌کنیم
            /*
            const response = await usersApi.getAll({
                page,
                per_page: pagination.pageSize,
                search: search || undefined,
            });
            
            if (response.data.success) {
                setUsers(response.data.data.users);
                setPagination({
                    ...pagination,
                    current: page,
                    total: response.data.data.total,
                });
            }
            */
            
            // **استفاده از داده‌های آزمایشی**
            let filteredUsers = mockUsers;
            if (search) {
                filteredUsers = mockUsers.filter(
                    (user) =>
                        user.full_name.includes(search) ||
                        user.national_code?.includes(search) ||
                        user.phone?.includes(search) ||
                        user.username.includes(search)
                );
            }
            
            // شبیه‌سازی صفحه‌بندی
            const start = (page - 1) * pagination.pageSize;
            const end = start + pagination.pageSize;
            const paginatedUsers = filteredUsers.slice(start, end);
            
            setUsers(paginatedUsers);
            setPagination({
                ...pagination,
                current: page,
                total: filteredUsers.length,
            });
            
        } catch (error) {
            console.error('Error fetching users:', error);
            message.error('خطا در دریافت لیست کاربران');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // حذف کاربر
    const handleDelete = async (userId: number, userName: string) => {
        try {
            setLoading(true);
            // **استفاده از داده‌های آزمایشی**
            // const response = await usersApi.delete(userId);
            // if (response.data.success) {
            //     message.success(`کاربر ${userName} با موفقیت حذف شد`);
            //     fetchUsers(pagination.current, searchText);
            // }
            
            // شبیه‌سازی حذف
            setTimeout(() => {
                const updatedUsers = users.filter((user) => user.id !== userId);
                setUsers(updatedUsers);
                setPagination({
                    ...pagination,
                    total: pagination.total - 1,
                });
                message.success(`کاربر ${userName} با موفقیت حذف شد`);
                setLoading(false);
            }, 500);
            
        } catch (error) {
            message.error('خطا در حذف کاربر');
            setLoading(false);
        }
    };

    // تغییر وضعیت فعال/غیرفعال
    const handleToggleStatus = async (userId: number, checked: boolean) => {
        try {
            // **استفاده از داده‌های آزمایشی**
            // const response = await usersApi.toggleStatus(userId);
            // if (response.data.success) {
            //     message.success(`وضعیت کاربر با موفقیت تغییر کرد`);
            //     fetchUsers(pagination.current, searchText);
            // }
            
            // شبیه‌سازی تغییر وضعیت
            setUsers(
                users.map((user) =>
                    user.id === userId ? { ...user, is_active: checked } : user
                )
            );
            message.success(`وضعیت کاربر با موفقیت تغییر کرد`);
            
        } catch (error) {
            message.error('خطا در تغییر وضعیت کاربر');
        }
    };

    // جستجوی کاربران
    const handleSearch = (value: string) => {
        setSearchText(value);
        fetchUsers(1, value);
    };

    // تغییر صفحه
    const handleTableChange = (newPagination: any) => {
        fetchUsers(newPagination.current, searchText);
    };

    // عملیات‌های مودال
    const handleAddUser = () => {
        setEditingUser(null);
        setModalVisible(true);
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setModalVisible(true);
    };

    const handleModalClose = () => {
        setModalVisible(false);
        setEditingUser(null);
    };

    const handleModalSuccess = () => {
        fetchUsers(pagination.current, searchText);
    };

    // بررسی نقش کاربر
    const isAdmin = (user: User) => {
        return user.role === 'admin';
    };

    const getRoleDisplay = (user: User) => {
        if (user.role_persian) return user.role_persian;
        return user.role || 'کاربر';
    };

    const columns = [
        {
            title: 'کاربر',
            dataIndex: 'full_name',
            key: 'full_name',
            render: (text: string, record: User) => (
                <Space>
                    <Avatar
                        icon={<UserOutlined />}
                        style={{
                            backgroundColor: isAdmin(record) ? '#f56a00' : '#1890ff',
                        }}
                    >
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
            dataIndex: 'role_persian',
            key: 'role',
            render: (_: string, record: User) => (
                <Tag
                    color={isAdmin(record) ? 'red' : 'blue'}
                    style={{ borderRadius: 12 }}
                >
                    {getRoleDisplay(record)}
                </Tag>
            ),
        },
        {
            title: 'وضعیت',
            dataIndex: 'is_active',
            key: 'is_active',
            render: (isActive: boolean, record: User) => (
                <Tooltip title={isActive ? 'فعال' : 'غیرفعال'}>
                    <Switch
                        checked={isActive}
                        onChange={(checked) => handleToggleStatus(record.id, checked)}
                        checkedChildren="فعال"
                        unCheckedChildren="غیرفعال"
                        style={{
                            backgroundColor: isActive ? '#52c41a' : '#ff4d4f',
                        }}
                    />
                </Tooltip>
            ),
        },
        {
            title: 'عملیات',
            key: 'actions',
            render: (_: any, record: User) => (
                <Space size="small">
                    <Tooltip title="مشاهده">
                        <Button
                            type="text"
                            icon={<EyeOutlined />}
                            style={{ color: '#1890ff' }}
                            onClick={() => message.info(`جزئیات کاربر: ${record.full_name}`)}
                        />
                    </Tooltip>
                    <Tooltip title="ویرایش">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            style={{ color: '#faad14' }}
                            onClick={() => handleEditUser(record)}
                        />
                    </Tooltip>
                    <Tooltip title="حذف">
                        <Popconfirm
                            title="حذف کاربر"
                            description={`آیا از حذف کاربر "${record.full_name}" اطمینان دارید؟`}
                            onConfirm={() => handleDelete(record.id, record.full_name)}
                            okText="بله، حذف کن"
                            cancelText="انصراف"
                            okButtonProps={{ danger: true }}
                        >
                            <Button type="text" icon={<DeleteOutlined />} danger />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    if (loading && users.length === 0) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 24 } }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 24,
                }}
            >
                <div>
                    <Title level={4} style={{ margin: 0 }}>
                        مدیریت کاربران
                    </Title>
                    <span style={{ color: '#888', fontSize: 14 }}>
                        {pagination.total} کاربر
                    </span>
                </div>
                <Space>
                    <Tooltip title="بارگذاری مجدد">
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={() => fetchUsers(pagination.current, searchText)}
                        />
                    </Tooltip>
                    <Search
                        placeholder="جستجو بر اساس نام، کد ملی یا شماره تماس..."
                        allowClear
                        onSearch={handleSearch}
                        style={{ width: 280 }}
                        prefix={<SearchOutlined style={{ color: '#888' }} />}
                    />
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
                onChange={handleTableChange}
                bordered={false}
                style={{ borderRadius: 12 }}
            />

            <UserFormModal
                visible={modalVisible}
                onClose={handleModalClose}
                onSuccess={handleModalSuccess}
                editingUser={editingUser}
            />
        </Card>
    );
};

export default UsersList;