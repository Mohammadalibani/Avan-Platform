// frontend/src/components/Admin/PeriodsList.tsx
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
    DatePicker,
    Select,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    ReloadOutlined,
    CalendarOutlined,
    CheckCircleOutlined,
    SaveOutlined,
} from '@ant-design/icons';
import { adminApi, Period } from '../../api/admin';
import moment from 'moment-jalaali';
import JalaliDatePicker from "../common/JalaliDatePicker";
// ===== تنظیم locale جلالی =====
moment.loadPersian({ dialect: 'persian-modern', usePersianDigits: true });

const { Title, Text } = Typography;
const { Option } = Select;

// ===== تبدیل اعداد به فارسی =====
const toPersianNumber = (num: number | string): string => {
    if (num === undefined || num === null) return '۰';
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    return String(num).replace(/\d/g, (d: string) => persianDigits[parseInt(d)]);
};

// ===== تبدیل تاریخ میلادی به شمسی =====
const toPersianDate = (dateStr: string): string => {
    if (!dateStr) return '-';
    try {
        const m = moment(dateStr);
        if (m.isValid()) {
            return m.format('jYYYY/jMM/jDD');
        }
    } catch (e) {}
    return dateStr;
};

// ===== تبدیل تاریخ شمسی به میلادی =====
const toGregorianDate = (jalaliDate: string): string => {
    if (!jalaliDate) return '';
    try {
        const m = moment(jalaliDate, 'jYYYY/jMM/jDD');
        if (m.isValid()) {
            return m.format('YYYY-MM-DD');
        }
    } catch (e) {}
    return jalaliDate;
};

interface PeriodWithOrder extends Period {
    display_order: number;
}

// ===== ایجاد کامپوننت DatePicker با پشتیبانی از جلالی =====


