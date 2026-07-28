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
    Badge,
    Upload,
    UploadProps,
    Divider,
} from 'antd';
import {
    SearchOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    ReloadOutlined,
    TeamOutlined,
    UploadOutlined,
    DownloadOutlined,
    CopyOutlined,
} from '@ant-design/icons';
import { adminApi, Department, Unit } from '../../api/admin';
import { personnelApi } from '../../api/personnel';
import { reportsApi } from '../../api/reports';
import { Personnel, WorkPeriod } from '../../types';
import DynamicFields from '../Personnel/DynamicFields';

const { Title, Text } = Typography;
const { Option } = Select;

const PersonnelList: React.FC = () => {
    const [personnel, setPersonnel] = useState<Personnel[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState<number>();
    const [selectedUnit, setSelectedUnit] = useState<number>();
    const [selectedPeriod, setSelectedPeriod] = useState<number>();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [periods, setPeriods] = useState<WorkPeriod[]>([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 25, total: 0 });
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    // ===== State مودال =====
    const [modalVisible, setModalVisible] = useState(false);
    const [editingPersonnel, setEditingPersonnel] = useState<Personnel | null>(null);
    const [form] = Form.useForm();
    const [formLoading, setFormLoading] = useState(false);
    const [dynamicValues, setDynamicValues] = useState<Record<string, any>>({});

    // ===== State مودال تکثیر =====
    const [duplicateVisible, setDuplicateVisible] = useState(false);
    const [duplicateForm] = Form.useForm();
    const [duplicateLoading, setDuplicateLoading] = useState(false);

    // ===== بارگذاری داده‌ها =====
    useEffect(() => {
        fetchData();
        fetchDepartments();
        fetchUnits();
        fetchPeriods();
    }, []);

    const fetchData = async (page = 1) => {
        try {
            setLoading(true);
            const res = await adminApi.getPersonnel({
                page,
                per_page: pagination.pageSize,
                search: searchText || undefined,
                department_id: selectedDepartment,
                unit_id: selectedUnit,
                period_id: selectedPeriod,
            });
            if (res.data.success) {
                setPersonnel(res.data.data.personnel);
                setPagination({
                    ...pagination,
                    current: page,
                    total: res.data.total || 0,
                });
            }
        } catch (error) {
            console.error('Error fetching personnel:', error);
            message.error('خطا در دریافت پرسنل');
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const res = await adminApi.getDepartments();
            if (res.data.success) setDepartments(res.data.data);
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    };

    const fetchUnits = async () => {
        try {
            const res = await adminApi.getUnits();
            if (res.data.success) setUnits(res.data.data);
        } catch (error) {
            console.error('Error fetching units:', error);
        }
    };

    const fetchPeriods = async () => {
        try {
            const res = await adminApi.getPeriods();
            if (res.data.success) setPeriods(res.data.data);
        } catch (error) {
            console.error('Error fetching periods:', error);
        }
    };

    // ===== دریافت مقادیر فیلدهای پویا =====
    const fetchPersonnelValues = async (personnelId: number, periodId: number) => {
        try {
            const res = await personnelApi.getValues(personnelId, periodId);
            if (res.data.success) {
                setDynamicValues(res.data.data);
                form.setFieldsValue(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching personnel values:', error);
        }
    };

    // ===== خروجی اکسل =====
    const handleExportExcel = async () => {
        try {
            setLoading(true);
            const res = await reportsApi.exportPersonnel({
                period_id: selectedPeriod,
                department_id: selectedDepartment,
                unit_id: selectedUnit,
            });
            
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `personnel_report_${new Date().toISOString().slice(0,10)}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            message.success('گزارش با موفقیت دانلود شد');
        } catch (error) {
            console.error('Error exporting excel:', error);
            message.error('خطا در خروجی اکسل');
        } finally {
            setLoading(false);
        }
    };

    // ===== عملیات =====
    const handleAddPersonnel = () => {
        setEditingPersonnel(null);
        setDynamicValues({});
        form.resetFields();
        form.setFieldsValue({ is_active: true });
        setModalVisible(true);
    };

    const handleEditPersonnel = async (record: Personnel) => {
        setEditingPersonnel(record);
        setDynamicValues({});
        
        form.setFieldsValue({
            national_code: record.national_code,
            first_name: record.first_name,
            last_name: record.last_name,
            phone: record.phone,
            position: record.position,
            department_id: record.department_id,
            unit_id: record.unit_id,
            period_id: record.period_id,
        });
        
        if (record.period_id) {
            await fetchPersonnelValues(record.id, record.period_id);
        }
        
        setModalVisible(true);
    };

    const handleDeletePersonnel = async (id: number, name: string) => {
        try {
            setLoading(true);
            const res = await adminApi.deletePersonnel(id);
            if (res.data.success) {
                message.success(`پرسنل ${name} با موفقیت حذف شد`);
                fetchData(pagination.current);
            }
        } catch (error: any) {
            console.error('Error deleting personnel:', error);
            message.error(error.response?.data?.message || 'خطا در حذف پرسنل');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values: any) => {
        try {
            setFormLoading(true);
            
            // جداسازی فیلدهای اصلی از فیلدهای پویا
            const mainFields = ['national_code', 'first_name', 'last_name', 'phone', 'position', 'department_id', 'unit_id', 'period_id'];
            const mainData: any = {};
            const dynamicData: Record<string, any> = {};
            
            Object.keys(values).forEach((key) => {
                if (mainFields.includes(key)) {
                    mainData[key] = values[key];
                } else {
                    dynamicData[key] = values[key];
                }
            });
            
            let personnelId = editingPersonnel?.id;
            
            if (editingPersonnel) {
                const res = await adminApi.updatePersonnel(editingPersonnel.id, mainData);
                if (res.data.success) {
                    personnelId = editingPersonnel.id;
                }
            } else {
                const res = await adminApi.createPersonnel(mainData);
                if (res.data.success) {
                    personnelId = res.data.data.id;
                }
            }
            
            // ذخیره فیلدهای پویا
            if (personnelId && mainData.period_id) {
                await personnelApi.saveValues(personnelId, mainData.period_id, dynamicData);
            }
            
            message.success('پرسنل با موفقیت ذخیره شد');
            setModalVisible(false);
            fetchData(pagination.current);
        } catch (error: any) {
            console.error('Error saving personnel:', error);
            message.error(error.response?.data?.message || 'خطا در ذخیره پرسنل');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDuplicate = async (values: any) => {
        try {
            setDuplicateLoading(true);
            const res = await adminApi.duplicatePersonnel(
                values.source_period_id,
                values.target_period_id,
                values.behavior
            );
            if (res.data.success) {
                message.success(`تکثیر با موفقیت انجام شد`);
                setDuplicateVisible(false);
                duplicateForm.resetFields();
                fetchData(pagination.current);
            }
        } catch (error: any) {
            console.error('Error duplicating personnel:', error);
            message.error(error.response?.data?.message || 'خطا در تکثیر پرسنل');
        } finally {
            setDuplicateLoading(false);
        }
    };

    // ===== فیلترها =====
    const handleSearch = (value: string) => {
        setSearchText(value);
        fetchData(1);
    };

    const handleDepartmentChange = (value: number) => {
        setSelectedDepartment(value);
        setSelectedUnit(undefined);
        fetchData(1);
    };

    const handleUnitChange = (value: number) => {
        setSelectedUnit(value);
        fetchData(1);
    };

    const handlePeriodChange = (value: number) => {
        setSelectedPeriod(value);
        fetchData(1);
    };

    const handleRefresh = () => {
        fetchData(pagination.current);
        message.success('اطلاعات به‌روزرسانی شد');
    };

    // ===== انتخاب ردیف‌ها =====
    const rowSelection = {
        selectedRowKeys,
        onChange: (selectedKeys: React.Key[]) => {
            setSelectedRowKeys(selectedKeys);
        },
    };

    // ===== وضعیت کارکرد =====
    const getWorkStatusBadge = (status: string) => {
        const map: Record<string, { color: string; text: string }> = {
            draft: { color: 'default', text: 'پیش‌نویس' },
            unit_pending: { color: 'processing', text: 'در انتظار تایید سرپرست' },
            dept_pending: { color: 'processing', text: 'در انتظار تایید مدیر اداره' },
            org_pending: { color: 'processing', text: 'در انتظار تایید مدیر سازمان' },
            org_approved: { color: 'success', text: 'تایید نهایی شده' },
            revision: { color: 'warning', text: 'نیاز به اصلاح دارد' },
        };
        return map[status] || { color: 'default', text: status };
    };

    // ===== Upload Excel =====
    const uploadProps: UploadProps = {
        name: 'file',
        action: '/api/admin/personnel/upload',
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        accept: '.xlsx,.xls',
        showUploadList: false,
        onChange(info) {
            if (info.file.status === 'done') {
                message.success(`${info.file.name} با موفقیت آپلود شد`);
                fetchData(pagination.current);
            } else if (info.file.status === 'error') {
                message.error(`خطا در آپلود ${info.file.name}`);
            }
        },
    };

    // ===== ستون‌های جدول =====
    const columns = [
        {
            title: 'ردیف',
            dataIndex: 'id',
            key: 'id',
            render: (_: any, __: any, index: number) => (pagination.current - 1) * pagination.pageSize + index + 1,
            width: 60,
        },
        {
            title: 'کد ملی',
            dataIndex: 'national_code',
            key: 'national_code',
            render: (text: string) => <span dir="ltr">{text}</span>,
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
            render: (text: string) => <Tag color="blue">{text}</Tag>,
        },
        {
            title: 'واحد',
            dataIndex: 'unit_name',
            key: 'unit_name',
            render: (text: string) => <Tag color="cyan">{text}</Tag>,
        },
        {
            title: 'دوره',
            dataIndex: 'period_title',
            key: 'period_title',
            render: (text: string) => <Tag color="purple">{text}</Tag>,
        },
        {
            title: 'وضعیت کارکرد',
            dataIndex: 'work_status',
            key: 'work_status',
            render: (status: string) => {
                const info = getWorkStatusBadge(status);
                return <Badge status={info.color as any} text={info.text} />;
            },
        },
        {
            title: 'عملیات',
            key: 'actions',
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
            width: 120,
        },
    ];

    return (
        <div style={{ padding: 24 }}>
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                        <Title level={4} style={{ margin: 0 }}>👥 مدیریت پرسنل</Title>
                        <Text type="secondary">{pagination.total} پرسنل</Text>
                    </div>
                    <Space wrap>
                        <Tooltip title="بارگذاری مجدد">
                            <Button icon={<ReloadOutlined />} onClick={handleRefresh} />
                        </Tooltip>
                        <Select
                            style={{ width: 150 }}
                            allowClear
                            placeholder="دوره"
                            value={selectedPeriod}
                            onChange={handlePeriodChange}
                        >
                            {periods.map((p) => (
                                <Option key={p.id} value={p.id}>
                                    {p.title}
                                </Option>
                            ))}
                        </Select>
                        <Select
                            style={{ width: 150 }}
                            allowClear
                            placeholder="اداره"
                            value={selectedDepartment}
                            onChange={handleDepartmentChange}
                        >
                            {departments.map((d) => (
                                <Option key={d.id} value={d.id}>
                                    {d.name}
                                </Option>
                            ))}
                        </Select>
                        <Select
                            style={{ width: 150 }}
                            allowClear
                            placeholder="واحد"
                            value={selectedUnit}
                            onChange={handleUnitChange}
                            disabled={!selectedDepartment}
                        >
                            {units
                                .filter((u) => !selectedDepartment || u.department_id === selectedDepartment)
                                .map((u) => (
                                    <Option key={u.id} value={u.id}>
                                        {u.name}
                                    </Option>
                                ))}
                        </Select>
                        <Input.Search
                            placeholder="جستجو..."
                            allowClear
                            onSearch={handleSearch}
                            style={{ width: 200 }}
                            prefix={<SearchOutlined />}
                            enterButton
                        />
                        <Upload {...uploadProps}>
                            <Button icon={<UploadOutlined />}>آپلود اکسل</Button>
                        </Upload>
                        <Button 
                            icon={<DownloadOutlined />} 
                            onClick={handleExportExcel}
                            loading={loading}
                        >
                            خروجی اکسل
                        </Button>
                        <Button icon={<CopyOutlined />} onClick={() => setDuplicateVisible(true)}>
                            تکثیر
                        </Button>
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddPersonnel}>
                            پرسنل جدید
                        </Button>
                    </Space>
                </div>

                <Table
                    dataSource={personnel}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    rowSelection={rowSelection}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        showSizeChanger: true,
                        showTotal: (total) => `${total} پرسنل`,
                        position: ['bottomRight'],
                    }}
                    onChange={(newPagination) => fetchData(newPagination.current)}
                    bordered={false}
                    scroll={{ x: 'max-content' }}
                />
            </Card>

            {/* ===== مودال افزودن/ویرایش پرسنل ===== */}
            <Modal
                title={editingPersonnel ? 'ویرایش پرسنل' : 'افزودن پرسنل جدید'}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
                width={800}
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
                                    name="period_id"
                                    label="دوره کارکرد"
                                    rules={[{ required: true, message: 'لطفاً دوره را انتخاب کنید' }]}
                                >
                                    <Select placeholder="انتخاب دوره">
                                        {periods.map((p) => (
                                            <Option key={p.id} value={p.id}>
                                                {p.title}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="first_name"
                                    label="نام"
                                    rules={[{ required: true, message: 'لطفاً نام را وارد کنید' }]}
                                >
                                    <Input placeholder="نام" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="last_name"
                                    label="نام خانوادگی"
                                    rules={[{ required: true, message: 'لطفاً نام خانوادگی را وارد کنید' }]}
                                >
                                    <Input placeholder="نام خانوادگی" />
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
                                <Form.Item name="position" label="سمت">
                                    <Input placeholder="سمت" />
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
                                        onChange={() => form.setFieldsValue({ unit_id: undefined })}
                                    >
                                        {departments.map((d) => (
                                            <Option key={d.id} value={d.id}>
                                                {d.name}
                                            </Option>
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
                                    <Select placeholder="انتخاب واحد">
                                        {units
                                            .filter((u) => u.department_id === form.getFieldValue('department_id'))
                                            .map((u) => (
                                                <Option key={u.id} value={u.id}>
                                                    {u.name}
                                                </Option>
                                            ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        {/* ===== فیلدهای پویا ===== */}
                        <Divider orientation="right">اطلاعات تکمیلی</Divider>
                        <DynamicFields
                            personnelId={editingPersonnel?.id}
                            periodId={form.getFieldValue('period_id')}
                            values={dynamicValues}
                            onValuesChange={(values) => {
                                setDynamicValues(values);
                                Object.keys(values).forEach((key) => {
                                    form.setFieldValue(key, values[key]);
                                });
                            }}
                        />

                        <Form.Item>
                            <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Button onClick={() => setModalVisible(false)}>
                                    انصراف
                                </Button>
                                <Button type="primary" htmlType="submit" loading={formLoading}>
                                    {editingPersonnel ? 'ذخیره تغییرات' : 'ایجاد پرسنل'}
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Spin>
            </Modal>

            {/* ===== مودال تکثیر دسته‌جمعی ===== */}
            <Modal
                title="تکثیر دسته‌جمعی پرسنل"
                open={duplicateVisible}
                onCancel={() => {
                    setDuplicateVisible(false);
                    duplicateForm.resetFields();
                }}
                footer={null}
                width={500}
                destroyOnClose
            >
                <Spin spinning={duplicateLoading}>
                    <Form form={duplicateForm} layout="vertical" onFinish={handleDuplicate}>
                        <Form.Item
                            name="source_period_id"
                            label="دوره مبدأ (منبع کپی)"
                            rules={[{ required: true, message: 'لطفاً دوره مبدأ را انتخاب کنید' }]}
                        >
                            <Select placeholder="انتخاب دوره مبدأ">
                                {periods.map((p) => (
                                    <Option key={p.id} value={p.id}>
                                        {p.title}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="target_period_id"
                            label="دوره مقصد (هدف کپی)"
                            rules={[{ required: true, message: 'لطفاً دوره مقصد را انتخاب کنید' }]}
                        >
                            <Select placeholder="انتخاب دوره مقصد">
                                {periods.map((p) => (
                                    <Option key={p.id} value={p.id}>
                                        {p.title}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="behavior"
                            label="رفتار در صورت تکراری بودن"
                            rules={[{ required: true, message: 'لطفاً رفتار را انتخاب کنید' }]}
                            initialValue="skip"
                        >
                            <Select>
                                <Option value="skip">نادیده گرفتن (رد کردن)</Option>
                                <Option value="replace">جایگزینی</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item>
                            <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Button onClick={() => {
                                    setDuplicateVisible(false);
                                    duplicateForm.resetFields();
                                }}>
                                    انصراف
                                </Button>
                                <Button type="primary" htmlType="submit" loading={duplicateLoading}>
                                    🚀 شروع تکثیر
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Spin>
            </Modal>
        </div>
    );
};

export default PersonnelList;