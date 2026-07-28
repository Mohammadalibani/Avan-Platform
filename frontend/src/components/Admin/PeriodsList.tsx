// frontend/src/components/Admin/PeriodsList.tsx
import React, { useState, useEffect } from 'react';
import {
    Card,
    Table,
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
    Badge,
    DatePicker,
} from 'antd';
import {
    SearchOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    ReloadOutlined,
    StarOutlined,
    StarFilled,
    DragOutlined,
} from '@ant-design/icons';
import { adminApi } from '../../api/admin';
import { WorkPeriod } from '../../types';
import dayjs from 'dayjs';
// حذف: import jalali from 'dayjs-jalali';

const { Title, Text } = Typography;

const PeriodsList: React.FC = () => {
    const [periods, setPeriods] = useState<WorkPeriod[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');

    const [modalVisible, setModalVisible] = useState(false);
    const [editingPeriod, setEditingPeriod] = useState<WorkPeriod | null>(null);
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
                setPeriods(res.data.data);
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
        form.setFieldsValue({ is_active: false });
        setModalVisible(true);
    };

    const handleEditPeriod = (period: WorkPeriod) => {
        setEditingPeriod(period);
        form.setFieldsValue({
            title: period.title,
            start_date: dayjs(period.start_date),
            end_date: dayjs(period.end_date),
            deadline: period.deadline ? dayjs(period.deadline) : null,
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
            const data = {
                ...values,
                start_date: values.start_date?.format('YYYY-MM-DD'),
                end_date: values.end_date?.format('YYYY-MM-DD'),
                deadline: values.deadline?.format('YYYY-MM-DD'),
            };

            if (editingPeriod) {
                const res = await adminApi.updatePeriod(editingPeriod.id, data);
                if (res.data.success) {
                    message.success('دوره با موفقیت ویرایش شد');
                }
            } else {
                const res = await adminApi.createPeriod(data);
                if (res.data.success) {
                    message.success('دوره با موفقیت ایجاد شد');
                }
            }
            setModalVisible(false);
            fetchPeriods();
        } catch (error: any) {
            console.error('Error saving period:', error);
            message.error(error.response?.data?.message || 'خطا در ذخیره دوره');
        } finally {
            setFormLoading(false);
        }
    };

    // ===== فیلترها =====
    const handleSearch = (value: string) => {
        setSearchText(value);
    };

    const handleRefresh = () => {
        fetchPeriods();
        message.success('اطلاعات به‌روزرسانی شد');
    };

    // ===== ستون‌های جدول =====
    const columns = [
        {
            title: 'ترتیب',
            dataIndex: 'display_order',
            key: 'display_order',
            render: (_: any, __: any, index: number) => (
                <Tooltip title="جهت جابجایی بکشید">
                    <DragOutlined style={{ color: '#888', cursor: 'grab' }} />
                    <span style={{ marginLeft: 8 }}>{index + 1}</span>
                </Tooltip>
            ),
            width: 80,
        },
        {
            title: 'عنوان دوره',
            dataIndex: 'title',
            key: 'title',
            render: (text: string, record: WorkPeriod) => (
                <Space>
                    <Text strong>{text}</Text>
                    {record.is_active && (
                        <Tag color="gold" icon={<StarFilled />}>فعال</Tag>
                    )}
                </Space>
            ),
        },
        {
            title: 'تاریخ شروع',
            dataIndex: 'start_date',
            key: 'start_date',
            render: (date: string) => <span dir="ltr">{date}</span>,
        },
        {
            title: 'تاریخ پایان',
            dataIndex: 'end_date',
            key: 'end_date',
            render: (date: string) => <span dir="ltr">{date}</span>,
        },
        {
            title: 'ددلاین',
            dataIndex: 'deadline',
            key: 'deadline',
            render: (date: string) => date ? <span dir="ltr">{date}</span> : <Tag color="default">بدون ددلاین</Tag>,
        },
        {
            title: 'وضعیت',
            dataIndex: 'is_active',
            key: 'is_active',
            render: (isActive: boolean) => (
                <Badge status={isActive ? 'success' : 'default'} text={isActive ? 'فعال' : 'غیرفعال'} />
            ),
        },
        {
            title: 'عملیات',
            key: 'actions',
            render: (_: any, record: WorkPeriod) => (
                <Space size="small">
                    {!record.is_active && (
                        <Tooltip title="تنظیم به عنوان دوره فعال">
                            <Button
                                type="text"
                                icon={<StarOutlined />}
                                size="small"
                                style={{ color: '#faad14' }}
                                onClick={() => handleSetActive(record.id, record.title)}
                            />
                        </Tooltip>
                    )}
                    <Tooltip title="ویرایش">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            size="small"
                            style={{ color: '#faad14' }}
                            onClick={() => handleEditPeriod(record)}
                        />
                    </Tooltip>
                    <Tooltip title="حذف">
                        <Popconfirm
                            title="حذف دوره"
                            description={`آیا از حذف دوره "${record.title}" اطمینان دارید؟`}
                            onConfirm={() => handleDeletePeriod(record.id, record.title)}
                            okText="بله، حذف کن"
                            cancelText="انصراف"
                            okButtonProps={{ danger: true }}
                        >
                            <Button type="text" icon={<DeleteOutlined />} size="small" danger />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
            width: 180,
        },
    ];

    // ===== فیلتر داده‌ها =====
    const filteredData = periods.filter((period) =>
        period.title.includes(searchText)
    );

    // ===== نمایش =====
    return (
        <div style={{ padding: 24 }}>
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                        <Title level={4} style={{ margin: 0 }}>📅 مدیریت دوره‌های کارکرد</Title>
                        <Text type="secondary">{periods.length} دوره</Text>
                    </div>
                    <Space>
                        <Tooltip title="بارگذاری مجدد">
                            <Button icon={<ReloadOutlined />} onClick={handleRefresh} />
                        </Tooltip>
                        <Input.Search
                            placeholder="جستجوی دوره..."
                            allowClear
                            onSearch={handleSearch}
                            style={{ width: 200 }}
                            prefix={<SearchOutlined />}
                            enterButton
                        />
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddPeriod}>
                            دوره جدید
                        </Button>
                    </Space>
                </div>

                <Table
                    dataSource={filteredData}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10, showTotal: (total) => `${total} دوره` }}
                    bordered={false}
                />
            </Card>

            {/* ===== مودال افزودن/ویرایش دوره ===== */}
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
                            <Input placeholder="عنوان دوره" />
                        </Form.Item>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="start_date"
                                    label="تاریخ شروع"
                                    rules={[{ required: true, message: 'لطفاً تاریخ شروع را انتخاب کنید' }]}
                                >
                                    <DatePicker
                                        style={{ width: '100%' }}
                                        placeholder="تاریخ شروع"
                                        format="YYYY/MM/DD"
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="end_date"
                                    label="تاریخ پایان"
                                    rules={[{ required: true, message: 'لطفاً تاریخ پایان را انتخاب کنید' }]}
                                >
                                    <DatePicker
                                        style={{ width: '100%' }}
                                        placeholder="تاریخ پایان"
                                        format="YYYY/MM/DD"
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            name="deadline"
                            label="ددلاین (تاریخ سررسید)"
                            help="اختیاری - در صورت عدم ورود، ددلاینی ثبت نمی‌شود"
                        >
                            <DatePicker
                                style={{ width: '100%' }}
                                placeholder="تاریخ سررسید"
                                format="YYYY/MM/DD"
                            />
                        </Form.Item>

                        <Form.Item name="is_active" label="فعال" valuePropName="checked">
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
        </div>
    );
};

export default PeriodsList;