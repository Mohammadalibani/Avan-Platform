// frontend/src/components/Admin/DepartmentsList.tsx
import React, { useState, useEffect } from 'react';
import {
    Card,
    Typography,
    Space,
    Button,
    Input,
    Tag,
    Tooltip,
    Popconfirm,
    message,
    Spin,
    Modal,
    Form,
    Row,
    Col,
    ColorPicker,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    ReloadOutlined,
    ApartmentOutlined,
    UserOutlined,
    TeamOutlined,
    SearchOutlined,
    ClearOutlined,
} from '@ant-design/icons';
import { adminApi, Department, Unit } from '../../api/admin';
import { User } from '../../types';

const { Title, Text } = Typography;

// ===== تبدیل اعداد به فارسی =====
const toPersianNumber = (num: number | string): string => {
    if (num === undefined || num === null) return '۰';
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    return String(num).replace(/\d/g, (d: string) => persianDigits[parseInt(d)]);
};

// ===== تبدیل تاریخ میلادی به شمسی با اعداد فارسی =====
const toPersianDate = (dateStr: string): string => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const persianDate = date.toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    return persianDate.replace(/\d/g, (d) => {
        const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
        return persianDigits[parseInt(d)];
    });
};

interface DepartmentWithDetails extends Department {
    managers?: { id: number; full_name: string }[];
    units_count?: number;
    personnel_count?: number;
}

