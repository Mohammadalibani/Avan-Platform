// frontend/src/components/Admin/UnitsList.tsx
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
    Select,
    Switch,
} from 'antd';
import {
    SearchOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    ReloadOutlined,
    AppstoreOutlined,
    UserOutlined,
    ApartmentOutlined,
} from '@ant-design/icons';
import { adminApi, Department, Unit } from '../../api/admin';
import { User } from '../../types';

const { Title, Text } = Typography;
const { Option } = Select;

const UnitsList: React.FC = () => {
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [departments, setDepartments] = useState<Department[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [selectedDepartment, setSelectedDepartment] = useState<number>();

    // ===== مودال‌ها =====
    const [modalVisible, setModalVisible] = useState(false);
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
    const [form] = Form.useForm();
    const [formLoading, setFormLoading] = useState(false);

    // ===== بارگذاری داده‌ها =====
    useEffect(() => {
        fetchUnits();
        fetchDepartments();
        fetchUsers();
    }, []);

    const fetchUnits = async () => {
        try {
            setLoading(true);
            const res = await adminApi.getUnits();
            if (res.data.success) {
                setUnits(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching units:', error);
            message.error('خطا در دریافت واحدها');
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const res = await adminApi.getDepartments();
            if (res.data.success) {
                setDepartments(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching departments:', error);
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
    const handleAddUnit = () => {
        setEditingUnit(null);
        form.resetFields();
        form.setFieldsValue({ needs_approval: true, is_active: true });
        setModalVisible(true);
    };

    const handleEditUnit = (unit: Unit) => {
        setEditingUnit(unit);
        form.setFieldsValue({
            name: unit.name,
            department_id: unit.department_id,
            description: unit.description,
            needs_approval: unit.needs_approval,
            is_active: unit.is_active,
            supervisor_ids: unit.supervisors?.map((s: any) => s.id) || [],
        });
        setModalVisible(true);
    };

    const handleDeleteUnit = async (id: number, name: string) => {
        try {
            setLoading(true);
            const res = await adminApi.deleteUnit(id);
            if (res.data.success) {
                message.success(`واحد ${name} با موفقیت حذف شد`);
                fetchUnits();
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
            if (editingUnit) {
                const res = await adminApi.updateUnit(editingUnit.id, values);
                if (res.data.success) {
                    message.success('واحد با موفقیت ویرایش شد');
                }
            } else {
                const res = await adminApi.createUnit(values);
                if (res.data.success) {
                    message.success('واحد با موفقیت ایجاد شد');
                }
            }
            setModalVisible(false);
            fetchUnits();
        } catch (error: any) {
            console.error('Error saving unit:', error);
            message.error(error.response?.data?.message || 'خطا در ذخیره واحد');
        } finally {
            setFormLoading(false);
        }
    };

    // ===== فیلترها =====
    const handleSearch = (value: string) => {
        setSearchText(value);
    };

    const handleDepartmentFilter = (value: number) => {
        setSelectedDepartment(value);
    };

    const handleRefresh = () => {
        fetchUnits();
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
            title: 'نام واحد',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => <Text strong>{text}</Text>,
        },
        {
            title: 'اداره',
            dataIndex: 'department_name',
            key: 'department_name',
            render: (text: string) => (
                <Tag icon={<ApartmentOutlined />} color="blue">
                    {text}
                </Tag>
            ),
        },
        {
            title: 'توضیحات',
            dataIndex: 'description',
            key: 'description',
            render: (text: string) => text || '-',
        },
        {
            title: 'سرپرستان',
            dataIndex: 'supervisors',
            key: 'supervisors',
            render: (supervisors: any[]) => {
                if (!supervisors || supervisors.length === 0) return <Tag color="default">بدون سرپرست</Tag>;
                return (
                    <Space size={4} wrap>
                        {supervisors.map((s) => (
                            <Tag key={s.id} color="cyan">
                                <UserOutlined /> {s.full_name}
                            </Tag>
                        ))}
                    </Space>
                );
            },
        },
        {
            title: 'نیاز به تایید',
            dataIndex: 'needs_approval',
            key: 'needs_approval',
            render: (needs: boolean) => (
                <Tag color={needs ? 'orange' : 'green'}>
                    {needs ? '🔒 نیاز به تایید' : '📝 ثبت مستقیم'}
                </Tag>
            ),
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
            title: 'عملیات',
            key: 'actions',
            render: (_: any, record: Unit) => (
                <Space size="small">
                    <Tooltip title="ویرایش">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            size="small"
                            style={{ color: '#faad14' }}
                            onClick={() => handleEditUnit(record)}
                        />
                    </Tooltip>
                    <Tooltip title="حذف">
                        <Popconfirm
                            title="حذف واحد"
                            description={`آیا از حذف واحد "${record.name}" اطمینان دارید؟`}
                            onConfirm={() => handleDeleteUnit(record.id, record.name)}
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
    const filteredData = units.filter((unit) => {
        const matchSearch = unit.name.includes(searchText) || (unit.description || '').includes(searchText);
        const matchDept = selectedDepartment ? unit.department_id === selectedDepartment : true;
        return matchSearch && matchDept;
    });

    // ===== نمایش =====
    return (
        <div style={{ padding: 24 }}>
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                        <Title level={4} style={{ margin: 0 }}>📁 مدیریت واحدها</Title>
                        <Text type="secondary">{units.length} واحد</Text>
                    </div>
                    <Space>
                        <Tooltip title="بارگذاری مجدد">
                            <Button icon={<ReloadOutlined />} onClick={handleRefresh} />
                        </Tooltip>
                        <Select
                            style={{ width: 180 }}
                            allowClear
                            placeholder="فیلتر بر اساس اداره"
                            value={selectedDepartment}
                            onChange={handleDepartmentFilter}
                        >
                            {departments.map((dept) => (
                                <Option key={dept.id} value={dept.id}>
                                    {dept.name}
                                </Option>
                            ))}
                        </Select>
                        <Input.Search
                            placeholder="جستجوی واحد..."
                            allowClear
                            onSearch={handleSearch}
                            style={{ width: 200 }}
                            prefix={<SearchOutlined />}
                            enterButton
                        />
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddUnit}>
                            واحد جدید
                        </Button>
                    </Space>
                </div>

                <Table
                    dataSource={filteredData}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10, showTotal: (total) => `${total} واحد` }}
                    bordered={false}
                />
            </Card>

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
                            <Select placeholder="انتخاب اداره">
                                {departments.map((dept) => (
                                    <Option key={dept.id} value={dept.id}>
                                        {dept.name}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="name"
                            label="نام واحد"
                            rules={[{ required: true, message: 'لطفاً نام واحد را وارد کنید' }]}
                        >
                            <Input placeholder="نام واحد" />
                        </Form.Item>

                        <Form.Item name="description" label="توضیحات">
                            <Input.TextArea rows={3} placeholder="توضیحات" />
                        </Form.Item>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="needs_approval" label="نیاز به تایید" valuePropName="checked">
                                    <Switch checkedChildren="نیاز به تایید" unCheckedChildren="ثبت مستقیم" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="is_active" label="وضعیت" valuePropName="checked">
                                    <Switch checkedChildren="فعال" unCheckedChildren="غیرفعال" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            name="supervisor_ids"
                            label="سرپرستان واحد"
                        >
                            <Select
                                mode="multiple"
                                placeholder="انتخاب سرپرستان"
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