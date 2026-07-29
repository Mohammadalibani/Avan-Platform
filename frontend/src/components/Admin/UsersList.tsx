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
    Descriptions,
    Divider,
    Progress,
    Timeline,
    Alert,
    Statistic,
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
    CheckCircleOutlined,
    HistoryOutlined,
    FileExcelOutlined,
    EyeOutlined,
    SyncOutlined,
    ApartmentOutlined,
    CameraOutlined,
} from '@ant-design/icons';
import { adminApi } from '../../api/admin';
import { User } from '../../types';
import { useAuthStore } from '../../store/authStore';
import type { UploadChangeParam } from 'antd/es/upload';
import type { RcFile } from 'antd/es/upload/interface';

const { Title, Text } = Typography;
const { Option } = Select;

// ===== تبدیل اعداد به فارسی =====
const toPersianNumber = (num: number | string): string => {
    if (num === undefined || num === null) return '۰';
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    return String(num).replace(/\d/g, (d: string) => persianDigits[parseInt(d)]);
};

// ===== تایپ‌های محلی =====
interface Department {
    id: number;
    name: string;
    color?: string;
}

interface Unit {
    id: number;
    name: string;
    department_id: number;
}

interface UserHistory {
    id: number;
    user_id: number;
    department_id: number;
    unit_id: number;
    department_name: string;
    unit_name: string;
    changed_at: string;
    changed_by: string;
}

interface UserStats {
    total: number;
    active: number;
    pending: number;
    inactive: number;
    online: number;
    unassigned: number;
}

interface UploadResult {
    total: number;
    added: number;
    duplicates: number;
    errors: string[];
}