const DepartmentsList: React.FC = () => {
    const [departments, setDepartments] = useState<DepartmentWithDetails[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');

    // ===== مودال =====
    const [modalVisible, setModalVisible] = useState(false);
    const [editingDept, setEditingDept] = useState<DepartmentWithDetails | null>(null);
    const [form] = Form.useForm();
    const [formLoading, setFormLoading] = useState(false);
    const [selectedManagerIds, setSelectedManagerIds] = useState<Set<number>>(new Set());
    const [managerSearch, setManagerSearch] = useState('');
    const [selectedColor, setSelectedColor] = useState('#3498db');

    // ===== بارگذاری داده‌ها =====
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [deptsRes, unitsRes, usersRes] = await Promise.all([
                adminApi.getDepartments(),
                adminApi.getUnits(),
                adminApi.getUsers({ per_page: 1000 }),
            ]);

            // دپارتمان‌ها
            const deptsData = deptsRes.data?.data || deptsRes.data || [];
            setDepartments(Array.isArray(deptsData) ? deptsData : []);

            // واحدها
            const unitsData = unitsRes.data?.data || unitsRes.data || [];
            setUnits(Array.isArray(unitsData) ? unitsData : []);

            // ===== فیلتر کاربران: فقط ادمین و مدیر اداره =====
            const usersData = usersRes.data?.data?.users || usersRes.data?.data || [];
            const filteredUsers = (Array.isArray(usersData) ? usersData : []).filter(
                (user: User) => user.role === 'admin' || user.role === 'dept_manager'
            );
            setUsers(filteredUsers);

        } catch (error) {
            console.error('Error fetching departments:', error);
            message.error('خطا در دریافت اطلاعات');
        } finally {
            setLoading(false);
        }
    };

    // ===== فیلتر =====
    const filteredDepartments = departments.filter((dept) =>
        dept.name.toLowerCase().includes(searchText.toLowerCase())
    );

    // ===== عملیات =====
    const handleAddDepartment = () => {
        setEditingDept(null);
        setSelectedManagerIds(new Set());
        setManagerSearch('');
        setSelectedColor('#3498db');
        form.resetFields();
        form.setFieldsValue({
            color: '#3498db',
        });
        setModalVisible(true);
    };

    const handleEditDepartment = (dept: DepartmentWithDetails) => {
        setEditingDept(dept);
        const managerIds = new Set(dept.managers?.map((m) => m.id) || []);
        setSelectedManagerIds(managerIds);
        setManagerSearch('');
        setSelectedColor(dept.color || '#3498db');
        form.setFieldsValue({
            name: dept.name,
            color: dept.color || '#3498db',
            description: dept.description || '',
        });
        setModalVisible(true);
    };

    const handleDeleteDepartment = async (id: number, name: string) => {
        try {
            setLoading(true);
            const res = await adminApi.deleteDepartment(id);
            if (res.data.success) {
                message.success(`اداره ${name} با موفقیت حذف شد`);
                await fetchData();
            }
        } catch (error: any) {
            console.error('Error deleting department:', error);
            message.error(error.response?.data?.message || 'خطا در حذف اداره');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values: any) => {
        try {
            setFormLoading(true);
            
            // اطمینان از اینکه رنگ به صورت رشته هگزادسیمال است
            let colorValue = values.color;
            if (colorValue && typeof colorValue === 'object' && colorValue.toHexString) {
                colorValue = colorValue.toHexString();
            } else if (typeof colorValue !== 'string') {
                colorValue = '#3498db';
            }
            
            const data = {
                name: values.name,
                color: colorValue,
                description: values.description || '',
                manager_ids: Array.from(selectedManagerIds),
            };

            let res;
            if (editingDept) {
                res = await adminApi.updateDepartment(editingDept.id, data);
                if (res.data.success) {
                    message.success('اداره با موفقیت ویرایش شد');
                }
            } else {
                res = await adminApi.createDepartment(data);
                if (res.data.success) {
                    message.success('اداره با موفقیت ایجاد شد');
                }
            }
            
            setModalVisible(false);
            await fetchData();  // ← به‌روزرسانی داینامیک
            
        } catch (error: any) {
            console.error('Error saving department:', error);
            const errorMsg = error.response?.data?.message || 
                           error.response?.data?.error || 
                           'خطا در ذخیره اداره';
            message.error(errorMsg);
        } finally {
            setFormLoading(false);
        }
    };

    const toggleManagerSelection = (userId: number, checked: boolean) => {
        const newSet = new Set(selectedManagerIds);
        if (checked) {
            newSet.add(userId);
        } else {
            newSet.delete(userId);
        }
        setSelectedManagerIds(newSet);
    };

    const toggleSelectAllManagers = (checked: boolean) => {
        const newSet = new Set(selectedManagerIds);
        const filteredUsers = getFilteredUsers();
        if (checked) {
            filteredUsers.forEach((u) => newSet.add(u.id));
        } else {
            filteredUsers.forEach((u) => newSet.delete(u.id));
        }
        setSelectedManagerIds(newSet);
    };

    const getFilteredUsers = () => {
        const search = managerSearch.toLowerCase().trim();
        let filtered = users;
        if (search) {
            filtered = filtered.filter((user) =>
                user.full_name?.toLowerCase().includes(search) ||
                user.role_persian?.toLowerCase().includes(search)
            );
        }
        return filtered;
    };

    const getDepartmentManagers = (dept: DepartmentWithDetails) => {
        return dept.managers || [];
    };

    const getDepartmentUnits = (dept: DepartmentWithDetails) => {
        return units.filter((u) => u.department_id === dept.id);
    };

    const getUnitSupervisors = (unitId: number) => {
        const unit = units.find((u) => u.id === unitId);
        return unit?.supervisors || [];
    };

    // ===== رندر =====
    return (
        <div style={{ padding: 24, fontFamily: "'Vazirmatn', 'Segoe UI', sans-serif" }}>
            {/* ===== هدر ===== */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 8 }}>
                <div>
                    <Title level={3} style={{ margin: 0, fontFamily: "'Vazirmatn', 'Segoe UI', sans-serif" }}>
                        🏢 مدیریت ادارات
                    </Title>
                    <Text type="secondary">{toPersianNumber(departments.length)} اداره</Text>
                </div>
                <Space wrap>
                    <Button icon={<ReloadOutlined />} onClick={() => fetchData()}>
                        بارگذاری مجدد
                    </Button>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAddDepartment}
                    >
                        افزودن اداره جدید
                    </Button>
                </Space>
            </div>

            {/* ===== جستجو ===== */}
            <div style={{
                background: '#fafafa',
                borderRadius: 12,
                padding: '12px 16px',
                marginBottom: 24,
                display: 'flex',
                gap: 12,
                alignItems: 'center',
            }}>
                <Input.Search
                    placeholder="🔍 جستجو در نام ادارات..."
                    allowClear
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ width: 300 }}
                    prefix={<SearchOutlined />}
                    enterButton
                />
                {searchText && (
                    <Button
                        icon={<ClearOutlined />}
                        onClick={() => setSearchText('')}
                    >
                        پاک کردن
                    </Button>
                )}
            </div>

            {/* ===== لیست ادارات ===== */}
            <Spin spinning={loading}>
                {filteredDepartments.length === 0 ? (
                    <Card style={{ textAlign: 'center', padding: '60px 20px' }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
                        <Text type="secondary" style={{ fontSize: 16 }}>
                            {searchText ? 'هیچ اداره‌ای با این نام یافت نشد' : 'هیچ اداره‌ای تعریف نشده است'}
                        </Text>
                        {!searchText && (
                            <div style={{ marginTop: 16 }}>
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={handleAddDepartment}
                                >
                                    افزودن اداره جدید
                                </Button>
                            </div>
                        )}
                    </Card>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
                        gap: 24,
                    }}>
                        {filteredDepartments.map((dept) => {
                            const deptManagers = getDepartmentManagers(dept);
                            const deptUnits = getDepartmentUnits(dept);

                            return (
                                <Card
                                    key={`dept-${dept.id}-${Date.now()}`}  // ← کلید یکتا برای رندر مجدد
                                    style={{
                                        borderRadius: 28,
                                        overflow: 'hidden',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                                    }}
                                    bodyStyle={{ padding: 0 }}
                                    hoverable
                                >
                                    {/* ===== هدر کارت ===== */}
                                    <div
                                        style={{
                                            padding: '18px 20px',
                                            background: '#f8fafc',
                                            borderBottom: `3px solid ${dept.color || '#3498db'}`,
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div
                                                style={{
                                                    width: 14,
                                                    height: 14,
                                                    borderRadius: '50%',
                                                    background: dept.color || '#3498db',
                                                    boxShadow: '0 0 0 2px rgba(255,255,255,0.8)',
                                                }}
                                            />
                                            <Text strong style={{ fontSize: '1.1rem' }}>
                                                {dept.name}
                                            </Text>
                                        </div>
                                        <Space size="small">
                                            <Tooltip title="ویرایش">
                                                <Button
                                                    type="text"
                                                    icon={<EditOutlined />}
                                                    size="small"
                                                    style={{ color: '#d97706', background: '#fef3c7' }}
                                                    onClick={() => handleEditDepartment(dept)}
                                                />
                                            </Tooltip>
                                            <Tooltip title="حذف">
                                                <Popconfirm
                                                    title="حذف اداره"
                                                    description={`آیا از حذف اداره "${dept.name}" اطمینان دارید؟\nتوجه: با حذف اداره، تمام واحدها و پرسنل مرتبط نیز حذف خواهند شد!`}
                                                    onConfirm={() => handleDeleteDepartment(dept.id, dept.name)}
                                                    okText="بله، حذف کن"
                                                    cancelText="انصراف"
                                                    okButtonProps={{ danger: true }}
                                                >
                                                    <Button
                                                        type="text"
                                                        icon={<DeleteOutlined />}
                                                        size="small"
                                                        danger
                                                        style={{ background: '#fee2e2' }}
                                                    />
                                                </Popconfirm>
                                            </Tooltip>
                                        </Space>
                                    </div>

                                    {/* ===== بدنه کارت ===== */}
                                    <div style={{ padding: 20 }}>
                                        {/* توضیحات */}
                                        <div style={{
                                            color: '#64748b',
                                            fontSize: '0.75rem',
                                            marginBottom: 16,
                                            paddingBottom: 12,
                                            borderBottom: '1px dashed #e2e8f0',
                                            lineHeight: 1.5,
                                        }}>
                                            {dept.description || 'بدون توضیحات'}
                                        </div>

                                        {/* واحدها و سرپرستان */}
                                        <div style={{ marginBottom: 16 }}>
                                            <div style={{
                                                fontSize: '0.7rem',
                                                fontWeight: 600,
                                                color: '#94a3b8',
                                                marginBottom: 10,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 6,
                                            }}>
                                                <span>📁 واحدها و سرپرستان</span>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                {deptUnits.length === 0 ? (
                                                    <Tag color="default">هیچ واحدی تعریف نشده</Tag>
                                                ) : (
                                                    deptUnits.map((unit) => {
                                                        const supervisors = getUnitSupervisors(unit.id);
                                                        return (
                                                            <div
                                                                key={unit.id}
                                                                style={{
                                                                    background: '#f8fafc',
                                                                    borderRadius: 16,
                                                                    padding: 12,
                                                                    borderRight: `3px solid ${dept.color || '#3498db'}`,
                                                                }}
                                                            >
                                                                <div style={{
                                                                    fontWeight: 700,
                                                                    fontSize: '0.8rem',
                                                                    color: '#1e293b',
                                                                    marginBottom: 8,
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: 6,
                                                                }}>
                                                                    📁 {unit.name}
                                                                </div>
                                                                <div style={{
                                                                    paddingRight: 20,
                                                                    display: 'flex',
                                                                    flexWrap: 'wrap',
                                                                    gap: 6,
                                                                }}>
                                                                    {supervisors.length === 0 ? (
                                                                        <Tag color="default" style={{ fontSize: '0.65rem' }}>
                                                                            بدون سرپرست
                                                                        </Tag>
                                                                    ) : (
                                                                        supervisors.map((sup) => (
                                                                            <Tag
                                                                                key={sup.id}
                                                                                color="gold"
                                                                                style={{
                                                                                    fontSize: '0.65rem',
                                                                                    padding: '4px 12px',
                                                                                }}
                                                                            >
                                                                                👥 {sup.full_name}
                                                                            </Tag>
                                                                        ))
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>

                                        {/* مدیران اداره */}
                                        <div style={{ marginBottom: 0 }}>
                                            <div style={{
                                                fontSize: '0.7rem',
                                                fontWeight: 600,
                                                color: '#94a3b8',
                                                marginBottom: 10,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 6,
                                            }}>
                                                <span>👔 مدیران اداره</span>
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                {deptManagers.length === 0 ? (
                                                    <Tag color="default">هیچ مدیری انتخاب نشده</Tag>
                                                ) : (
                                                    deptManagers.map((manager) => (
                                                        <Tag
                                                            key={manager.id}
                                                            color="purple"
                                                            style={{
                                                                fontSize: '0.7rem',
                                                                padding: '5px 12px',
                                                            }}
                                                        >
                                                            👤 {manager.full_name}
                                                        </Tag>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* ===== فوتر کارت ===== */}
                                    <div style={{
                                        padding: '14px 20px',
                                        background: '#f8fafc',
                                        borderTop: '1px solid #e2e8f0',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        fontSize: '0.7rem',
                                        color: '#64748b',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            📅 تاریخ ایجاد: {toPersianDate(dept.created_at || '')}
                                        </div>
                                        <div style={{ display: 'flex', gap: 12 }}>
                                            <span>🏢 {toPersianNumber(deptUnits.length)} واحد</span>
                                            <span>👥 {toPersianNumber(dept.personnel_count || 0)} پرسنل</span>
                                            <span>👔 {toPersianNumber(deptManagers.length)} مدیر</span>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </Spin>

            {/* ===== مودال افزودن/ویرایش اداره ===== */}
            <Modal
                title={editingDept ? 'ویرایش اداره' : 'افزودن اداره جدید'}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
                width={600}
                destroyOnClose
            >
                <Spin spinning={formLoading}>
                    <Form form={form} layout="vertical" onFinish={handleSubmit}>
                        <Form.Item
                            name="name"
                            label="نام اداره"
                            rules={[{ required: true, message: 'لطفاً نام اداره را وارد کنید' }]}
                        >
                            <Input placeholder="مثال: اداره مالی" size="large" />
                        </Form.Item>

                        <Form.Item
                            name="color"
                            label="رنگ اداره"
                            getValueFromEvent={(value) => {
                                if (value && typeof value === 'object' && value.toHexString) {
                                    return value.toHexString();
                                }
                                return value;
                            }}
                        >
                            <ColorPicker
                                format="hex"
                                value={selectedColor}
                                onChange={(color) => {
                                    const hexColor = color.toHexString();
                                    setSelectedColor(hexColor);
                                    form.setFieldsValue({ color: hexColor });
                                }}
                                presets={[
                                    {
                                        label: 'رنگ‌های پیشنهادی',
                                        colors: [
                                            '#3498db', '#2ecc71', '#e74c3c',
                                            '#f39c12', '#9b59b6', '#1abc9c',
                                            '#e67e22', '#2c3e50', '#16a085',
                                            '#c0392b', '#8e44ad', '#2980b9',
                                        ],
                                    },
                                ]}
                                showText
                            />
                        </Form.Item>

                        <Form.Item
                            name="description"
                            label="توضیحات"
                        >
                            <Input.TextArea rows={3} placeholder="توضیحات اختیاری..." />
                        </Form.Item>

                        {/* انتخاب مدیران - فقط ادمین و مدیر اداره */}
                        <Form.Item label={`مدیران اداره (${toPersianNumber(selectedManagerIds.size)} انتخاب شده)`}>
                            <div style={{ marginBottom: 12 }}>
                                <Input.Search
                                    placeholder="🔍 جستجو در نام، نقش..."
                                    value={managerSearch}
                                    onChange={(e) => setManagerSearch(e.target.value)}
                                />
                            </div>
                            <div style={{
                                maxHeight: 250,
                                overflowY: 'auto',
                                border: '1px solid #e2e8f0',
                                borderRadius: 16,
                                padding: 8,
                            }}>
                                {getFilteredUsers().map((user) => (
                                    <div
                                        key={user.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 12,
                                            padding: '10px 14px',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid #f1f5f9',
                                            borderRadius: 12,
                                            transition: 'background 0.2s',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = '#f8fafc';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'transparent';
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedManagerIds.has(user.id)}
                                            onChange={(e) => toggleManagerSelection(user.id, e.target.checked)}
                                            style={{ width: 18, height: 18, cursor: 'pointer' }}
                                        />
                                        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 5 }}>
                                            <span style={{ fontWeight: 600, color: '#1e293b' }}>
                                                {user.full_name}
                                            </span>
                                            <span style={{
                                                fontSize: '0.65rem',
                                                color: '#64748b',
                                                background: '#f1f5f9',
                                                padding: '3px 10px',
                                                borderRadius: 30,
                                            }}>
                                                {user.role_persian || user.role}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {getFilteredUsers().length === 0 && (
                                    <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>
                                        هیچ کاربری با نقش ادمین یا مدیر اداره یافت نشد
                                    </div>
                                )}
                            </div>
                            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                                <Button
                                    size="small"
                                    onClick={() => {
                                        const filtered = getFilteredUsers();
                                        const allSelected = filtered.every((u) => selectedManagerIds.has(u.id));
                                        const newSet = new Set(selectedManagerIds);
                                        if (allSelected) {
                                            filtered.forEach((u) => newSet.delete(u.id));
                                        } else {
                                            filtered.forEach((u) => newSet.add(u.id));
                                        }
                                        setSelectedManagerIds(newSet);
                                    }}
                                >
                                    {getFilteredUsers().every((u) => selectedManagerIds.has(u.id))
                                        ? 'لغو انتخاب همه'
                                        : 'انتخاب همه نمایش داده‌شده'}
                                </Button>
                            </div>
                        </Form.Item>

                        <Form.Item>
                            <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Button onClick={() => setModalVisible(false)}>
                                    انصراف
                                </Button>
                                <Button type="primary" htmlType="submit" loading={formLoading}>
                                    {editingDept ? 'ذخیره تغییرات' : 'ایجاد اداره'}
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Spin>
            </Modal>
        </div>
    );
};

export default DepartmentsList;