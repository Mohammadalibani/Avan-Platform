// frontend/src/components/Admin/FieldsList.tsx
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
    Select,
} from 'antd';
import {
    SearchOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    ReloadOutlined,
    DragOutlined,
    EyeOutlined,
    EyeInvisibleOutlined,
    LockOutlined,
    UnlockOutlined,
} from '@ant-design/icons';
import { fieldsApi, DynamicField } from '../../api/fields';

const { Title, Text } = Typography;
const { Option } = Select;

const FieldsList: React.FC = () => {
    const [fields, setFields] = useState<DynamicField[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');

    // ===== مودال =====
    const [modalVisible, setModalVisible] = useState(false);
    const [editingField, setEditingField] = useState<DynamicField | null>(null);
    const [form] = Form.useForm();
    const [formLoading, setFormLoading] = useState(false);

    // ===== بارگذاری داده‌ها =====
    useEffect(() => {
        fetchFields();
    }, []);

    const fetchFields = async () => {
        try {
            setLoading(true);
            const res = await fieldsApi.getFields();
            if (res.data.success) {
                setFields(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching fields:', error);
            message.error('خطا در دریافت فیلدها');
        } finally {
            setLoading(false);
        }
    };

    // ===== عملیات =====
    const handleAddField = () => {
        setEditingField(null);
        form.resetFields();
        form.setFieldsValue({
            field_type: 'text',
            is_required: false,
            is_locked: false,
            is_monitoring: false,
            is_key: false,
            is_active: true,
        });
        setModalVisible(true);
    };

    const handleEditField = (field: DynamicField) => {
        setEditingField(field);
        form.setFieldsValue({
            title: field.title,
            field_type: field.field_type,
            is_required: field.is_required,
            is_locked: field.is_locked,
            is_monitoring: field.is_monitoring,
            is_key: field.is_key,
            is_active: field.is_active,
        });
        setModalVisible(true);
    };

    const handleDeleteField = async (id: number, title: string) => {
        try {
            setLoading(true);
            const res = await fieldsApi.deleteField(id);
            if (res.data.success) {
                message.success(`فیلد ${title} با موفقیت حذف شد`);
                fetchFields();
            }
        } catch (error: any) {
            console.error('Error deleting field:', error);
            message.error(error.response?.data?.message || 'خطا در حذف فیلد');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (id: number, currentStatus: boolean) => {
        try {
            const res = await fieldsApi.updateField(id, { is_active: !currentStatus });
            if (res.data.success) {
                message.success(`وضعیت فیلد با موفقیت تغییر کرد`);
                fetchFields();
            }
        } catch (error: any) {
            console.error('Error toggling field:', error);
            message.error(error.response?.data?.message || 'خطا در تغییر وضعیت');
        }
    };

    const handleSubmit = async (values: any) => {
        try {
            setFormLoading(true);
            if (editingField) {
                const res = await fieldsApi.updateField(editingField.id, values);
                if (res.data.success) {
                    message.success('فیلد با موفقیت ویرایش شد');
                }
            } else {
                const res = await fieldsApi.createField(values);
                if (res.data.success) {
                    message.success('فیلد با موفقیت ایجاد شد');
                }
            }
            setModalVisible(false);
            fetchFields();
        } catch (error: any) {
            console.error('Error saving field:', error);
            message.error(error.response?.data?.message || 'خطا در ذخیره فیلد');
        } finally {
            setFormLoading(false);
        }
    };

    // ===== فیلترها =====
    const handleSearch = (value: string) => {
        setSearchText(value);
    };

    const handleRefresh = () => {
        fetchFields();
        message.success('اطلاعات به‌روزرسانی شد');
    };

    // ===== ستون‌ها =====
    const columns = [
        {
            title: 'ترتیب',
            dataIndex: 'field_order',
            key: 'field_order',
            render: (_: any, __: any, index: number) => (
                <Tooltip title="جهت جابجایی بکشید">
                    <DragOutlined style={{ color: '#888', cursor: 'grab' }} />
                    <span style={{ marginLeft: 8 }}>{index + 1}</span>
                </Tooltip>
            ),
            width: 80,
        },
        {
            title: 'عنوان فیلد',
            dataIndex: 'title',
            key: 'title',
            render: (text: string) => <Text strong>{text}</Text>,
        },
        {
            title: 'نوع',
            dataIndex: 'field_type',
            key: 'field_type',
            render: (type: string) => {
                const map: Record<string, { color: string; label: string; icon: string }> = {
                    text: { color: 'blue', label: 'متن', icon: '📝' },
                    number: { color: 'green', label: 'عدد', icon: '🔢' },
                    date: { color: 'purple', label: 'تاریخ', icon: '📅' },
                    decimal: { color: 'orange', label: 'اعشار', icon: '💯' },
                };
                const info = map[type] || { color: 'default', label: type, icon: '📄' };
                return <Tag color={info.color}>{info.icon} {info.label}</Tag>;
            },
        },
        {
            title: 'ویژگی‌ها',
            dataIndex: 'id',
            key: 'features',
            render: (_: any, record: DynamicField) => (
                <Space size={4}>
                    {record.is_required && (
                        <Tooltip title="ضروری">
                            <Tag color="red">ضروری</Tag>
                        </Tooltip>
                    )}
                    {record.is_locked && (
                        <Tooltip title="قفل">
                            <Tag color="orange"><LockOutlined /></Tag>
                        </Tooltip>
                    )}
                    {record.is_monitoring && (
                        <Tooltip title="مانیتورینگ">
                            <Tag color="purple">📊</Tag>
                        </Tooltip>
                    )}
                    {record.is_key && (
                        <Tooltip title="کلید (کد ملی)">
                            <Tag color="gold">🔑</Tag>
                        </Tooltip>
                    )}
                </Space>
            ),
        },
        {
            title: 'وضعیت',
            dataIndex: 'is_active',
            key: 'is_active',
            render: (isActive: boolean, record: DynamicField) => (
                <Tooltip title={isActive ? 'غیرفعال کردن' : 'فعال کردن'}>
                    <Button
                        type="text"
                        icon={isActive ? <EyeOutlined style={{ color: '#52c41a' }} /> : <EyeInvisibleOutlined style={{ color: '#ff4d4f' }} />}
                        onClick={() => handleToggleActive(record.id, isActive)}
                    />
                </Tooltip>
            ),
        },
        {
            title: 'عملیات',
            key: 'actions',
            render: (_: any, record: DynamicField) => (
                <Space size="small">
                    <Tooltip title="ویرایش">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            size="small"
                            style={{ color: '#faad14' }}
                            onClick={() => handleEditField(record)}
                        />
                    </Tooltip>
                    <Tooltip title="حذف">
                        <Popconfirm
                            title="حذف فیلد"
                            description={`آیا از حذف فیلد "${record.title}" اطمینان دارید؟`}
                            onConfirm={() => handleDeleteField(record.id, record.title)}
                            okText="بله، حذف کن"
                            cancelText="انصراف"
                            okButtonProps={{ danger: true }}
                        >
                            <Button type="text" icon={<DeleteOutlined />} size="small" danger />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
            width: 120,
        },
    ];

    const filteredData = fields.filter((field) =>
        field.title.includes(searchText)
    );

    return (
        <div style={{ padding: 24 }}>
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                        <Title level={4} style={{ margin: 0 }}>⚙️ مدیریت فیلدهای پویا</Title>
                        <Text type="secondary">{fields.length} فیلد</Text>
                    </div>
                    <Space>
                        <Tooltip title="بارگذاری مجدد">
                            <Button icon={<ReloadOutlined />} onClick={handleRefresh} />
                        </Tooltip>
                        <Input.Search
                            placeholder="جستجوی فیلد..."
                            allowClear
                            onSearch={handleSearch}
                            style={{ width: 200 }}
                            prefix={<SearchOutlined />}
                            enterButton
                        />
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddField}>
                            فیلد جدید
                        </Button>
                    </Space>
                </div>

                <Table
                    dataSource={filteredData}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10, showTotal: (total) => `${total} فیلد` }}
                    bordered={false}
                />
            </Card>

            {/* ===== مودال ===== */}
            <Modal
                title={editingField ? 'ویرایش فیلد' : 'افزودن فیلد جدید'}
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
                            label="عنوان فارسی فیلد"
                            rules={[{ required: true, message: 'لطفاً عنوان فیلد را وارد کنید' }]}
                        >
                            <Input placeholder="عنوان فیلد" />
                        </Form.Item>

                        <Form.Item
                            name="field_type"
                            label="نوع فیلد"
                            rules={[{ required: true, message: 'لطفاً نوع فیلد را انتخاب کنید' }]}
                        >
                            <Select placeholder="انتخاب نوع">
                                <Option value="text">📝 متن</Option>
                                <Option value="number">🔢 عدد</Option>
                                <Option value="date">📅 تاریخ</Option>
                                <Option value="decimal">💯 اعشار</Option>
                            </Select>
                        </Form.Item>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="is_required" label="ضروری" valuePropName="checked">
                                    <Switch checkedChildren="بله" unCheckedChildren="خیر" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="is_locked" label="قفل" valuePropName="checked">
                                    <Switch checkedChildren="بله" unCheckedChildren="خیر" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="is_monitoring" label="مانیتورینگ" valuePropName="checked">
                                    <Switch checkedChildren="بله" unCheckedChildren="خیر" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="is_key" label="کلید (کد ملی)" valuePropName="checked">
                                    <Switch checkedChildren="بله" unCheckedChildren="خیر" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item name="is_active" label="فعال" valuePropName="checked">
                            <Switch checkedChildren="فعال" unCheckedChildren="غیرفعال" />
                        </Form.Item>

                        <Form.Item>
                            <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Button onClick={() => setModalVisible(false)}>
                                    انصراف
                                </Button>
                                <Button type="primary" htmlType="submit" loading={formLoading}>
                                    {editingField ? 'ذخیره تغییرات' : 'ایجاد فیلد'}
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Spin>
            </Modal>
        </div>
    );
};

export default FieldsList;