// frontend/src/components/Admin/PersonnelList.tsx
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
    Tooltip,
    Popconfirm,
    message,
    Spin,
    Modal,
    Form,
    Row,
    Col,
    Upload,
    Progress,
    Alert,
    Checkbox,
    Radio,
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
    FileExcelOutlined,
    CopyOutlined,
    UserAddOutlined,
} from '@ant-design/icons';
import { adminApi, Department, Unit, Personnel, Period } from '../../api/admin';

const { Title, Text } = Typography;
const { Option } = Select;

// ===== تبدیل اعداد به فارسی =====
const toPersianNumber = (num: number | string): string => {
    if (num === undefined || num === null) return '۰';
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    return String(num).replace(/\d/g, (d: string) => persianDigits[parseInt(d)]);
};

// ===== تایپ‌ها =====
interface DepartmentWithStats {
    id: number;
    name: string;
    color?: string;
    description?: string;
    is_active?: boolean;
    managers?: { id: number; full_name: string }[];
    units_count?: number;
    personnel_count?: number;
    created_at?: string;
}

interface UserForAdd {
    id: number;
    national_code: string;
    first_name: string;
    last_name: string;
    full_name: string;
    department_id?: number;
    department_name?: string;
    unit_id?: number;
    unit_name?: string;
    has_assignment?: boolean;
    is_duplicate?: boolean;
}

