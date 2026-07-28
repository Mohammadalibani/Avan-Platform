// frontend/src/components/Admin/DepartmentsList.tsx
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
    ColorPicker,
    Select,
} from 'antd';
import {
    SearchOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    ReloadOutlined,
    ApartmentOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { adminApi, Department } from '../../api/admin';
import { User } from '../../types';

const { Title, Text } = Typography;
const { Option } = Select;

const DepartmentsList: React.FC = () => {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [allUsers, setAllUsers] = useState<User[]>([]);

    // ===== مودال‌ها =====
    const [modalVisible, setModalVisible] = useState(false);
    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [form] = Form.useForm();
    const [formLoading, setFormLoading] = useState(false);

    // ===== بارگذاری داده‌ها =====
    useEffect(() => {
        fetchDepartments();
        fetchUsers();
    }, []);

    const fetchDepartments = async () => {
        try {
            setLoading(true);
            const res = await adminApi.getDepartments();
            if (res.data.success) {
                setDepartments(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching departments:', error);
            message.error('خطا در دریافت ادارات');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await adminApi.getUsers({ per_page: 1000 });
            if (res.data.success) {
                setAllUsers(res.data.data.users);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    // ===== عملیات =====
    const handleAddDepartment = () => {
        setEditingDept(null);
        form.resetFields();
        form.setFieldsValue({ color: '#1890ff', is_active: true });
        setModalVisible(true);
    };

    const handleEditDepartment = (dept: Department) => {
        setEditingDept(dept);
        form.setFieldsValue({
            name: dept.name,
            color: dept.color,
            description: dept.description,
            is_active: dept.is_active,
            manager_ids: dept.managers?.map((m: any) => m.id) || [],
        });
        setModalVisible(true);
    };

    const handleDeleteDepartment = async (id: number, name: string) => {
        try {
            setLoading(true);
            const res = await adminApi.deleteDepartment(id);
            if (res.data.success) {
                message.success(`اداره ${name} با موفقیت حذف شد`);
                fetchDepartments();
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
            if (editingDept) {
                const res = await adminApi.updateDepartment(editingDept.id, values);
                if (res.data.success) {
                    message.success('اداره با موفقیت ویرایش شد');
                }
            } else {
                const res = await adminApi.createDepartment(values);
                if (res.data.success) {
                    message.success('اداره با موفقیت ایجاد شد');
                }
            }
            setModalVisible(false);
            fetchDepartments();
        } catch (error: any) {
            console.error('Error saving department:', error);
            message.error(error.response?.data?.message || 'خطا در ذخیره اداره');
        } finally {
            setFormLoading(false);
        }
    };

    // ===== فیلترها =====
    const handleSearch = (value: string) => {
        setSearchText(value);
    };

    const handleRefresh = () => {
        fetchDepartments();
        message.success('اطلاعات به‌روزرسانی شد');
    };

    // ===== ستون‌های جدول =====
    const columns = [
        {
            title: 'ردیف',
            dataIndex: 'id',
            key: 'id',
            render: (_: any, __: any, index: number) => index + 1,
            width: 60,
        },
        {
            title: 'نام اداره',
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: Department) => (
                <Space>
                    <div
                        style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: record.color || '#1890ff',
                        }}
                    />
                    <Text strong>{text}</Text>
                </Space>
            ),
        },
        {
            title: 'توضیحات',
            dataIndex: 'description',
            key: 'description',
            render: (text: string) => text || '-',
        },
        {
            title: 'مدیران',
            dataIndex: 'managers',
            key: 'managers',
            render: (managers: any[]) => {
                if (!managers || managers.length === 0) return <Tag color="default">بدون مدیر</Tag>;
                return (
                    <Space size={4}>
                        {managers.map((m) => (
                            <Tag key={m.id} color="blue">
                                <UserOutlined /> {m.full_name}
                            </Tag>
                        ))}
                    </Space>
                );
            },
        },
        {
            title: 'وضعیت',
            dataIndex: 'is_active',
            key: 'is_active',
            render: (isActive: boolean) => (
                <Tag color={isActive ? 'green' : 'red'}>
                    {isActive ? 'فعال' : 'غیرفعال'}
                </Tag>
            ),
        },
        {
            title: 'تاریخ ایجاد',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date: string) => new Date(date).toLocaleDateString('fa-IR'),
        },
        {
            title: 'عملیات',
            key: 'actions',
            render: (_: any, record: Department) => (
                <Space size="small">
                    <Tooltip title="ویرایش">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            size="small"
                            style={{ color: '#faad14' }}
                            onClick={() => handleEditDepartment(record)}
                        />
                    </Tooltip>
                    <Tooltip title="حذف">
                        <Popconfirm
                            title="حذف اداره"
                            description={`آیا از حذف اداره "${record.name}" اطمینان دارید؟`}
                            onConfirm={() => handleDeleteDepartment(record.id, record.name)}
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

    // ===== فیلتر داده‌ها =====
    const filteredData = departments.filter((dept) =>
        dept.name.includes(searchText) ||
        (dept.description || '').includes(searchText)
    );

    // ===== نمایش =====
    return (
        <div style={{ padding: 24 }}>
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                        <Title level={4} style={{ margin: 0 }}>🏢 مدیریت ادارات</Title>
                        <Text type="secondary">{departments.length} اداره</Text>
                    </div>
                    <Space>
                        <Tooltip title="بارگذاری مجدد">
                            <Button icon={<ReloadOutlined />} onClick={handleRefresh} />
                        </Tooltip>
                        <Input.Search
                            placeholder="جستجوی اداره..."
                            allowClear
                            onSearch={handleSearch}
                            style={{ width: 200 }}
                            prefix={<SearchOutlined />}
                            enterButton
                        />
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddDepartment}>
                            اداره جدید
                        </Button>
                    </Space>
                </div>

                <Table
                    dataSource={filteredData}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10, showTotal: (total) => `${total} اداره` }}
                    bordered={false}
                />
            </Card>

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
                            <Input placeholder="نام اداره" />
                        </Form.Item>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="color"
                                    label="رنگ"
                                    rules={[{ required: true, message: 'لطفاً رنگ را انتخاب کنید' }]}
                                >
                                    <Input placeholder="#1890ff" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="is_active" label="وضعیت" valuePropName="checked">
                                    <Select placeholder="انتخاب وضعیت">
                                        <Option value={true}>فعال</Option>
                                        <Option value={false}>غیرفعال</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item name="description" label="توضیحات">
                            <Input.TextArea rows={3} placeholder="توضیحات" />
                        </Form.Item>

                        <Form.Item
                            name="manager_ids"
                            label="مدیران اداره"
                        >
                            <Select
                                mode="multiple"
                                placeholder="انتخاب مدیران"
                                optionFilterProp="children"
                                showSearch
                            >
                                {allUsers.map((user) => (
                                    <Option key={user.id} value={user.id}>
                                        {user.full_name} ({user.username})
                                    </Option>
                                ))}
                            </Select>
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