const PeriodsList: React.FC = () => {
    const [periods, setPeriods] = useState<PeriodWithOrder[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [sortMode, setSortMode] = useState<'order' | 'start_date' | 'end_date' | 'created_at'>('order');

    // ===== مودال =====
    const [modalVisible, setModalVisible] = useState(false);
    const [editingPeriod, setEditingPeriod] = useState<PeriodWithOrder | null>(null);
    const [form] = Form.useForm();
    const [formLoading, setFormLoading] = useState(false);

    // ===== بارگذاری داده‌ها =====
    useEffect(() => {
        fetchPeriods();
    }, []);

    const fetchPeriods = async () => {
        try {
            setLoading(true);
            const res = await adminApi.getPeriods();
            if (res.data.success) {
                const data = res.data.data || [];
                const mapped = data.map((p: any, idx: number) => ({
                    ...p,
                    display_order: p.display_order !== undefined ? p.display_order : idx,
                }));
                setPeriods(mapped);
            }
        } catch (error) {
            console.error('Error fetching periods:', error);
            message.error('خطا در دریافت دوره‌ها');
        } finally {
            setLoading(false);
        }
    };

    // ===== عملیات =====
    const handleAddPeriod = () => {
        setEditingPeriod(null);
        form.resetFields();
        form.setFieldsValue({
            is_active: false,
        });
        setModalVisible(true);
    };

    const handleEditPeriod = (period: PeriodWithOrder) => {
        setEditingPeriod(period);
        const startDate = period.start_date ? moment(period.start_date) : undefined;
        const endDate = period.end_date ? moment(period.end_date) : undefined;
        const deadline = period.deadline ? moment(period.deadline) : undefined;
        
        form.setFieldsValue({
            title: period.title,
            start_date: startDate,
            end_date: endDate,
            deadline: deadline,
            is_active: period.is_active,
        });
        setModalVisible(true);
    };

    const handleDeletePeriod = async (id: number, title: string) => {
        try {
            setLoading(true);
            const res = await adminApi.deletePeriod(id);
            if (res.data.success) {
                message.success(`دوره ${title} با موفقیت حذف شد`);
                fetchPeriods();
            }
        } catch (error: any) {
            console.error('Error deleting period:', error);
            message.error(error.response?.data?.message || 'خطا در حذف دوره');
        } finally {
            setLoading(false);
        }
    };

    const handleSetActive = async (id: number, title: string) => {
        try {
            setLoading(true);
            const res = await adminApi.setActivePeriod(id);
            if (res.data.success) {
                message.success(`دوره ${title} به عنوان دوره فعال انتخاب شد`);
                fetchPeriods();
            }
        } catch (error: any) {
            console.error('Error setting active period:', error);
            message.error(error.response?.data?.message || 'خطا در تنظیم دوره فعال');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values: any) => {
        try {
            setFormLoading(true);
            
            // تبدیل تاریخ‌های جلالی به میلادی برای ذخیره در دیتابیس
            const startDate = values.start_date ? values.start_date.format('YYYY-MM-DD') : '';
            const endDate = values.end_date ? values.end_date.format('YYYY-MM-DD') : '';
            const deadline = values.deadline ? values.deadline.format('YYYY-MM-DD') : '';
            
            const data = {
                title: values.title,
                start_date: startDate,
                end_date: endDate,
                deadline: deadline,
                is_active: values.is_active || false,
            };

            let res;
            if (editingPeriod) {
                res = await adminApi.updatePeriod(editingPeriod.id, data);
                if (res.data.success) {
                    message.success('دوره با موفقیت ویرایش شد');
                }
            } else {
                res = await adminApi.createPeriod(data);
                if (res.data.success) {
                    message.success('دوره با موفقیت ایجاد شد');
                }
            }

            setModalVisible(false);
            fetchPeriods();

        } catch (error: any) {
            console.error('Error saving period:', error);
            const errorMsg = error.response?.data?.message ||
                error.response?.data?.error ||
                'خطا در ذخیره دوره';
            message.error(errorMsg);
        } finally {
            setFormLoading(false);
        }
    };

    // ===== مرتب‌سازی =====
    const getSortedPeriods = () => {
        const sorted = [...periods];
        switch (sortMode) {
            case 'order':
                sorted.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
                break;
            case 'start_date':
                sorted.sort((a, b) => (a.start_date || '').localeCompare(b.start_date || ''));
                break;
            case 'end_date':
                sorted.sort((a, b) => (a.end_date || '').localeCompare(b.end_date || ''));
                break;
            case 'created_at':
                sorted.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
                break;
        }
        return sorted;
    };

    const handleSortChange = (value: 'order' | 'start_date' | 'end_date' | 'created_at') => {
        setSortMode(value);
    };

    // ===== ذخیره ترتیب =====
    const handleSaveOrder = async () => {
        try {
            const orders = periods.map((p, idx) => ({
                id: p.id,
                display_order: idx,
            }));
            const res = await adminApi.reorderPeriods(orders);
            if (res.data.success) {
                message.success('ترتیب دوره‌ها با موفقیت ذخیره شد');
                fetchPeriods();
            }
        } catch (error: any) {
            console.error('Error saving order:', error);
            message.error(error.response?.data?.message || 'خطا در ذخیره ترتیب');
        }
    };

    // ===== فیلتر =====
    const filteredPeriods = getSortedPeriods().filter((period) =>
        period.title.toLowerCase().includes(searchText.toLowerCase())
    );

    // ===== رندر =====
    return (
        <div style={{ padding: 24, fontFamily: "'Vazirmatn', 'Segoe UI', sans-serif" }}>
            {/* ===== هدر ===== */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 8 }}>
                <div>
                    <Title level={3} style={{ margin: 0, fontFamily: "'Vazirmatn', 'Segoe UI', sans-serif" }}>
                        📅 دوره‌های کارکرد
                    </Title>
                    <Text type="secondary">{toPersianNumber(periods.length)} دوره</Text>
                </div>
                <Space wrap>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: 'white',
                        padding: '4px 16px',
                        borderRadius: 50,
                        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    }}>
                        <Text style={{ fontSize: '0.8rem', color: '#475569' }}>📊 مرتب‌سازی:</Text>
                        <Select
                            value={sortMode}
                            onChange={handleSortChange}
                            style={{ width: 150 }}
                            size="small"
                        >
                            <Option value="order">🖐️ ترتیب دستی</Option>
                            <Option value="start_date">📅 تاریخ شروع</Option>
                            <Option value="end_date">📅 تاریخ پایان</Option>
                            <Option value="created_at">🕒 تاریخ ایجاد</Option>
                        </Select>
                        {sortMode === 'order' && (
                            <Button
                                type="primary"
                                size="small"
                                icon={<SaveOutlined />}
                                onClick={handleSaveOrder}
                            >
                                ذخیره ترتیب
                            </Button>
                        )}
                    </div>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAddPeriod}
                    >
                        افزودن دوره جدید
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
                    placeholder="🔍 جستجو در عنوان دوره‌ها..."
                    allowClear
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ width: 300 }}
                    prefix={<CalendarOutlined />}
                    enterButton
                />
            </div>

            {/* ===== لیست دوره‌ها ===== */}
            <Spin spinning={loading}>
                {filteredPeriods.length === 0 ? (
                    <Card style={{ textAlign: 'center', padding: '60px 20px' }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
                        <Text type="secondary" style={{ fontSize: 16 }}>
                            {searchText ? 'هیچ دوره‌ای با این عنوان یافت نشد' : 'هیچ دوره‌ای تعریف نشده است'}
                        </Text>
                        {!searchText && (
                            <div style={{ marginTop: 16 }}>
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={handleAddPeriod}
                                >
                                    افزودن دوره جدید
                                </Button>
                            </div>
                        )}
                    </Card>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {filteredPeriods.map((period, idx) => {
                            const isActive = period.is_active || false;
                            const startDate = period.start_date || '-';
                            const endDate = period.end_date || '-';
                            const deadline = period.deadline || '';
                            const createdDate = toPersianDate(period.created_at || '');

                            return (
                                <Card
                                    key={period.id}
                                    style={{
                                        borderRadius: 20,
                                        borderRight: isActive ? '5px solid #10b981' : '1px solid rgba(0,0,0,0.05)',
                                        background: isActive ? 'linear-gradient(90deg, #f0fdf4 0%, white 100%)' : 'white',
                                        cursor: sortMode === 'order' ? 'grab' : 'default',
                                        transition: 'all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1)',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                    }}
                                    bodyStyle={{ padding: '16px 20px' }}
                                    hoverable
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                                        {sortMode === 'order' && (
                                            <div style={{ cursor: 'grab', color: '#94a3b8', fontSize: '1.4rem', userSelect: 'none' }}>
                                                ⋮⋮
                                            </div>
                                        )}
                                        <div style={{ flex: 1, minWidth: 200 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: '1.2rem' }}>📅</span>
                                                <Text strong style={{ fontSize: '1.05rem' }}>
                                                    {period.title}
                                                </Text>
                                                {isActive && (
                                                    <Tag color="green" icon={<CheckCircleOutlined />}>
                                                        ✓ فعال
                                                    </Tag>
                                                )}
                                                {sortMode === 'order' && (
                                                    <Tag color="purple">
                                                        #{toPersianNumber(idx + 1)}
                                                    </Tag>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 6, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                                <span className="date-chip">📅 شروع: {toPersianDate(startDate)}</span>
                                                <span className="date-chip">📅 پایان: {toPersianDate(endDate)}</span>
                                                {deadline && (
                                                    <span className="deadline-chip" style={{ background: '#fef3c7', padding: '2px 10px', borderRadius: 20, color: '#d97706' }}>
                                                        ⏰ ددلاین: {toPersianDate(deadline)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                            <div style={{ fontSize: '0.7rem', color: '#64748b', background: '#f8fafc', padding: '4px 12px', borderRadius: 30 }}>
                                                🕒 ایجاد: {createdDate}
                                            </div>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                {!isActive && (
                                                    <Button
                                                        type="primary"
                                                        size="small"
                                                        icon={<CheckCircleOutlined />}
                                                        onClick={() => handleSetActive(period.id, period.title)}
                                                        style={{ background: '#10b981', borderColor: '#10b981' }}
                                                    >
                                                        فعال
                                                    </Button>
                                                )}
                                                <Tooltip title="ویرایش">
                                                    <Button
                                                        type="text"
                                                        size="small"
                                                        icon={<EditOutlined />}
                                                        style={{ background: '#f1f5f9' }}
                                                        onClick={() => handleEditPeriod(period)}
                                                    />
                                                </Tooltip>
                                                <Tooltip title="حذف">
                                                    <Popconfirm
                                                        title="حذف دوره"
                                                        description={`آیا از حذف دوره "${period.title}" اطمینان دارید؟`}
                                                        onConfirm={() => handleDeletePeriod(period.id, period.title)}
                                                        okText="بله، حذف کن"
                                                        cancelText="انصراف"
                                                        okButtonProps={{ danger: true }}
                                                    >
                                                        <Button
                                                            type="text"
                                                            size="small"
                                                            icon={<DeleteOutlined />}
                                                            danger
                                                            style={{ background: '#f1f5f9' }}
                                                        />
                                                    </Popconfirm>
                                                </Tooltip>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </Spin>

            {/* ===== مودال افزودن/ویرایش دوره با تقویم شمسی ===== */}
            <Modal
                title={editingPeriod ? 'ویرایش دوره' : 'افزودن دوره جدید'}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
                width={600}
                destroyOnClose
            >
                <Spin spinning={formLoading}>
                    <Form form={form} layout="vertical" onFinish={handleSubmit}>
                        <Form.Item
                            name="title"
                            label="عنوان دوره"
                            rules={[{ required: true, message: 'لطفاً عنوان دوره را وارد کنید' }]}
                        >
                            <Input placeholder="مثال: اردیبهشت ۱۴۰۴" size="large" />
                        </Form.Item>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="start_date"
                                    label="تاریخ شروع (شمسی)"
                                    rules={[{ required: true, message: 'لطفاً تاریخ شروع را انتخاب کنید' }]}
                                >
                                    <JalaliDatePicker
										placeholder="۱۴۰۴/۰۲/۰۱"
									/>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="end_date"
                                    label="تاریخ پایان (شمسی)"
                                    rules={[{ required: true, message: 'لطفاً تاریخ پایان را انتخاب کنید' }]}
                                >
                                    <JalaliDatePicker
										placeholder="۱۴۰۴/۰۲/۳۱"
									/>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            name="deadline"
                            label="⏰ ددلاین (تاریخ سررسید)"
                            help="تاریخ سررسید برای تکمیل اطلاعات توسط سرپرستان واحد"
                        >
                            <JalaliDatePicker
								placeholder="۱۴۰۴/۰۲/۳۱"
							/>
                        </Form.Item>

                        <Form.Item name="is_active" label="وضعیت" valuePropName="checked">
                            <Switch checkedChildren="فعال" unCheckedChildren="غیرفعال" />
                        </Form.Item>

                        <Form.Item>
                            <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Button onClick={() => setModalVisible(false)}>
                                    انصراف
                                </Button>
                                <Button type="primary" htmlType="submit" loading={formLoading}>
                                    {editingPeriod ? 'ذخیره تغییرات' : 'ایجاد دوره'}
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Spin>
            </Modal>

            <style>{`
                .date-chip {
                    background: #f8fafc;
                    padding: 2px 10px;
                    border-radius: 20px;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                }
                .deadline-chip {
                    background: #fef3c7;
                    padding: 2px 10px;
                    border-radius: 20px;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    color: #d97706;
                }
            `}</style>
        </div>
    );
};

export default PeriodsList;