const UsersList: React.FC = () => {
    const { user: currentUser } = useAuthStore();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [selectedRole, setSelectedRole] = useState<string>();
    const [selectedDepartment, setSelectedDepartment] = useState<number>();
    const [selectedUnit, setSelectedUnit] = useState<number>();
    const [pagination, setPagination] = useState({ current: 1, pageSize: 25, total: 0 });
    const [stats, setStats] = useState<UserStats>({
        total: 0,
        active: 0,
        pending: 0,
        inactive: 0,
        online: 0,
        unassigned: 0,
    });

    // ===== داده‌های دپارتمان و واحد =====
    const [departments, setDepartments] = useState<Department[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [filteredUnits, setFilteredUnits] = useState<Unit[]>([]);

    // ===== مودال‌ها =====
    const [modalVisible, setModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [form] = Form.useForm();
    const [formLoading, setFormLoading] = useState(false);

    // ===== مودال مشاهده کاربر =====
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [viewingUser, setViewingUser] = useState<User | null>(null);
    const [userHistory, setUserHistory] = useState<UserHistory[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // ===== مودال آپلود اکسل =====
    const [uploadModalVisible, setUploadModalVisible] = useState(false);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
    const [uploadFileList, setUploadFileList] = useState<RcFile[]>([]);

    // ===== بارگذاری داده‌ها =====
    useEffect(() => {
        fetchUsers();
        fetchDepartments();
        fetchUnits();
        fetchStats();
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
                setUsers(res.data.data.users || []);
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

    const fetchStats = async () => {
        try {
            const res = await adminApi.getStats();
            if (res.data.success) {
                const total = res.data.data.total_users || 0;
                const active = res.data.data.active_users || 0;
                const pending = res.data.data.pending_users || 0;
                const inactive = res.data.data.inactive_users || 0;
                setStats({
                    total: total,
                    active: active,
                    pending: pending,
                    inactive: inactive,
                    online: 0,
                    unassigned: 0,
                });
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchDepartments = async () => {
        try {
            const res = await adminApi.getDepartments();
            const data = res.data?.data || res.data || [];
            setDepartments(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching departments:', error);
            setDepartments([]);
        }
    };

    const fetchUnits = async () => {
        try {
            const res = await adminApi.getUnits();
            const data = res.data?.data || res.data || [];
            setUnits(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching units:', error);
            setUnits([]);
        }
    };

    const fetchUserHistory = async (userId: number) => {
        try {
            setHistoryLoading(true);
            const res = await adminApi.getUserHistory(userId);
            if (res.data.success) {
                setUserHistory(res.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching user history:', error);
            setUserHistory([]);
        } finally {
            setHistoryLoading(false);
        }
    };

    // ===== آپلود عکس پروفایل =====
    const handleAvatarUpload = async (file: File, userId: number) => {
        const formData = new FormData();
        formData.append('avatar', file);
        formData.append('user_id', String(userId));

        try {
            const res = await adminApi.uploadAvatar(formData);
            if (res.data.success) {
                message.success('عکس پروفایل با موفقیت آپلود شد');
                fetchUsers(pagination.current);
                return true;
            }
        } catch (error) {
            console.error('Error uploading avatar:', error);
            message.error('خطا در آپلود عکس');
            return false;
        }
        return false;
    };

    // ===== عملیات =====
    const handleAddUser = () => {
        setEditingUser(null);
        form.resetFields();
        form.setFieldsValue({ 
            is_active: true, 
            is_approved: true,
            role: 'subordinate',
            first_name: '',
            last_name: '',
        });
        setModalVisible(true);
    };

    const handleEditUser = async (user: User) => {
        setEditingUser(user);
        const nameParts = user.full_name?.split(' ') || ['', ''];
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        form.setFieldsValue({
            first_name: firstName,
            last_name: lastName,
            username: user.username,
            phone: user.phone,
            role: user.role,
            is_active: user.is_active,
            is_approved: user.is_approved !== false,
            national_code: user.national_code,
            email: user.email,
            personnel_code: user.personnel_code,
            department_id: user.department_id,
            unit_id: user.unit_id,
        });
        setModalVisible(true);
    };

    const handleViewUser = async (user: User) => {
        setViewingUser(user);
        await fetchUserHistory(user.id);
        setViewModalVisible(true);
    };

    const handleDeleteUser = async (userId: number, userName: string) => {
        try {
            setLoading(true);
            const res = await adminApi.deleteUser(userId);
            if (res.data.success) {
                message.success(`کاربر ${userName} با موفقیت حذف شد`);
                fetchUsers(pagination.current);
                fetchStats();
            }
        } catch (error: any) {
            console.error('Error deleting user:', error);
            message.error(error.response?.data?.message || 'خطا در حذف کاربر');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (user: User) => {
        try {
            setLoading(true);
            const newStatus = !user.is_active;
            const res = await adminApi.updateUser(user.id, { is_active: newStatus });
            if (res.data.success) {
                message.success(`وضعیت کاربر ${user.full_name} به ${newStatus ? 'فعال' : 'غیرفعال'} تغییر یافت`);
                fetchUsers(pagination.current);
                fetchStats();
            }
        } catch (error: any) {
            console.error('Error toggling user status:', error);
            message.error(error.response?.data?.message || 'خطا در تغییر وضعیت کاربر');
        } finally {
            setLoading(false);
        }
    };

    const handleApproveUser = async (user: User) => {
        try {
            setLoading(true);
            const res = await adminApi.approveUser(user.id);
            if (res.data.success) {
                message.success(`کاربر ${user.full_name} با موفقیت تایید شد`);
                fetchUsers(pagination.current);
                fetchStats();
            }
        } catch (error: any) {
            console.error('Error approving user:', error);
            message.error(error.response?.data?.message || 'خطا در تایید کاربر');
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
            const fullName = `${values.first_name || ''} ${values.last_name || ''}`.trim();
            const submitData = {
                ...values,
                full_name: fullName,
                username: values.username,
            };
            
            let result;
            if (editingUser) {
                result = await adminApi.updateUser(editingUser.id, submitData);
                if (result.data.success) {
                    message.success('کاربر با موفقیت ویرایش شد');
                }
            } else {
                result = await adminApi.createUser(submitData);
                if (result.data.success) {
                    message.success('کاربر با موفقیت ایجاد شد');
                }
            }
            
            if (result?.data?.data?.id) {
                const userId = result.data.data.id;
                // عکس با کد ملی ذخیره می‌شود
            }
            
            setModalVisible(false);
            fetchUsers(1);
            fetchStats();
        } catch (error: any) {
            console.error('Error saving user:', error);
            message.error(error.response?.data?.message || 'خطا در ذخیره کاربر');
        } finally {
            setFormLoading(false);
        }
    };

    // ===== فیلترها (با جستجوی زنده) =====
    const handleSearch = (value: string) => {
        setSearchText(value);
        fetchUsers(1);
    };

    // ===== جستجوی زنده هنگام تایپ =====
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchText(value);
        // جستجوی زنده با تأخیر 300ms
        clearTimeout((window as any).searchTimeout);
        (window as any).searchTimeout = setTimeout(() => {
            fetchUsers(1);
        }, 300);
    };

    const handleRoleChange = (value: string) => {
        setSelectedRole(value);
        fetchUsers(1);
    };

    const handleDepartmentFilter = (value: number) => {
        setSelectedDepartment(value);
        const filtered = units.filter(u => u.department_id === value);
        setFilteredUnits(filtered);
        setSelectedUnit(undefined);
        fetchUsers(1);
    };

    const handleUnitFilter = (value: number) => {
        setSelectedUnit(value);
        fetchUsers(1);
    };

    const handleRefresh = () => {
        fetchUsers(pagination.current);
        fetchStats();
        message.success('اطلاعات به‌روزرسانی شد');
    };

    // ===== آپلود اکسل =====
    const handleUploadChange = (info: UploadChangeParam) => {
        setUploadFileList(info.fileList as RcFile[]);
    };

    const handleUploadSubmit = async () => {
        if (uploadFileList.length === 0) {
            message.warning('لطفاً فایل اکسل را انتخاب کنید');
            return;
        }

        const formData = new FormData();
        formData.append('excel_file', uploadFileList[0]);

        try {
            setUploadLoading(true);
            setUploadProgress(0);
            
            const interval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(interval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 500);

            const res = await adminApi.uploadUsersExcel(formData);
            clearInterval(interval);
            setUploadProgress(100);

            if (res.data.success) {
                setUploadResult({
                    total: res.data.data.total || 0,
                    added: res.data.data.added || 0,
                    duplicates: res.data.data.duplicates || 0,
                    errors: res.data.data.errors || [],
                });
                message.success('فایل با موفقیت آپلود شد');
                fetchUsers(1);
                fetchStats();
            }
        } catch (error: any) {
            console.error('Error uploading excel:', error);
            message.error(error.response?.data?.message || 'خطا در آپلود فایل');
        } finally {
            setUploadLoading(false);
        }
    };

    // ===== خروجی اکسل =====
    const exportToExcel = async () => {
        try {
            message.loading('در حال آماده‌سازی فایل اکسل...', 2);
            const res = await adminApi.exportUsersExcel();
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            const today = new Date().toLocaleDateString('fa-IR').replace(/\//g, '');
            link.setAttribute('download', `لیست_کاربران_${today}.xlsx`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            message.success('خروجی اکسل با موفقیت دانلود شد');
        } catch (error) {
            console.error('Error exporting excel:', error);
            message.error('خطا در خروجی اکسل');
        }
    };

    // ===== دانلود قالب =====
    const downloadTemplate = async () => {
        try {
            const res = await adminApi.downloadTemplate();
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'قالب_کاربران_آوان.xlsx');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            message.success('قالب با موفقیت دانلود شد');
        } catch (error) {
            console.error('Error downloading template:', error);
            message.error('خطا در دانلود قالب');
        }
    };

    // ===== همگام‌سازی عکس‌ها =====
    const syncAvatars = async () => {
        Modal.confirm({
            title: 'همگام‌سازی عکس‌های پروفایل',
            content: 'آیا از همگام‌سازی عکس‌های پروفایل با کد ملی کاربران اطمینان دارید؟ سامانه تمام عکس‌های موجود در پوشه avatars را بررسی و به کاربران مربوطه اختصاص می‌دهد.',
            okText: 'بله، همگام‌سازی کن',
            cancelText: 'انصراف',
            onOk: async () => {
                try {
                    const res = await adminApi.syncAvatars();
                    if (res.data.success) {
                        message.success(`✅ ${res.data.data.updated} عکس با موفقیت همگام‌سازی شد`);
                        if (res.data.data.errors?.length > 0) {
                            message.warning(`❌ ${res.data.data.errors.length} خطا: ${res.data.data.errors.join(', ')}`);
                        }
                        fetchUsers(pagination.current);
                    }
                } catch (error) {
                    console.error('Error syncing avatars:', error);
                    message.error('خطا در همگام‌سازی عکس‌ها');
                }
            }
        });
    };

    // ===== ستون‌های جدول =====
    const columns = [
        {
            title: '#',
            dataIndex: 'id',
            key: 'id',
            render: (_: any, __: any, index: number) => toPersianNumber((pagination.current - 1) * pagination.pageSize + index + 1),
            width: 50,
        },
        {
            title: 'نام و نام خانوادگی',
            dataIndex: 'full_name',
            key: 'full_name',
            sorter: (a: User, b: User) => (a.full_name || '').localeCompare(b.full_name || ''),
            render: (text: string, record: User) => (
                <div 
                    style={{ cursor: 'pointer', fontFamily: "'Vazirmatn', 'Segoe UI', sans-serif" }}
                    onClick={() => handleViewUser(record)}
                >
                    <Space>
                        <Avatar 
                            icon={<UserOutlined />} 
                            style={{ backgroundColor: record.role === 'admin' ? '#f56a00' : '#1890ff' }}
                            src={record.avatar}
                        >
                            {text?.charAt(0)}
                        </Avatar>
                        <div>
                            <div style={{ fontWeight: 500 }}>{text}</div>
                            <div style={{ fontSize: 12, color: '#888' }}>@{record.username}</div>
                        </div>
                    </Space>
                </div>
            ),
        },
        {
            title: 'کد ملی',
            dataIndex: 'national_code',
            key: 'national_code',
            render: (text: string) => <span dir="ltr">{toPersianNumber(text) || '-'}</span>,
        },
        {
            title: 'نقش',
            dataIndex: 'role',
            key: 'role',
            render: (role: string) => {
                const map: Record<string, { color: string; text: string }> = {
                    admin: { color: 'red', text: 'مدیر کل سیستم' },
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
            title: 'اداره',
            dataIndex: 'department_name',
            key: 'department_name',
            render: (text: string) => text || '-',
        },
        {
            title: 'واحد',
            dataIndex: 'unit_name',
            key: 'unit_name',
            render: (text: string) => text || '-',
        },
        {
            title: 'وضعیت انتصاب',
            key: 'assignment_status',
            render: (_: any, record: User) => {
                const hasAssignment = record.unit_name && record.unit_name !== '-' && record.department_name && record.department_name !== '-';
                return (
                    <Tag color={hasAssignment ? 'green' : 'orange'}>
                        {hasAssignment ? '✓ دارای انتصاب' : '⚠️ بدون انتصاب'}
                    </Tag>
                );
            },
        },
        {
            title: 'وضعیت',
            dataIndex: 'is_active',
            key: 'status',
            render: (isActive: boolean, record: User) => {
                const isApproved = record.is_approved !== false;
                if (!isApproved) {
                    return (
                        <Space>
                            <Badge status="warning" text="در انتظار تایید" />
                            <Button 
                                type="link" 
                                size="small" 
                                icon={<CheckCircleOutlined />}
                                onClick={() => handleApproveUser(record)}
                            >
                                تایید
                            </Button>
                        </Space>
                    );
                }
                return (
                    <Space>
                        <Badge status={isActive ? 'success' : 'error'} text={isActive ? 'فعال' : 'غیرفعال'} />
                        <Button 
                            type="link" 
                            size="small" 
                            danger={isActive}
                            onClick={() => handleToggleStatus(record)}
                        >
                            {isActive ? 'غیرفعال کن' : 'فعال کن'}
                        </Button>
                    </Space>
                );
            },
        },
        {
            title: 'آخرین ورود',
            dataIndex: 'last_login',
            key: 'last_login',
            render: (text: string) => {
                if (!text) return 'هرگز';
                const date = new Date(text);
                const now = new Date();
                const diff = (now.getTime() - date.getTime()) / 1000 / 60;
                if (diff < 60) {
                    return <Tag color="green">🟢 آنلاین</Tag>;
                }
                return text;
            },
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
                            size="small"
                            style={{ color: '#1890ff' }}
                            onClick={() => handleViewUser(record)}
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
            width: 200,
        },
    ];

    // ===== نمایش =====
    return (
        <div style={{ padding: 24, fontFamily: "'Vazirmatn', 'Segoe UI', sans-serif" }}>
            <Card>
                {/* ===== هدر ===== */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                    <div>
                        <Title level={4} style={{ margin: 0, fontFamily: "'Vazirmatn', 'Segoe UI', sans-serif" }}>👥 مدیریت کاربران</Title>
                        <Text type="secondary">{toPersianNumber(pagination.total)} کاربر</Text>
                    </div>
                    <Space wrap>
                        <Tooltip title="بارگذاری مجدد">
                            <Button icon={<ReloadOutlined />} onClick={handleRefresh} />
                        </Tooltip>
                        <Button icon={<UploadOutlined />} onClick={() => setUploadModalVisible(true)}>
                            آپلود اکسل
                        </Button>
                        <Button icon={<DownloadOutlined />} onClick={exportToExcel}>
                            خروجی اکسل
                        </Button>
                        <Button icon={<FileExcelOutlined />} onClick={downloadTemplate}>
                            دانلود قالب
                        </Button>
                        <Button icon={<SyncOutlined />} onClick={syncAvatars}>
                            همگام‌سازی عکس‌ها
                        </Button>
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddUser}>
                            کاربر جدید
                        </Button>
                    </Space>
                </div>

                {/* ===== کارت‌های آماری ===== */}
                <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col xs={12} sm={8} md={4}>
                        <div className="stat-card" style={{ background: '#f0f5ff', borderRadius: 12, padding: '12px 16px', cursor: 'pointer', textAlign: 'center', border: '1px solid #d6e4ff', transition: 'all 0.3s' }}>
                            <div style={{ fontSize: 24, fontWeight: 700, color: '#1890ff' }}>{toPersianNumber(stats.total)}</div>
                            <div style={{ fontSize: 12, color: '#666' }}>👥 کل کاربران</div>
                        </div>
                    </Col>
                    <Col xs={12} sm={8} md={4}>
                        <div className="stat-card" style={{ background: '#f6ffed', borderRadius: 12, padding: '12px 16px', cursor: 'pointer', textAlign: 'center', border: '1px solid #b7eb8f', transition: 'all 0.3s' }}>
                            <div style={{ fontSize: 24, fontWeight: 700, color: '#52c41a' }}>{toPersianNumber(stats.active)}</div>
                            <div style={{ fontSize: 12, color: '#666' }}>🟢 فعال</div>
                        </div>
                    </Col>
                    <Col xs={12} sm={8} md={4}>
                        <div className="stat-card" style={{ background: '#fffbe6', borderRadius: 12, padding: '12px 16px', cursor: 'pointer', textAlign: 'center', border: '1px solid #ffe58f', transition: 'all 0.3s' }}>
                            <div style={{ fontSize: 24, fontWeight: 700, color: '#faad14' }}>{toPersianNumber(stats.pending)}</div>
                            <div style={{ fontSize: 12, color: '#666' }}>⏳ در انتظار</div>
                        </div>
                    </Col>
                    <Col xs={12} sm={8} md={4}>
                        <div className="stat-card" style={{ background: '#fff1f0', borderRadius: 12, padding: '12px 16px', cursor: 'pointer', textAlign: 'center', border: '1px solid #ffa39e', transition: 'all 0.3s' }}>
                            <div style={{ fontSize: 24, fontWeight: 700, color: '#ff4d4f' }}>{toPersianNumber(stats.inactive)}</div>
                            <div style={{ fontSize: 12, color: '#666' }}>⚫ غیرفعال</div>
                        </div>
                    </Col>
                    <Col xs={12} sm={8} md={4}>
                        <div className="stat-card" style={{ background: '#f6ffed', borderRadius: 12, padding: '12px 16px', cursor: 'pointer', textAlign: 'center', border: '1px solid #b7eb8f', transition: 'all 0.3s' }}>
                            <div style={{ fontSize: 24, fontWeight: 700, color: '#52c41a' }}>{toPersianNumber(stats.online)}</div>
                            <div style={{ fontSize: 12, color: '#666' }}>🟢 آنلاین</div>
                        </div>
                    </Col>
                    <Col xs={12} sm={8} md={4}>
                        <div className="stat-card" style={{ background: '#fff7e6', borderRadius: 12, padding: '12px 16px', cursor: 'pointer', textAlign: 'center', border: '1px solid #ffd591', transition: 'all 0.3s' }}>
                            <div style={{ fontSize: 24, fontWeight: 700, color: '#fa8c16' }}>{toPersianNumber(stats.unassigned)}</div>
                            <div style={{ fontSize: 12, color: '#666' }}>⚠️ بدون انتصاب</div>
                        </div>
                    </Col>
                </Row>

                {/* ===== نوار فیلترها ===== */}
                <div style={{ background: '#fafafa', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                    <Input.Search
                        placeholder="🔍 جستجو در کد ملی، نام، نام خانوادگی..."
                        allowClear
                        onSearch={handleSearch}
                        onChange={handleSearchChange}
                        style={{ width: 280 }}
                        prefix={<SearchOutlined />}
                        enterButton
                    />
                    <Select style={{ width: 150 }} allowClear placeholder="نقش" value={selectedRole} onChange={handleRoleChange}>
                        <Option value="admin">مدیر کل سیستم</Option>
                        <Option value="org_manager">مدیر سازمان</Option>
                        <Option value="dept_manager">مدیر اداره</Option>
                        <Option value="hr_manager">مدیر منابع انسانی</Option>
                        <Option value="unit_supervisor">سرپرست واحد</Option>
                        <Option value="subordinate">کاربر عادی</Option>
                    </Select>
                    <Select style={{ width: 180 }} allowClear placeholder="همه ادارات" value={selectedDepartment} onChange={handleDepartmentFilter}>
                        {departments.map((dept) => (
                            <Option key={dept.id} value={dept.id}>{dept.name}</Option>
                        ))}
                    </Select>
                    <Select style={{ width: 180 }} allowClear placeholder="همه واحدها" value={selectedUnit} onChange={handleUnitFilter} disabled={!selectedDepartment}>
                        {filteredUnits.map((unit) => (
                            <Option key={unit.id} value={unit.id}>{unit.name}</Option>
                        ))}
                    </Select>
                    <Button onClick={() => {
                        setSearchText('');
                        setSelectedRole(undefined);
                        setSelectedDepartment(undefined);
                        setSelectedUnit(undefined);
                        setFilteredUnits([]);
                        fetchUsers(1);
                    }}>
                        🗑️ پاک کردن فیلترها
                    </Button>
                </div>

                {/* ===== جدول ===== */}
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
                        showTotal: (total) => `${toPersianNumber(total)} کاربر`,
                        position: ['bottomRight'],
                    }}
                    onChange={(newPagination) => fetchUsers(newPagination.current)}
                    bordered={false}
                    scroll={{ x: 'max-content' }}
                />
            </Card>

            {/* ===== مودال افزودن/ویرایش کاربر با اداره و واحد ===== */}
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
                        {/* ===== آپلود عکس ===== */}
                        <div style={{ textAlign: 'center', marginBottom: 16 }}>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                <Avatar size={100} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff', fontSize: 40, cursor: 'pointer' }} src={editingUser?.avatar} />
                                <div style={{ position: 'absolute', bottom: 0, right: 0, background: '#1890ff', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', border: '2px solid white' }} onClick={() => document.getElementById('avatarUpload')?.click()}>
                                    <CameraOutlined />
                                </div>
                            </div>
                            <input id="avatarUpload" type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file && editingUser?.id) {
                                    await handleAvatarUpload(file, editingUser.id);
                                }
                            }} />
                            <Text type="secondary" style={{ display: 'block', fontSize: 11, marginTop: 4 }}>برای تغییر عکس کلیک کنید (JPG, PNG - حداکثر 5MB)</Text>
                        </div>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="first_name" label="نام" rules={[{ required: true, message: 'لطفاً نام را وارد کنید' }]}>
                                    <Input placeholder="نام" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="last_name" label="نام خانوادگی" rules={[{ required: true, message: 'لطفاً نام خانوادگی را وارد کنید' }]}>
                                    <Input placeholder="نام خانوادگی" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="username" label="نام کاربری" rules={[{ required: true, message: 'لطفاً نام کاربری را وارد کنید' }, { pattern: /^[0-9]{10}$/, message: 'نام کاربری باید دقیقاً ۱۰ رقم باشد' }]} help="نام کاربری باید ۱۰ رقم باشد">
                                    <Input placeholder="۱۲۳۴۵۶۷۸۹۰" maxLength={10} dir="ltr" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="national_code" label="کد ملی" rules={[{ required: true, message: 'لطفاً کد ملی را وارد کنید' }, { len: 10, message: 'کد ملی باید ۱۰ رقم باشد' }]}>
                                    <Input placeholder="۱۲۳۴۵۶۷۸۹۰" maxLength={10} dir="ltr" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="phone" label="شماره تماس">
                                    <Input placeholder="۰۹۱۲۳۴۵۶۷۸۹" dir="ltr" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="email" label="ایمیل" rules={[{ type: 'email', message: 'ایمیل معتبر وارد کنید' }]}>
                                    <Input placeholder="example@avan.com" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="role" label="نقش" rules={[{ required: true, message: 'لطفاً نقش را انتخاب کنید' }]}>
                                    <Select placeholder="انتخاب نقش">
                                        <Option value="admin">مدیر کل سیستم</Option>
                                        <Option value="org_manager">مدیر سازمان</Option>
                                        <Option value="dept_manager">مدیر اداره</Option>
                                        <Option value="hr_manager">مدیر منابع انسانی</Option>
                                        <Option value="unit_supervisor">سرپرست واحد</Option>
                                        <Option value="subordinate">کاربر عادی</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="personnel_code" label="کد پرسنلی">
                                    <Input placeholder="کد پرسنلی" />
                                </Form.Item>
                            </Col>
                        </Row>

                        {/* ===== انتخاب اداره و واحد ===== */}
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="department_id" label="اداره" rules={[{ required: true, message: 'لطفاً اداره را انتخاب کنید' }]}>
                                    <Select 
                                        placeholder="انتخاب اداره" 
                                        onChange={(value) => {
                                            const filtered = units.filter(u => u.department_id === value);
                                            setFilteredUnits(filtered);
                                            form.setFieldsValue({ unit_id: undefined });
                                        }}
                                    >
                                        {departments.map((dept) => (
                                            <Option key={dept.id} value={dept.id}>{dept.name}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="unit_id" label="واحد" rules={[{ required: true, message: 'لطفاً واحد را انتخاب کنید' }]}>
                                    <Select 
                                        placeholder="انتخاب واحد" 
                                        disabled={!form.getFieldValue('department_id')}
                                    >
                                        {filteredUnits.map((unit) => (
                                            <Option key={unit.id} value={unit.id}>{unit.name}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="is_active" label="وضعیت" valuePropName="checked">
                                    <Switch checkedChildren="فعال" unCheckedChildren="غیرفعال" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="is_approved" label="تایید شده" valuePropName="checked">
                                    <Switch checkedChildren="تایید شده" unCheckedChildren="در انتظار" />
                                </Form.Item>
                            </Col>
                        </Row>

                        {!editingUser && (
                            <Form.Item name="password" label="رمز عبور" rules={[{ required: true, message: 'لطفاً رمز عبور را وارد کنید' }]}>
                                <Input.Password placeholder="رمز عبور" />
                            </Form.Item>
                        )}

                        <Form.Item>
                            <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Button onClick={() => setModalVisible(false)}>انصراف</Button>
                                <Button type="primary" htmlType="submit" loading={formLoading}>
                                    {editingUser ? 'ذخیره تغییرات' : 'ایجاد کاربر'}
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Spin>
            </Modal>

            {/* ===== مودال مشاهده کاربر ===== */}
            <Modal title="کارت شناسایی کاربر" open={viewModalVisible} onCancel={() => setViewModalVisible(false)} footer={null} width={800} destroyOnClose>
                {viewingUser && (
                    <Spin spinning={historyLoading}>
                        <Card>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24 }}>
                                <Avatar size={100} icon={<UserOutlined />} src={viewingUser.avatar} style={{ backgroundColor: viewingUser.role === 'admin' ? '#f56a00' : '#1890ff', fontSize: 40 }}>
                                    {viewingUser.full_name?.charAt(0)}
                                </Avatar>
                                <div>
                                    <Title level={3} style={{ margin: 0 }}>{viewingUser.full_name}</Title>
                                    <Text type="secondary">@{viewingUser.username}</Text>
                                    <div style={{ marginTop: 8 }}>
                                        <Tag color={viewingUser.role === 'admin' ? 'red' : 'blue'}>{viewingUser.role_persian || viewingUser.role}</Tag>
                                        <Badge status={viewingUser.is_active ? 'success' : 'error'} text={viewingUser.is_active ? 'فعال' : 'غیرفعال'} />
                                        <Badge status={viewingUser.is_approved !== false ? 'success' : 'warning'} text={viewingUser.is_approved !== false ? 'تایید شده' : 'در انتظار تایید'} />
                                    </div>
                                </div>
                            </div>
                            <Divider />
                            <Descriptions bordered column={2}>
                                <Descriptions.Item label="نام کاربری">{viewingUser.username}</Descriptions.Item>
                                <Descriptions.Item label="کد ملی">{viewingUser.national_code || '-'}</Descriptions.Item>
                                <Descriptions.Item label="شماره تماس">{viewingUser.phone || '-'}</Descriptions.Item>
                                <Descriptions.Item label="ایمیل">{viewingUser.email || '-'}</Descriptions.Item>
                                <Descriptions.Item label="کد پرسنلی">{viewingUser.personnel_code || '-'}</Descriptions.Item>
                                <Descriptions.Item label="تاریخ ثبت‌نام">{viewingUser.created_at ? new Date(viewingUser.created_at).toLocaleDateString('fa-IR') : '-'}</Descriptions.Item>
                            </Descriptions>
                            <Divider><HistoryOutlined /> سابقه کاری</Divider>
                            {userHistory.length === 0 ? (
                                <Text type="secondary">هیچ سابقه‌ای برای این کاربر ثبت نشده است</Text>
                            ) : (
                                <Timeline>
                                    {userHistory.map((item) => (
                                        <Timeline.Item key={item.id} color="blue">
                                            <div>
                                                <strong>{item.department_name}</strong> - {item.unit_name}
                                                <br />
                                                <Text type="secondary" style={{ fontSize: 12 }}>{new Date(item.changed_at).toLocaleDateString('fa-IR')} - توسط {item.changed_by}</Text>
                                            </div>
                                        </Timeline.Item>
                                    ))}
                                </Timeline>
                            )}
                        </Card>
                    </Spin>
                )}
            </Modal>

            {/* ===== مودال آپلود اکسل ===== */}
            <Modal title="📤 آپلود اکسل کاربران" open={uploadModalVisible} onCancel={() => { setUploadModalVisible(false); setUploadFileList([]); setUploadResult(null); setUploadProgress(0); }} footer={null} width={600} destroyOnClose>
                <Spin spinning={uploadLoading}>
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <FileExcelOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                        <p style={{ marginTop: 16 }}>فایل اکسل با فرمت <strong>.xlsx</strong> یا <strong>.xls</strong> را انتخاب کنید</p>
                        <p style={{ color: '#888', fontSize: 12 }}>ستون‌های مورد نیاز: کد ملی، نام، نام خانوادگی، نقش، کد پرسنلی، شماره تماس</p>
                    </div>
                    <Upload fileList={uploadFileList as any} onChange={handleUploadChange} beforeUpload={(file) => { setUploadFileList([file]); return false; }} onRemove={() => { setUploadFileList([]); setUploadResult(null); setUploadProgress(0); }} accept=".xlsx,.xls" maxCount={1}>
                        <Button icon={<UploadOutlined />} block>انتخاب فایل</Button>
                    </Upload>
                    {uploadFileList.length > 0 && (
                        <div style={{ marginTop: 16 }}>
                            <Text strong>فایل انتخاب شده: </Text>
                            <Text>{uploadFileList[0].name}</Text>
                            <Text type="secondary" style={{ marginLeft: 8 }}>({(uploadFileList[0].size / 1024).toFixed(0)} KB)</Text>
                        </div>
                    )}
                    {uploadLoading && (
                        <div style={{ marginTop: 16 }}>
                            <Progress percent={uploadProgress} status="active" />
                            <Text type="secondary">در حال آپلود و پردازش فایل...</Text>
                        </div>
                    )}
                    {uploadResult && (
                        <Card style={{ marginTop: 16, backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}>
                            <Row gutter={16}>
                                <Col span={8}><Statistic title="کل رکوردها" value={toPersianNumber(uploadResult.total)} /></Col>
                                <Col span={8}><Statistic title="اضافه شده" value={toPersianNumber(uploadResult.added)} valueStyle={{ color: '#52c41a' }} /></Col>
                                <Col span={8}><Statistic title="تکراری (کد ملی)" value={toPersianNumber(uploadResult.duplicates)} valueStyle={{ color: '#faad14' }} /></Col>
                            </Row>
                            {uploadResult.errors.length > 0 && (
                                <Alert type="error" message="خطاها" description={<ul style={{ margin: 0, paddingRight: 20 }}>{uploadResult.errors.map((err, i) => (<li key={i}>{err}</li>))}</ul>} style={{ marginTop: 12 }} />
                            )}
                        </Card>
                    )}
                    <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <Button onClick={() => { setUploadModalVisible(false); setUploadFileList([]); setUploadResult(null); setUploadProgress(0); }}>بستن</Button>
                        <Button type="primary" onClick={handleUploadSubmit} loading={uploadLoading} disabled={uploadFileList.length === 0 || uploadLoading} icon={<UploadOutlined />}>آپلود</Button>
                    </div>
                </Spin>
            </Modal>
        </div>
    );
};

export default UsersList;