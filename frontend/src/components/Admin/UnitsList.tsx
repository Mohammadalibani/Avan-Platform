// frontend/src/components/Admin/UnitsList.tsx
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
    Switch,
    Checkbox,
    Select,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    ReloadOutlined,
    SearchOutlined,
    ClearOutlined,
} from '@ant-design/icons';
import { adminApi, Department, Unit } from '../../api/admin';
import { User } from '../../types';

const { Title, Text } = Typography;
const { Option } = Select;

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

const UnitsList: React.FC = () => {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');

    // ===== مودال =====
    const [modalVisible, setModalVisible] = useState(false);
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
    const [form] = Form.useForm();
    const [formLoading, setFormLoading] = useState(false);
    const [selectedSupervisorIds, setSelectedSupervisorIds] = useState<Set<number>>(new Set());
    const [supervisorSearch, setSupervisorSearch] = useState('');
    const [preselectedDeptId, setPreselectedDeptId] = useState<number | null>(null);

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

            // واحدها - اصلاح شده
            const unitsData = unitsRes.data?.data || unitsRes.data || [];
            console.log("📊 Units from API:", unitsData);
            console.log("📊 Count:", unitsData.length);
            setUnits(Array.isArray(unitsData) ? unitsData : []);

            // کاربران
            const usersData = usersRes.data?.data?.users || usersRes.data?.data || [];
            const supervisorUsers = (Array.isArray(usersData) ? usersData : []).filter(
                (user: User) => user.role === 'unit_supervisor' || user.role === 'admin'
            );
            setUsers(supervisorUsers);

        } catch (error) {
            console.error('Error fetching units:', error);
            message.error('خطا در دریافت اطلاعات');
        } finally {
            setLoading(false);
        }
    };

    // ===== فیلتر =====
    const getFilteredUnits = (deptId: number) => {
        return units.filter((unit) => Number(unit.department_id) === Number(deptId));
    };

    const getFilteredDepartments = () => {
        if (!searchText) return departments;
        const search = searchText.toLowerCase();
        return departments.filter((dept) =>
            dept.name.toLowerCase().includes(search)
        );
    };

    // ===== عملیات =====
    const handleAddUnit = (deptId?: number) => {
        setEditingUnit(null);
        setSelectedSupervisorIds(new Set());
        setSupervisorSearch('');
        setPreselectedDeptId(deptId || null);
        form.resetFields();
        form.setFieldsValue({
            department_id: deptId || undefined,
            needs_approval: true,
        });
        setModalVisible(true);
    };

    const handleEditUnit = async (unit: Unit) => {
        try {
            setEditingUnit(unit);
            const supervisorIds = new Set(unit.supervisors?.map((s: any) => s.id) || []);
            setSelectedSupervisorIds(supervisorIds);
            setSupervisorSearch('');
            setPreselectedDeptId(null);
            form.setFieldsValue({
                name: unit.name,
                department_id: unit.department_id,
                description: unit.description || '',
                needs_approval: unit.needs_approval !== false,
            });
            setModalVisible(true);
        } catch (error) {
            console.error('Error editing unit:', error);
            message.error('خطا در دریافت اطلاعات');
        }
    };

    const handleDeleteUnit = async (id: number, name: string) => {
        try {
            setLoading(true);
            const res = await adminApi.deleteUnit(id);
            if (res.data.success) {
                message.success(`واحد ${name} با موفقیت حذف شد`);
                await fetchData();
            }
        } catch (error: any) {
            console.error('Error deleting unit:', error);
            message.error(error.response?.data?.message || 'خطا در حذف واحد');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values: any) => {
        try {
            setFormLoading(true);
            const data = {
                name: values.name,
                department_id: values.department_id,
                description: values.description || '',
                needs_approval: values.needs_approval !== false,
                supervisor_ids: Array.from(selectedSupervisorIds),
            };

            let res;
            if (editingUnit) {
                res = await adminApi.updateUnit(editingUnit.id, data);
                if (res.data.success) {
                    message.success('واحد با موفقیت ویرایش شد');
                }
            } else {
                res = await adminApi.createUnit(data);
                if (res.data.success) {
                    message.success('واحد با موفقیت ایجاد شد');
                }
            }

            setModalVisible(false);
            await fetchData();

        } catch (error: any) {
            console.error('Error saving unit:', error);
            const errorMsg = error.response?.data?.message ||
                error.response?.data?.error ||
                'خطا در ذخیره واحد';
            message.error(errorMsg);
        } finally {
            setFormLoading(false);
        }
    };

    const toggleSupervisorSelection = (userId: number, checked: boolean) => {
        const newSet = new Set(selectedSupervisorIds);
        if (checked) {
            newSet.add(userId);
        } else {
            newSet.delete(userId);
        }
        setSelectedSupervisorIds(newSet);
    };

    const toggleSelectAllSupervisors = (checked: boolean) => {
        const newSet = new Set(selectedSupervisorIds);
        const filteredUsers = getFilteredSupervisors();
        if (checked) {
            filteredUsers.forEach((u) => newSet.add(u.id));
        } else {
            filteredUsers.forEach((u) => newSet.delete(u.id));
        }
        setSelectedSupervisorIds(newSet);
    };

    const getFilteredSupervisors = () => {
        const search = supervisorSearch.toLowerCase().trim();
        let filtered = users;
        if (search) {
            filtered = filtered.filter((user) =>
                user.full_name?.toLowerCase().includes(search) ||
                user.national_code?.includes(search) ||
                user.role_persian?.toLowerCase().includes(search)
            );
        }
        return filtered;
    };

    const getUnitSupervisors = (unit: Unit) => {
        return unit.supervisors || [];
    };

    // ===== رندر =====
    const filteredDepartments = getFilteredDepartments();

    return (
        <div style={{ padding: 24, fontFamily: "'Vazirmatn', 'Segoe UI', sans-serif" }}>
            {/* ===== هدر ===== */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 8 }}>
                <div>
                    <Title level={3} style={{ margin: 0, fontFamily: "'Vazirmatn', 'Segoe UI', sans-serif" }}>
                        📁 مدیریت واحدها
                    </Title>
                    <Text type="secondary">{toPersianNumber(units.length)} واحد</Text>
                </div>
                <Space wrap>
                    <Button icon={<ReloadOutlined />} onClick={() => fetchData()}>
                        بارگذاری مجدد
                    </Button>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => handleAddUnit()}
                    >
                        افزودن واحد جدید
                    </Button>
                    <Button 
                        type="default" 
                        icon={<ReloadOutlined />} 
                        onClick={() => { fetchData(); message.success('اطلاعات به‌روزرسانی شد'); }}
                    >
                        به‌روزرسانی
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

            {/* ===== لیست واحدها بر اساس اداره ===== */}
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
                                    onClick={() => window.location.href = '/admin/departments'}
                                >
                                    🏢 ابتدا اداره ایجاد کنید
                                </Button>
                            </div>
                        )}
                    </Card>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                        {filteredDepartments.map((dept) => {
                            const deptUnits = getFilteredUnits(dept.id);
                            const totalSupervisors = deptUnits.reduce((acc, unit) => {
                                return acc + (unit.supervisors?.length || 0);
                            }, 0);

                            return (
                                <Card
                                    key={`dept-${dept.id}-${units.length}`}
                                    style={{
                                        borderRadius: 24,
                                        overflow: 'hidden',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                    }}
                                    styles={{ body: { padding: 0 } }}
                                >
                                    {/* ===== هدر اداره ===== */}
                                    <div
                                        style={{
                                            padding: '16px 24px',
                                            background: `linear-gradient(135deg, ${dept.color || '#3498db'} 0%, ${dept.color || '#3498db'}dd 30%, ${dept.color || '#3498db'}99 30%, rgba(255,255,255,0.1) 100%)`,
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                            borderBottom: `3px dotted rgba(255,255,255,0.3)`,
                                            minHeight: 72,
                                            position: 'relative',
                                            overflow: 'hidden',
                                            transition: 'all 0.3s ease',
                                        }}
                                        onClick={() => {
                                            const card = document.querySelector(`[data-dept-id="${dept.id}"]`);
                                            if (card) {
                                                const content = card.querySelector('.units-grid');
                                                if (content) {
                                                    const isHidden = (content as HTMLElement).style.display === 'none';
                                                    (content as HTMLElement).style.display = isHidden ? 'grid' : 'none';
                                                }
                                            }
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
                                            <div
                                                style={{
                                                    width: 20,
                                                    height: 20,
                                                    borderRadius: 6,
                                                    background: dept.color || '#3498db',
                                                    border: '2px solid rgba(255,255,255,0.4)',
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                                    flexShrink: 0,
                                                }}
                                            />
                                            <Text strong style={{ fontSize: '1.1rem', color: '#020202', textShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>
                                                {dept.name}
                                            </Text>
                                        </div>
                                        <div style={{ display: 'flex', gap: 16, fontSize: '0.75rem', color: 'rgba(255,255,255,0.9)', position: 'relative', zIndex: 1 }}>
                                            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: 20, backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)', color: '#000' }}>
                                                🏢 واحدها: {toPersianNumber(deptUnits.length)}
                                            </span>
                                            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: 20, backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)', color: '#000' }}>
                                                👥 سرپرستان: {toPersianNumber(totalSupervisors)}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.7)', transition: 'transform 0.3s', position: 'relative', zIndex: 1 }}>
                                            ▼
                                        </div>
                                    </div>

                                    {/* ===== واحدها ===== */}
                                    <div
                                        className="units-grid"
                                        data-dept-id={dept.id}
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                                            gap: 16,
                                            padding: 24,
                                        }}
                                    >
                                        {deptUnits.length === 0 ? (
                                            <div style={{
                                                gridColumn: '1/-1',
                                                textAlign: 'center',
                                                padding: 40,
                                                color: '#94a3b8',
                                                fontSize: '0.85rem',
                                            }}>
                                                📭 هیچ واحدی برای این اداره تعریف نشده است
                                                <Button
                                                    type="primary"
                                                    size="small"
                                                    icon={<PlusOutlined />}
                                                    style={{ marginTop: 8 }}
                                                    onClick={() => handleAddUnit(dept.id)}
                                                >
                                                    افزودن واحد
                                                </Button>
                                            </div>
                                        ) : (
                                            deptUnits.map((unit) => {
                                                const supervisors = getUnitSupervisors(unit);
                                                return (
                                                    <div
                                                        key={unit.id}
                                                        style={{
                                                            background: '#f8fafc',
                                                            borderRadius: 20,
                                                            padding: 18,
                                                            transition: 'all 0.3s',
                                                            border: '1px solid #e2e8f0',
                                                            position: 'relative',
                                                        }}
                                                        className="unit-card"
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.transform = 'translateY(-3px)';
                                                            e.currentTarget.style.boxShadow = '0 8px 20px -8px rgba(0,0,0,0.1)';
                                                            e.currentTarget.style.borderColor = '#cbd5e1';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.transform = 'translateY(0)';
                                                            e.currentTarget.style.boxShadow = 'none';
                                                            e.currentTarget.style.borderColor = '#e2e8f0';
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                                            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
                                                                📁 {unit.name}
                                                            </div>
                                                            <div style={{ display: 'flex', gap: 8 }}>
                                                                <Tooltip title="ویرایش">
                                                                    <Button
                                                                        type="text"
                                                                        size="small"
                                                                        icon={<EditOutlined />}
                                                                        style={{ color: '#d97706', background: '#fef3c7' }}
                                                                        onClick={() => handleEditUnit(unit)}
                                                                    />
                                                                </Tooltip>
                                                                <Tooltip title="حذف">
                                                                    <Popconfirm
                                                                        title="حذف واحد"
                                                                        description={`آیا از حذف واحد "${unit.name}" اطمینان دارید؟\nتوجه: با حذف واحد، تمام پرسنل مرتبط نیز حذف خواهند شد!`}
                                                                        onConfirm={() => handleDeleteUnit(unit.id, unit.name)}
                                                                        okText="بله، حذف کن"
                                                                        cancelText="انصراف"
                                                                        okButtonProps={{ danger: true }}
                                                                    >
                                                                        <Button
                                                                            type="text"
                                                                            size="small"
                                                                            icon={<DeleteOutlined />}
                                                                            danger
                                                                            style={{ background: '#fee2e2' }}
                                                                        />
                                                                    </Popconfirm>
                                                                </Tooltip>
                                                            </div>
                                                        </div>

                                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 12, lineHeight: 1.4 }}>
                                                            {unit.description || 'بدون توضیحات'}
                                                        </div>

                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                                                            {supervisors.length === 0 ? (
                                                                <span style={{
                                                                    background: '#f1f5f9',
                                                                    color: '#94a3b8',
                                                                    padding: '4px 10px',
                                                                    borderRadius: 20,
                                                                    fontSize: '0.65rem',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: 4,
                                                                }}>
                                                                    بدون سرپرست
                                                                </span>
                                                            ) : (
                                                                supervisors.map((sup: any) => (
                                                                    <span
                                                                        key={sup.id}
                                                                        style={{
                                                                            background: '#e0e7ff',
                                                                            color: '#4f46e5',
                                                                            padding: '4px 10px',
                                                                            borderRadius: 20,
                                                                            fontSize: '0.65rem',
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            gap: 4,
                                                                        }}
                                                                    >
                                                                        👤 {sup.full_name}
                                                                    </span>
                                                                ))
                                                            )}
                                                        </div>

                                                        <div style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            marginTop: 12,
                                                            paddingTop: 12,
                                                            borderTop: '1px solid #e2e8f0',
                                                            fontSize: '0.65rem',
                                                            color: '#94a3b8',
                                                        }}>
                                                            <div>📅 {toPersianDate(unit.created_at || '')}</div>
                                                            {unit.needs_approval !== false ? (
                                                                <span style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: 5,
                                                                    background: '#dcfce7',
                                                                    color: '#16a34a',
                                                                    padding: '4px 10px',
                                                                    borderRadius: 20,
                                                                    fontSize: '0.65rem',
                                                                }}>
                                                                    🔒 نیاز به تایید ادمین
                                                                </span>
                                                            ) : (
                                                                <span style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: 5,
                                                                    background: '#f1f5f9',
                                                                    color: '#64748b',
                                                                    padding: '4px 10px',
                                                                    borderRadius: 20,
                                                                    fontSize: '0.65rem',
                                                                }}>
                                                                    📝 ثبت مستقیم
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </Spin>

            {/* ===== مودال افزودن/ویرایش واحد ===== */}
            <Modal
                title={editingUnit ? 'ویرایش واحد' : 'افزودن واحد جدید'}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
                width={600}
                destroyOnClose
            >
                <Spin spinning={formLoading}>
                    <Form form={form} layout="vertical" onFinish={handleSubmit}>
                        <Form.Item
                            name="department_id"
                            label="اداره"
                            rules={[{ required: true, message: 'لطفاً اداره را انتخاب کنید' }]}
                        >
                            <Select
                                placeholder="انتخاب اداره"
                                disabled={!!preselectedDeptId && !editingUnit}
                            >
                                {departments.map((dept) => (
                                    <Option key={dept.id} value={dept.id}>{dept.name}</Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="name"
                            label="نام واحد"
                            rules={[{ required: true, message: 'لطفاً نام واحد را وارد کنید' }]}
                        >
                            <Input placeholder="مثال: واحد مالی" size="large" />
                        </Form.Item>

                        <Form.Item
                            name="needs_approval"
                            label="نیاز به تایید ادمین"
                            valuePropName="checked"
                            help="در صورت فعال بودن، درخواست‌های افزودن و حذف پرسنل باید توسط ادمین تایید شود"
                        >
                            <Switch
                                checkedChildren="🔒 نیاز به تایید"
                                unCheckedChildren="📝 ثبت مستقیم"
                            />
                        </Form.Item>

                        <Form.Item
                            name="description"
                            label="توضیحات"
                        >
                            <Input.TextArea rows={3} placeholder="توضیحات اختیاری..." />
                        </Form.Item>

                        {/* انتخاب سرپرستان */}
                        <Form.Item label={`سرپرستان واحد (${toPersianNumber(selectedSupervisorIds.size)} انتخاب)`}>
                            <div style={{ marginBottom: 12 }}>
                                <Input.Search
                                    placeholder="🔍 جستجو در نام، کد ملی، نقش..."
                                    value={supervisorSearch}
                                    onChange={(e) => setSupervisorSearch(e.target.value)}
                                />
                            </div>
                            <div style={{
                                maxHeight: 250,
                                overflowY: 'auto',
                                border: '1px solid #e2e8f0',
                                borderRadius: 16,
                                padding: 8,
                            }}>
                                {getFilteredSupervisors().map((user) => (
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
                                        <Checkbox
                                            checked={selectedSupervisorIds.has(user.id)}
                                            onChange={(e) => toggleSupervisorSelection(user.id, e.target.checked)}
                                        />
                                        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 5 }}>
                                            <span style={{ fontWeight: 500, color: '#1e293b' }}>
                                                {user.full_name}
                                            </span>
                                            <span style={{
                                                fontSize: '0.65rem',
                                                color: '#64748b',
                                                background: '#f1f5f9',
                                                padding: '2px 8px',
                                                borderRadius: 20,
                                            }}>
                                                {user.role_persian || user.role}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {getFilteredSupervisors().length === 0 && (
                                    <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>
                                        هیچ کاربری با نقش سرپرست واحد یافت نشد
                                    </div>
                                )}
                            </div>
                            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                                <Button
                                    size="small"
                                    onClick={() => {
                                        const filtered = getFilteredSupervisors();
                                        const allSelected = filtered.every((u) => selectedSupervisorIds.has(u.id));
                                        toggleSelectAllSupervisors(!allSelected);
                                    }}
                                >
                                    {getFilteredSupervisors().every((u) => selectedSupervisorIds.has(u.id))
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
                                    {editingUnit ? 'ذخیره تغییرات' : 'ایجاد واحد'}
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Spin>
            </Modal>
        </div>
    );
};

export default UnitsList;