const PersonnelList: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState<number>();
    const [selectedUnit, setSelectedUnit] = useState<number>();
    const [selectedPeriod, setSelectedPeriod] = useState<number>();

    // ===== داده‌های اصلی =====
    const [departments, setDepartments] = useState<DepartmentWithStats[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [periods, setPeriods] = useState<Period[]>([]);
    const [personnel, setPersonnel] = useState<Personnel[]>([]);
    const [filteredPersonnel, setFilteredPersonnel] = useState<Personnel[]>([]);
    const [dynamicFields, setDynamicFields] = useState<any[]>([]);

    // ===== آمار =====
    const [stats, setStats] = useState({
        totalDepartments: 0,
        totalUnits: 0,
        totalPersonnel: 0,
        totalManagers: 0,
        totalSupervisors: 0,
    });

    // ===== مودال‌ها =====
    const [modalVisible, setModalVisible] = useState(false);
    const [editingPersonnel, setEditingPersonnel] = useState<Personnel | null>(null);
    const [form] = Form.useForm();
    const [formLoading, setFormLoading] = useState(false);

    // ===== مودال افزودن کاربران =====
    const [addUsersModalVisible, setAddUsersModalVisible] = useState(false);
    const [allUsers, setAllUsers] = useState<UserForAdd[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<UserForAdd[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());
    const [addUsersSearch, setAddUsersSearch] = useState('');
    const [addUsersDeptFilter, setAddUsersDeptFilter] = useState<number>();
    const [addUsersUnitFilter, setAddUsersUnitFilter] = useState<number>();
    const [addUsersPeriodId, setAddUsersPeriodId] = useState<number>();
    const [addUsersLoading, setAddUsersLoading] = useState(false);
    const [addUsersProgress, setAddUsersProgress] = useState({ show: false, percent: 0, text: '', detail: '' });
    const [departmentsWithUnits, setDepartmentsWithUnits] = useState<any[]>([]);

    // ===== مودال تکثیر =====
    const [copyModalVisible, setCopyModalVisible] = useState(false);
    const [copySourcePeriod, setCopySourcePeriod] = useState<number>();
    const [copyTargetPeriod, setCopyTargetPeriod] = useState<number>();
    const [copyDuplicateAction, setCopyDuplicateAction] = useState<'skip' | 'overwrite'>('skip');

    // ===== مودال آپلود اکسل =====
    const [uploadModalVisible, setUploadModalVisible] = useState(false);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadFileList, setUploadFileList] = useState<any[]>([]);

    // ===== بارگذاری داده‌ها =====
    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [deptsRes, unitsRes, periodsRes, personnelRes, fieldsRes] = await Promise.all([
                adminApi.getDepartments(),
                adminApi.getUnits(),
                adminApi.getPeriods(),
                adminApi.getPersonnel({ per_page: 1000 }),
                adminApi.getFields(),
            ]);

            // دپارتمان‌ها
            const deptsData = deptsRes.data?.data || deptsRes.data || [];
            const mappedDepts: DepartmentWithStats[] = Array.isArray(deptsData) 
                ? deptsData.map((d: any) => ({
                    ...d,
                    managers: d.managers || [],
                    units_count: d.units_count || 0,
                    personnel_count: d.personnel_count || 0,
                }))
                : [];
            setDepartments(mappedDepts);

            // واحدها
            const unitsData = unitsRes.data?.data || unitsRes.data || [];
            setUnits(Array.isArray(unitsData) ? unitsData : []);

            // دوره‌ها
            const periodsData = periodsRes.data?.data || periodsRes.data || [];
            setPeriods(Array.isArray(periodsData) ? periodsData : []);

            // پرسنل
            const personnelData = personnelRes.data?.data?.personnel || personnelRes.data?.data || [];
            setPersonnel(Array.isArray(personnelData) ? personnelData : []);
            setFilteredPersonnel(Array.isArray(personnelData) ? personnelData : []);

            // فیلدهای داینامیک
            const fieldsData = fieldsRes.data?.data || fieldsRes.data || [];
            setDynamicFields(Array.isArray(fieldsData) ? fieldsData : []);

            // محاسبه آمار
            const totalDepts = mappedDepts.length;
            const totalUnits = Array.isArray(unitsData) ? unitsData.length : 0;
            const totalPersonnel = Array.isArray(personnelData) ? personnelData.length : 0;

            let totalManagers = 0;
            for (const dept of mappedDepts) {
                if (dept.managers && Array.isArray(dept.managers)) {
                    totalManagers += dept.managers.length;
                }
            }

            setStats({
                totalDepartments: totalDepts,
                totalUnits: totalUnits,
                totalPersonnel: totalPersonnel,
                totalManagers: totalManagers,
                totalSupervisors: 0,
            });

        } catch (error) {
            console.error('Error fetching data:', error);
            message.error('خطا در دریافت داده‌ها');
        } finally {
            setLoading(false);
        }
    };

    // ===== فیلتر پرسنل =====
    useEffect(() => {
        let filtered = [...personnel];

        if (searchText) {
            const search = searchText.toLowerCase();
            filtered = filtered.filter(p =>
                p.national_code?.includes(search) ||
                p.full_name?.toLowerCase().includes(search) ||
                p.first_name?.toLowerCase().includes(search) ||
                p.last_name?.toLowerCase().includes(search)
            );
        }

        if (selectedDepartment) {
            filtered = filtered.filter(p => p.department_id === selectedDepartment);
        }

        if (selectedUnit) {
            filtered = filtered.filter(p => p.unit_id === selectedUnit);
        }

        if (selectedPeriod) {
            filtered = filtered.filter(p => p.period_id === selectedPeriod);
        }

        setFilteredPersonnel(filtered);
    }, [personnel, searchText, selectedDepartment, selectedUnit, selectedPeriod]);

    // ===== گروه‌بندی بر اساس اداره =====
    const getGroupedPersonnel = () => {
        const groups: { [key: number]: Personnel[] } = {};
        for (const p of filteredPersonnel) {
            const deptId = p.department_id || 0;
            if (!groups[deptId]) groups[deptId] = [];
            groups[deptId].push(p);
        }
        return groups;
    };

    // ===== ستون‌های جدول =====
    const getColumns = (deptId: number) => {
        const visibleFields = dynamicFields.filter(f => !f.is_key);
        const cols = [
            {
                title: '#',
                key: 'index',
                width: 50,
                render: (_: any, __: any, index: number) => toPersianNumber(index + 1),
            },
            {
                title: 'کد ملی',
                dataIndex: 'national_code',
                key: 'national_code',
                render: (text: string) => <span dir="ltr">{toPersianNumber(text) || '-'}</span>,
            },
            {
                title: 'نام و نام خانوادگی',
                dataIndex: 'full_name',
                key: 'full_name',
                render: (text: string, record: Personnel) => (
                    <Text strong>{record.full_name || '-'}</Text>
                ),
            },
            {
                title: 'دوره',
                dataIndex: 'period_title',
                key: 'period_title',
                render: (text: string) => text || '-',
            },
            ...visibleFields.map(field => ({
                title: field.title,
                dataIndex: `field_${field.id}`,
                key: `field_${field.id}`,
                render: (text: any) => {
                    if (!text) return '-';
                    if (field.field_type === 'number' || field.field_type === 'decimal') {
                        return toPersianNumber(text);
                    }
                    return text;
                },
            })),
            {
                title: 'واحد',
                dataIndex: 'unit_name',
                key: 'unit_name',
                render: (text: string) => (
                    <Tag color="blue">{text || '-'}</Tag>
                ),
            },
            {
                title: 'تاریخ افزودن',
                dataIndex: 'created_at',
                key: 'created_at',
                render: (text: string) => text ? new Date(text).toLocaleDateString('fa-IR') : '-',
            },
            {
                title: 'عملیات',
                key: 'actions',
                width: 120,
                render: (_: any, record: Personnel) => (
                    <Space size="small">
                        <Tooltip title="ویرایش">
                            <Button
                                type="text"
                                icon={<EditOutlined />}
                                size="small"
                                style={{ color: '#faad14' }}
                                onClick={() => handleEditPersonnel(record)}
                            />
                        </Tooltip>
                        <Tooltip title="حذف">
                            <Popconfirm
                                title="حذف پرسنل"
                                description={`آیا از حذف پرسنل "${record.full_name}" اطمینان دارید؟`}
                                onConfirm={() => handleDeletePersonnel(record.id, record.full_name)}
                                okText="بله، حذف کن"
                                cancelText="انصراف"
                                okButtonProps={{ danger: true }}
                            >
                                <Button type="text" icon={<DeleteOutlined />} size="small" danger />
                            </Popconfirm>
                        </Tooltip>
                    </Space>
                ),
            },
        ];
        return cols;
    };

    // ===== عملیات پرسنل =====
    const handleAddPersonnel = () => {
        setEditingPersonnel(null);
        form.resetFields();
        form.setFieldsValue({ is_active: true });
        setModalVisible(true);
    };

    const handleEditPersonnel = (personnel: Personnel) => {
        setEditingPersonnel(personnel);
        form.setFieldsValue({
            national_code: personnel.national_code,
            first_name: personnel.first_name,
            last_name: personnel.last_name,
            phone: personnel.phone,
            position: personnel.position,
            department_id: personnel.department_id,
            unit_id: personnel.unit_id,
            period_id: personnel.period_id,
        });
        setModalVisible(true);
    };

    const handleDeletePersonnel = async (id: number, name: string) => {
        try {
            const res = await adminApi.deletePersonnel(id);
            if (res.data.success) {
                message.success(`پرسنل ${name} با موفقیت حذف شد`);
                fetchAllData();
            }
        } catch (error: any) {
            console.error('Error deleting personnel:', error);
            message.error(error.response?.data?.message || 'خطا در حذف پرسنل');
        }
    };

    const handleSubmit = async (values: any) => {
        try {
            setFormLoading(true);
            const submitData = {
                ...values,
                full_name: `${values.first_name || ''} ${values.last_name || ''}`.trim(),
            };

            if (editingPersonnel) {
                const res = await adminApi.updatePersonnel(editingPersonnel.id, submitData);
                if (res.data.success) {
                    message.success('پرسنل با موفقیت ویرایش شد');
                }
            } else {
                const res = await adminApi.createPersonnel(submitData);
                if (res.data.success) {
                    message.success('پرسنل با موفقیت ایجاد شد');
                }
            }
            setModalVisible(false);
            fetchAllData();
        } catch (error: any) {
            console.error('Error saving personnel:', error);
            message.error(error.response?.data?.message || 'خطا در ذخیره پرسنل');
        } finally {
            setFormLoading(false);
        }
    };

    // ===== افزودن کاربران به پرسنل =====
    const openAddUsersModal = async () => {
        try {
            setAddUsersLoading(true);
            setAddUsersModalVisible(true);

            // بارگذاری ادارات با واحدها
            const res = await fetch('/admin/api/departments-with-units');
            const data = await res.json();
            // اطمینان از آرایه بودن data
            setDepartmentsWithUnits(Array.isArray(data) ? data : []);

            // بارگذاری دوره‌ها
            const periodsRes = await adminApi.getPeriods();
            const periodsData = periodsRes.data?.data || periodsRes.data || [];
            setPeriods(Array.isArray(periodsData) ? periodsData : []);

            // بارگذاری کاربران
            await loadUsersForAdd();

            setAddUsersLoading(false);
        } catch (error) {
            console.error(error);
            message.error('خطا در بارگذاری داده‌ها');
            setAddUsersLoading(false);
        }
    };

    const loadUsersForAdd = async () => {
        try {
            const params = new URLSearchParams();
            if (addUsersSearch) params.append('search', addUsersSearch);
            if (addUsersDeptFilter) params.append('dept_id', String(addUsersDeptFilter));
            if (addUsersUnitFilter) params.append('unit_id', String(addUsersUnitFilter));

            const res = await fetch(`/admin/api/users-with-filters?${params.toString()}`);
            const data = await res.json();
            setAllUsers(Array.isArray(data) ? data : []);
            setFilteredUsers(Array.isArray(data) ? data : []);

            // بررسی تکراری‌ها
            if (addUsersPeriodId) {
                await checkDuplicateUsers();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const checkDuplicateUsers = async () => {
        if (!addUsersPeriodId) return;
        try {
            const res = await fetch(`/admin/api/personnel-by-period?period_id=${addUsersPeriodId}`);
            const data = await res.json();
            const existingCodes = new Set((Array.isArray(data) ? data : []).map((p: any) => p.national_code));

            setFilteredUsers(prev =>
                (Array.isArray(prev) ? prev : []).map(user => ({
                    ...user,
                    is_duplicate: existingCodes.has(user.national_code),
                }))
            );
        } catch (error) {
            console.error(error);
        }
    };

    const toggleUserSelection = (userId: number, checked: boolean) => {
        const newSet = new Set(selectedUserIds);
        if (checked) newSet.add(userId);
        else newSet.delete(userId);
        setSelectedUserIds(newSet);
    };

    const toggleSelectAllUsers = (checked: boolean) => {
        const newSet = new Set(selectedUserIds);
        const selectableUsers = (Array.isArray(filteredUsers) ? filteredUsers : []).filter(u => !u.is_duplicate);
        if (checked) {
            selectableUsers.forEach(u => newSet.add(u.id));
        } else {
            selectableUsers.forEach(u => newSet.delete(u.id));
        }
        setSelectedUserIds(newSet);
    };

    const addSelectedUsersToPersonnel = async () => {
        if (selectedUserIds.size === 0) {
            message.warning('لطفاً حداقل یک کاربر را انتخاب کنید');
            return;
        }
        if (!addUsersPeriodId) {
            message.warning('لطفاً دوره مورد نظر را انتخاب کنید');
            return;
        }

        setAddUsersProgress({ show: true, percent: 0, text: 'در حال آماده‌سازی...', detail: '' });

        try {
            const userIds = Array.from(selectedUserIds);
            const batchSize = 50;
            let added = 0,
                skipped = 0,
                errors = 0;

            for (let i = 0; i < userIds.length; i += batchSize) {
                const batch = userIds.slice(i, i + batchSize);
                const percent = Math.round((i / userIds.length) * 100);

                setAddUsersProgress({
                    show: true,
                    percent,
                    text: `در حال پردازش دسته ${Math.floor(i / batchSize) + 1}...`,
                    detail: `✅ ${toPersianNumber(added)} اضافه شده | ⏭️ ${toPersianNumber(skipped)} تکراری | ❌ ${toPersianNumber(errors)} خطا`,
                });

                try {
                    const res = await fetch('/admin/api/add-users-to-personnel', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            user_ids: batch,
                            period_id: addUsersPeriodId,
                        }),
                    });
                    const result = await res.json();
                    if (result.success) {
                        added += result.added || 0;
                        skipped += result.skipped || 0;
                        errors += result.errors || 0;
                    } else {
                        errors += batch.length;
                    }
                } catch (e) {
                    errors += batch.length;
                }
            }

            setAddUsersProgress({
                show: true,
                percent: 100,
                text: '✅ عملیات تکمیل شد!',
                detail: `✅ ${toPersianNumber(added)} اضافه شده | ⏭️ ${toPersianNumber(skipped)} تکراری | ❌ ${toPersianNumber(errors)} خطا`,
            });

            setTimeout(() => {
                setAddUsersProgress({ show: false, percent: 0, text: '', detail: '' });
                message.success(`${toPersianNumber(added)} کاربر با موفقیت به پرسنل اضافه شدند`);
                setAddUsersModalVisible(false);
                setSelectedUserIds(new Set());
                fetchAllData();
            }, 2000);

        } catch (error) {
            console.error(error);
            message.error('خطا در افزودن کاربران');
            setAddUsersProgress({ show: false, percent: 0, text: '', detail: '' });
        }
    };

    // ===== تکثیر پرسنل =====
    const handleCopyPersonnel = async () => {
        if (!copySourcePeriod || !copyTargetPeriod) {
            message.warning('لطفاً دوره مبدأ و مقصد را انتخاب کنید');
            return;
        }
        if (copySourcePeriod === copyTargetPeriod) {
            message.warning('دوره مبدأ و مقصد نمی‌توانند یکسان باشند');
            return;
        }

        setAddUsersProgress({ show: true, percent: 0, text: 'در حال تکثیر پرسنل...', detail: 'لطفاً صبر کنید' });

        try {
            const res = await adminApi.duplicatePersonnel(
                copySourcePeriod,
                copyTargetPeriod,
                copyDuplicateAction
            );

            if (res.data.success) {
                setAddUsersProgress({
                    show: true,
                    percent: 100,
                    text: '✅ عملیات تکمیل شد!',
                    detail: res.data.message || 'پرسنل با موفقیت کپی شدند',
                });

                setTimeout(() => {
                    setAddUsersProgress({ show: false, percent: 0, text: '', detail: '' });
                    message.success(res.data.message);
                    setCopyModalVisible(false);
                    fetchAllData();
                }, 2000);
            }
        } catch (error: any) {
            console.error(error);
            message.error(error.response?.data?.message || 'خطا در تکثیر پرسنل');
            setAddUsersProgress({ show: false, percent: 0, text: '', detail: '' });
        }
    };

    // ===== آپلود اکسل =====
    const handleUploadExcel = async () => {
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

            const res = await adminApi.uploadPersonnel(formData);
            clearInterval(interval);
            setUploadProgress(100);

            if (res.data.success) {
                message.success(res.data.message || 'فایل با موفقیت آپلود شد');
                setUploadModalVisible(false);
                setUploadFileList([]);
                setUploadProgress(0);
                fetchAllData();
            }
        } catch (error: any) {
            console.error('Error uploading excel:', error);
            message.error(error.response?.data?.message || 'خطا در آپلود فایل');
        } finally {
            setUploadLoading(false);
        }
    };

    // ===== رندر =====
    return (
        <div style={{ padding: 24, fontFamily: "'Vazirmatn', 'Segoe UI', sans-serif" }}>
            {/* ===== هدر ===== */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                <div>
                    <Title level={4} style={{ margin: 0 }}>👨‍💼 مدیریت پرسنل</Title>
                    <Text type="secondary">{toPersianNumber(filteredPersonnel.length)} پرسنل</Text>
                </div>
                <Space wrap>
                    <Tooltip title="بارگذاری مجدد">
                        <Button icon={<ReloadOutlined />} onClick={fetchAllData} />
                    </Tooltip>
                    <Button icon={<UserAddOutlined />} onClick={openAddUsersModal}>
                        افزودن از کاربران
                    </Button>
                    <Button icon={<FileExcelOutlined />} onClick={() => setUploadModalVisible(true)}>
                        آپلود اکسل
                    </Button>
                    <Button icon={<DownloadOutlined />}>
                        خروجی اکسل
                    </Button>
                    <Button icon={<CopyOutlined />} onClick={() => setCopyModalVisible(true)}>
                        تکثیر دسته‌جمعی
                    </Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAddPersonnel}>
                        پرسنل جدید
                    </Button>
                </Space>
            </div>

            {/* ===== کارت‌های آمار ===== */}
            <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col xs={12} sm={8} md={4}>
                    <div style={{ background: '#f0f5ff', borderRadius: 12, padding: '12px 16px', textAlign: 'center', border: '1px solid #d6e4ff' }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: '#1890ff' }}>{toPersianNumber(stats.totalDepartments)}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>🏢 ادارات</div>
                    </div>
                </Col>
                <Col xs={12} sm={8} md={4}>
                    <div style={{ background: '#f6ffed', borderRadius: 12, padding: '12px 16px', textAlign: 'center', border: '1px solid #b7eb8f' }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: '#52c41a' }}>{toPersianNumber(stats.totalUnits)}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>📁 واحدها</div>
                    </div>
                </Col>
                <Col xs={12} sm={8} md={4}>
                    <div style={{ background: '#fffbe6', borderRadius: 12, padding: '12px 16px', textAlign: 'center', border: '1px solid #ffe58f' }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: '#faad14' }}>{toPersianNumber(stats.totalPersonnel)}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>👥 کل پرسنل</div>
                    </div>
                </Col>
                <Col xs={12} sm={8} md={4}>
                    <div style={{ background: '#f0f5ff', borderRadius: 12, padding: '12px 16px', textAlign: 'center', border: '1px solid #d6e4ff' }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: '#1890ff' }}>{toPersianNumber(stats.totalManagers)}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>👔 مدیران</div>
                    </div>
                </Col>
                <Col xs={12} sm={8} md={4}>
                    <div style={{ background: '#f6ffed', borderRadius: 12, padding: '12px 16px', textAlign: 'center', border: '1px solid #b7eb8f' }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: '#52c41a' }}>{toPersianNumber(stats.totalSupervisors)}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>👤 سرپرستان</div>
                    </div>
                </Col>
            </Row>

            {/* ===== فیلترها ===== */}
            <div style={{ background: '#fafafa', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                <Input.Search
                    placeholder="🔍 جستجو در کد ملی، نام، نام خانوادگی..."
                    allowClear
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ width: 280 }}
                    prefix={<SearchOutlined />}
                    enterButton
                />
                <Select
                    style={{ width: 180 }}
                    allowClear
                    placeholder="همه ادارات"
                    value={selectedDepartment}
                    onChange={(value) => {
                        setSelectedDepartment(value);
                        setSelectedUnit(undefined);
                    }}
                >
                    {departments.map((dept) => (
                        <Option key={dept.id} value={dept.id}>{dept.name}</Option>
                    ))}
                </Select>
                <Select
                    style={{ width: 180 }}
                    allowClear
                    placeholder="همه واحدها"
                    value={selectedUnit}
                    onChange={setSelectedUnit}
                    disabled={!selectedDepartment}
                >
                    {units
                        .filter(u => !selectedDepartment || u.department_id === selectedDepartment)
                        .map((unit) => (
                            <Option key={unit.id} value={unit.id}>{unit.name}</Option>
                        ))}
                </Select>
                <Select
                    style={{ width: 180 }}
                    allowClear
                    placeholder="همه دوره‌ها"
                    value={selectedPeriod}
                    onChange={setSelectedPeriod}
                >
                    {periods.map((period) => (
                        <Option key={period.id} value={period.id}>{period.title}</Option>
                    ))}
                </Select>
                <Button onClick={() => {
                    setSearchText('');
                    setSelectedDepartment(undefined);
                    setSelectedUnit(undefined);
                    setSelectedPeriod(undefined);
                }}>
                    🗑️ پاک کردن فیلترها
                </Button>
            </div>

            {/* ===== نمایش گروهی بر اساس اداره ===== */}
            <Spin spinning={loading}>
                {Object.entries(getGroupedPersonnel()).map(([deptId, personnelItems]) => {
                    const dept = departments.find(d => d.id === Number(deptId));
                    const deptName = dept?.name || `اداره ${toPersianNumber(deptId)}`;
                    const deptColor = dept?.color || '#00235c';
                    const unitsOfDept = units.filter(u => u.department_id === Number(deptId));

                    return (
                        <Card
                            key={deptId}
                            style={{ marginBottom: 16, borderRadius: 16 }}
                            bodyStyle={{ padding: 0 }}
                        >
                            {/* ===== هدر اداره ===== */}
                            <div
                                style={{
                                    padding: '16px 20px',
                                    background: '#f8fafc',
                                    borderBottom: `3px solid ${deptColor}`,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: 8,
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 28, height: 28, borderRadius: 10, background: deptColor }} />
                                    <Text strong style={{ fontSize: '1.15rem' }}>{deptName}</Text>
                                    <Space size={8}>
                                        <Tag>{toPersianNumber(unitsOfDept.length)} واحد</Tag>
                                        <Tag>{toPersianNumber(personnelItems.length)} پرسنل</Tag>
                                    </Space>
                                </div>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {periods.map((period) => (
                                        <Button
                                            key={period.id}
                                            size="small"
                                            type={selectedPeriod === period.id ? 'primary' : 'default'}
                                            onClick={() => setSelectedPeriod(selectedPeriod === period.id ? undefined : period.id)}
                                        >
                                            📅 {period.title}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* ===== جدول پرسنل اداره ===== */}
                            <Table
                                dataSource={personnelItems}
                                columns={getColumns(Number(deptId))}
                                rowKey="id"
                                pagination={false}
                                size="small"
                                scroll={{ x: 'max-content' }}
                            />
                        </Card>
                    );
                })}
            </Spin>

            {/* ===== مودال افزودن/ویرایش پرسنل ===== */}
            <Modal
                title={editingPersonnel ? '✏️ ویرایش پرسنل' : '➕ افزودن پرسنل جدید'}
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
                                    name="national_code"
                                    label="کد ملی"
                                    rules={[
                                        { required: true, message: 'لطفاً کد ملی را وارد کنید' },
                                        { len: 10, message: 'کد ملی باید ۱۰ رقم باشد' },
                                    ]}
                                >
                                    <Input placeholder="۱۲۳۴۵۶۷۸۹۰" maxLength={10} dir="ltr" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="first_name"
                                    label="نام"
                                    rules={[{ required: true, message: 'لطفاً نام را وارد کنید' }]}
                                >
                                    <Input placeholder="نام" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="last_name"
                                    label="نام خانوادگی"
                                    rules={[{ required: true, message: 'لطفاً نام خانوادگی را وارد کنید' }]}
                                >
                                    <Input placeholder="نام خانوادگی" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="phone" label="شماره تماس">
                                    <Input placeholder="۰۹۱۲۳۴۵۶۷۸۹" dir="ltr" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="position" label="سمت">
                                    <Input placeholder="سمت" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="period_id"
                                    label="دوره"
                                    rules={[{ required: true, message: 'لطفاً دوره را انتخاب کنید' }]}
                                >
                                    <Select placeholder="انتخاب دوره">
                                        {periods.map((period) => (
                                            <Option key={period.id} value={period.id}>
                                                {period.title} ({period.start_date} - {period.end_date})
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="department_id"
                                    label="اداره"
                                    rules={[{ required: true, message: 'لطفاً اداره را انتخاب کنید' }]}
                                >
                                    <Select
                                        placeholder="انتخاب اداره"
                                        onChange={(value) => {
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
                                <Form.Item
                                    name="unit_id"
                                    label="واحد"
                                    rules={[{ required: true, message: 'لطفاً واحد را انتخاب کنید' }]}
                                >
                                    <Select
                                        placeholder="انتخاب واحد"
                                        disabled={!form.getFieldValue('department_id')}
                                    >
                                        {units
                                            .filter(u => u.department_id === form.getFieldValue('department_id'))
                                            .map((unit) => (
                                                <Option key={unit.id} value={unit.id}>{unit.name}</Option>
                                            ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item>
                            <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Button onClick={() => setModalVisible(false)}>انصراف</Button>
                                <Button type="primary" htmlType="submit" loading={formLoading}>
                                    {editingPersonnel ? 'ذخیره تغییرات' : 'ایجاد پرسنل'}
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Spin>
            </Modal>

            {/* ===== مودال افزودن کاربران ===== */}
            <Modal
                title="👥 افزودن کاربران به پرسنل"
                open={addUsersModalVisible}
                onCancel={() => {
                    setAddUsersModalVisible(false);
                    setSelectedUserIds(new Set());
                }}
                footer={null}
                width={880}
                destroyOnClose
            >
                <Spin spinning={addUsersLoading}>
                    {/* فیلترها */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                        <Input.Search
                            placeholder="🔍 جستجو در کد ملی، نام..."
                            allowClear
                            value={addUsersSearch}
                            onChange={(e) => {
                                setAddUsersSearch(e.target.value);
                                loadUsersForAdd();
                            }}
                            style={{ flex: 2, minWidth: 150 }}
                            enterButton
                        />
                        <Select
                            style={{ flex: 1, minWidth: 120 }}
                            allowClear
                            placeholder="همه ادارات"
                            value={addUsersDeptFilter}
                            onChange={(value) => {
                                setAddUsersDeptFilter(value);
                                loadUsersForAdd();
                            }}
                        >
                            {(Array.isArray(departmentsWithUnits) ? departmentsWithUnits : []).map((dept: any) => (
                                <Option key={dept.id} value={dept.id}>{dept.name}</Option>
                            ))}
                        </Select>
                        <Select
                            style={{ flex: 1, minWidth: 120 }}
                            allowClear
                            placeholder="همه واحدها"
                            value={addUsersUnitFilter}
                            onChange={(value) => {
                                setAddUsersUnitFilter(value);
                                loadUsersForAdd();
                            }}
                            disabled={!addUsersDeptFilter}
                        >
                            {(() => {
                                const found = (Array.isArray(departmentsWithUnits) ? departmentsWithUnits : [])
                                    .find((d: any) => d.id === addUsersDeptFilter);
                                return found?.units?.map((unit: any) => (
                                    <Option key={unit.id} value={unit.id}>{unit.name}</Option>
                                )) || [];
                            })()}
                        </Select>
                        <Button size="small" onClick={() => {
                            setAddUsersSearch('');
                            setAddUsersDeptFilter(undefined);
                            setAddUsersUnitFilter(undefined);
                            loadUsersForAdd();
                        }}>
                            پاک کردن
                        </Button>
                    </div>

                    {/* انتخاب دوره */}
                    <div style={{ background: '#fef3c7', padding: 12, borderRadius: 12, marginBottom: 16, borderRight: '4px solid #ff8f00' }}>
                        <Text strong>📅 انتخاب دوره برای افزودن پرسنل *</Text>
                        <Select
                            style={{ width: '100%', marginTop: 8 }}
                            placeholder="انتخاب دوره..."
                            value={addUsersPeriodId}
                            onChange={(value) => {
                                setAddUsersPeriodId(value);
                                loadUsersForAdd();
                            }}
                        >
                            {periods.map((period) => (
                                <Option key={period.id} value={period.id}>
                                    {period.title} ({period.start_date} - {period.end_date})
                                    {period.is_active ? ' ✓ فعال' : ''}
                                </Option>
                            ))}
                        </Select>
                    </div>

                    {/* آمار */}
                    <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                        <Tag color="blue">✅ انتخاب شده: {toPersianNumber(selectedUserIds.size)}</Tag>
                        <Tag color="green">👥 کل کاربران: {toPersianNumber(filteredUsers.length)}</Tag>
                        <Tag color="orange">⚠️ تکراری در دوره: {toPersianNumber(filteredUsers.filter(u => u.is_duplicate).length)}</Tag>
                    </div>

                    {/* لیست کاربران */}
                    <div style={{ maxHeight: 400, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 16 }}>
                        <Table
                            dataSource={filteredUsers}
                            rowKey="id"
                            pagination={false}
                            size="small"
                            rowClassName={(record) => record.is_duplicate ? 'user-row-duplicate' : ''}
                            columns={[
                                {
                                    title: <Checkbox
                                        checked={filteredUsers.filter(u => !u.is_duplicate).every(u => selectedUserIds.has(u.id))}
                                        indeterminate={filteredUsers.filter(u => !u.is_duplicate).some(u => selectedUserIds.has(u.id)) && !filteredUsers.filter(u => !u.is_duplicate).every(u => selectedUserIds.has(u.id))}
                                        onChange={(e) => toggleSelectAllUsers(e.target.checked)}
                                    />,
                                    dataIndex: 'id',
                                    key: 'select',
                                    width: 40,
                                    render: (id: number, record: UserForAdd) => (
                                        <Checkbox
                                            checked={selectedUserIds.has(id)}
                                            onChange={(e) => toggleUserSelection(id, e.target.checked)}
                                            disabled={record.is_duplicate}
                                        />
                                    ),
                                },
                                {
                                    title: 'کد ملی',
                                    dataIndex: 'national_code',
                                    key: 'national_code',
                                },
                                {
                                    title: 'نام و نام خانوادگی',
                                    dataIndex: 'full_name',
                                    key: 'full_name',
                                    render: (text: string) => <Text strong>{text}</Text>,
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
                                    title: 'وضعیت',
                                    key: 'status',
                                    render: (_: any, record: UserForAdd) => {
                                        if (record.is_duplicate) {
                                            return <Tag color="orange">⚠️ تکراری</Tag>;
                                        }
                                        if (record.has_assignment) {
                                            return <Tag color="green">✓ دارای انتصاب</Tag>;
                                        }
                                        return <Tag color="default">بدون انتصاب</Tag>;
                                    },
                                },
                            ]}
                        />
                    </div>

                    {/* دکمه‌ها */}
                    <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                        <Button
                            type="primary"
                            style={{ flex: 1 }}
                            onClick={addSelectedUsersToPersonnel}
                            disabled={selectedUserIds.size === 0 || !addUsersPeriodId}
                        >
                            🚀 افزودن پرسنل انتخاب‌شده
                        </Button>
                        <Button onClick={() => {
                            setAddUsersModalVisible(false);
                            setSelectedUserIds(new Set());
                        }}>
                            ✗ انصراف
                        </Button>
                    </div>
                </Spin>
            </Modal>

            {/* ===== مودال تکثیر ===== */}
            <Modal
                title="📋 تکثیر دسته‌جمعی پرسنل بین دوره‌ها"
                open={copyModalVisible}
                onCancel={() => setCopyModalVisible(false)}
                footer={null}
                width={600}
            >
                <Form layout="vertical">
                    <Form.Item label="📅 دوره مبدأ (منبع کپی)">
                        <Select
                            placeholder="انتخاب دوره مبدأ..."
                            value={copySourcePeriod}
                            onChange={setCopySourcePeriod}
                        >
                            {periods.map((period) => (
                                <Option key={period.id} value={period.id}>
                                    {period.title} ({period.start_date} - {period.end_date})
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item label="📅 دوره مقصد (هدف کپی)">
                        <Select
                            placeholder="انتخاب دوره مقصد..."
                            value={copyTargetPeriod}
                            onChange={setCopyTargetPeriod}
                        >
                            {periods.map((period) => (
                                <Option key={period.id} value={period.id}>
                                    {period.title} ({period.start_date} - {period.end_date})
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item label="⚠️ در صورت وجود کد ملی تکراری در دوره مقصد:">
                        <Radio.Group value={copyDuplicateAction} onChange={(e) => setCopyDuplicateAction(e.target.value)}>
                            <Radio value="skip">نادیده گرفتن (رد شدن)</Radio>
                            <Radio value="overwrite">جایگزینی (بروزرسانی)</Radio>
                        </Radio.Group>
                    </Form.Item>

                    <Button
                        type="primary"
                        block
                        onClick={handleCopyPersonnel}
                        disabled={!copySourcePeriod || !copyTargetPeriod || copySourcePeriod === copyTargetPeriod}
                    >
                        🚀 شروع تکثیر
                    </Button>
                </Form>
            </Modal>

            {/* ===== مودال آپلود اکسل ===== */}
            <Modal
                title="📤 آپلود اکسل پرسنل"
                open={uploadModalVisible}
                onCancel={() => {
                    setUploadModalVisible(false);
                    setUploadFileList([]);
                    setUploadProgress(0);
                }}
                footer={null}
                width={600}
            >
                <Spin spinning={uploadLoading}>
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <FileExcelOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                        <p style={{ marginTop: 16 }}>
                            فایل اکسل با فرمت <strong>.xlsx</strong> یا <strong>.xls</strong> را انتخاب کنید
                        </p>
                        <p style={{ color: '#888', fontSize: 12 }}>
                            ستون‌های مورد نیاز: کد ملی، نام، نام خانوادگی، نام اداره، نام واحد، دوره، شماره تماس، سمت
                        </p>
                    </div>

                    <Upload
                        fileList={uploadFileList}
                        onChange={(info) => {
                            setUploadFileList(info.fileList);
                        }}
                        beforeUpload={(file) => {
                            setUploadFileList([file]);
                            return false;
                        }}
                        onRemove={() => {
                            setUploadFileList([]);
                            setUploadProgress(0);
                        }}
                        accept=".xlsx,.xls"
                        maxCount={1}
                    >
                        <Button icon={<UploadOutlined />} block>
                            انتخاب فایل
                        </Button>
                    </Upload>

                    {uploadFileList.length > 0 && (
                        <div style={{ marginTop: 16 }}>
                            <Text strong>فایل انتخاب شده: </Text>
                            <Text>{uploadFileList[0]?.name}</Text>
                            <Text type="secondary" style={{ marginLeft: 8 }}>
                                ({(uploadFileList[0]?.size / 1024).toFixed(0)} KB)
                            </Text>
                        </div>
                    )}

                    {uploadLoading && (
                        <div style={{ marginTop: 16 }}>
                            <Progress percent={uploadProgress} status="active" />
                            <Text type="secondary">در حال آپلود و پردازش فایل...</Text>
                        </div>
                    )}

                    <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <Button onClick={() => {
                            setUploadModalVisible(false);
                            setUploadFileList([]);
                            setUploadProgress(0);
                        }}>
                            بستن
                        </Button>
                        <Button
                            type="primary"
                            onClick={handleUploadExcel}
                            loading={uploadLoading}
                            disabled={uploadFileList.length === 0 || uploadLoading}
                            icon={<UploadOutlined />}
                        >
                            آپلود
                        </Button>
                    </div>
                </Spin>
            </Modal>

            {/* ===== نوار پیشرفت ===== */}
            {addUsersProgress.show && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0,0,0,0.7)',
                    zIndex: 2000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(8px)',
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: 32,
                        padding: 40,
                        width: 420,
                        maxWidth: '90%',
                        textAlign: 'center',
                    }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>☁️</div>
                        <h3 style={{ marginBottom: 8 }}>{addUsersProgress.text}</h3>
                        <div style={{ background: '#e2e8f0', borderRadius: 30, height: 12, margin: '24px 0', overflow: 'hidden' }}>
                            <div style={{
                                width: `${addUsersProgress.percent}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, #ff8f00, #e67e00)',
                                borderRadius: 30,
                                transition: 'width 0.3s ease',
                            }} />
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#475569', marginBottom: 12 }}>
                            {addUsersProgress.detail}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .user-row-duplicate {
                    opacity: 0.5;
                }
                .user-row-duplicate td {
                    text-decoration: line-through;
                }
            `}</style>
        </div>
    );
};

export default PersonnelList;