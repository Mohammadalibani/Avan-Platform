// frontend/src/components/Admin/ApprovalsList.tsx
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
    Badge,
    Tabs,
    Row,
    Col,
    Descriptions,
    Alert,
} from 'antd';
import {
    SearchOutlined,
    ReloadOutlined,
    CheckOutlined,
    CloseOutlined,
    EditOutlined,
    EyeOutlined,
    UserOutlined,
    ApartmentOutlined,
    ClockCircleOutlined,
    FileTextOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import { adminApi, ApprovalRequest } from '../../api/admin';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;

const ApprovalsList: React.FC = () => {
    const [requests, setRequests] = useState<ApprovalRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [activeTab, setActiveTab] = useState('pending');
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

    // ===== مودال‌ها =====
    const [detailVisible, setDetailVisible] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
    const [actionVisible, setActionVisible] = useState(false);
    const [actionType, setActionType] = useState<'approve' | 'reject' | 'revision'>('approve');
    const [actionNote, setActionNote] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [form] = Form.useForm();

    // ===== بارگذاری داده‌ها =====
    useEffect(() => {
        fetchRequests();
    }, [activeTab, pagination.current]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const status = activeTab === 'all' ? undefined : activeTab;
            const res = await adminApi.getApprovalRequests({
                status,
                page: pagination.current,
                per_page: pagination.pageSize,
            });
            if (res.data.success) {
                setRequests(res.data.data.requests);
                setPagination({
                    ...pagination,
                    total: res.data.total || 0,
                });
            }
        } catch (error) {
            console.error('Error fetching approval requests:', error);
            message.error('خطا در دریافت درخواست‌ها');
        } finally {
            setLoading(false);
        }
    };

    // ===== نمایش جزئیات =====
    const showDetail = (record: ApprovalRequest) => {
        setSelectedRequest(record);
        setDetailVisible(true);
    };

    // ===== عملیات روی درخواست =====
    const showActionModal = (record: ApprovalRequest, action: 'approve' | 'reject' | 'revision') => {
        setSelectedRequest(record);
        setActionType(action);
        setActionNote('');
        form.resetFields();
        setActionVisible(true);
    };

    const handleAction = async () => {
        if (!selectedRequest) return;

        try {
            setActionLoading(true);
            const values = await form.getFieldsValue();
            const response = await adminApi.handleApproval(
                selectedRequest.id,
                actionType,
                values.note || undefined
            );

            if (response.data.success) {
                const actionLabels = {
                    approve: 'تایید',
                    reject: 'رد',
                    revision: 'اصلاح',
                };
                message.success(`درخواست با موفقیت ${actionLabels[actionType]} شد`);
                setActionVisible(false);
                form.resetFields();
                fetchRequests();
            }
        } catch (error: any) {
            console.error('Error handling request:', error);
            message.error(error.response?.data?.message || 'خطا در انجام عملیات');
        } finally {
            setActionLoading(false);
        }
    };

    // ===== فیلترها =====
    const handleSearch = (value: string) => {
        setSearchText(value);
    };

    const handleRefresh = () => {
        fetchRequests();
        message.success('اطلاعات به‌روزرسانی شد');
    };

    const handleTabChange = (key: string) => {
        setActiveTab(key);
        setPagination({ ...pagination, current: 1 });
    };

    // ===== وضعیت‌ها =====
    const getStatusBadge = (status: string) => {
        const map: Record<string, { color: string; text: string; status: 'default' | 'processing' | 'success' | 'warning' | 'error' }> = {
            pending: { color: 'gold', text: 'در انتظار تایید', status: 'processing' },
            approved: { color: 'green', text: 'تایید شده', status: 'success' },
            rejected: { color: 'red', text: 'رد شده', status: 'error' },
        };
        return map[status] || { color: 'default', text: status, status: 'default' };
    };

    const getRequestTypeLabel = (type: string) => {
        const map: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
            add: { label: '➕ افزودن پرسنل جدید', color: 'green', icon: <UserOutlined /> },
            delete: { label: '🗑️ حذف پرسنل', color: 'red', icon: <DeleteOutlined /> },
        };
        return map[type] || { label: type, color: 'default', icon: null };
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
            title: 'نوع درخواست',
            dataIndex: 'request_type',
            key: 'request_type',
            render: (type: string) => {
                const info = getRequestTypeLabel(type);
                return <Tag color={info.color} icon={info.icon}>{info.label}</Tag>;
            },
        },
        {
            title: 'درخواست‌دهنده',
            dataIndex: 'requester_name',
            key: 'requester_name',
            render: (text: string) => <Text strong>{text}</Text>,
        },
        {
            title: 'واحد',
            dataIndex: 'unit_name',
            key: 'unit_name',
            render: (text: string) => <Tag icon={<ApartmentOutlined />} color="blue">{text}</Tag>,
        },
        {
            title: 'تاریخ ثبت',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date: string) => new Date(date).toLocaleDateString('fa-IR'),
        },
        {
            title: 'وضعیت',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const info = getStatusBadge(status);
                return <Badge status={info.status} text={info.text} />;
            },
        },
        {
            title: 'عملیات',
            key: 'actions',
            render: (_: any, record: ApprovalRequest) => (
                <Space size="small">
                    <Tooltip title="مشاهده">
                        <Button
                            type="text"
                            icon={<EyeOutlined />}
                            size="small"
                            onClick={() => showDetail(record)}
                        />
                    </Tooltip>
                    {record.status === 'pending' && (
                        <>
                            <Tooltip title="تایید">
                                <Button
                                    type="text"
                                    icon={<CheckOutlined />}
                                    size="small"
                                    style={{ color: '#52c41a' }}
                                    onClick={() => showActionModal(record, 'approve')}
                                />
                            </Tooltip>
                            <Tooltip title="درخواست اصلاح">
                                <Button
                                    type="text"
                                    icon={<EditOutlined />}
                                    size="small"
                                    style={{ color: '#faad14' }}
                                    onClick={() => showActionModal(record, 'revision')}
                                />
                            </Tooltip>
                            <Tooltip title="رد">
                                <Button
                                    type="text"
                                    icon={<CloseOutlined />}
                                    size="small"
                                    danger
                                    onClick={() => showActionModal(record, 'reject')}
                                />
                            </Tooltip>
                        </>
                    )}
                </Space>
            ),
            width: 200,
        },
    ];

    // ===== فیلتر داده‌ها =====
    const filteredData = requests.filter((req) =>
        req.requester_name.includes(searchText) ||
        req.unit_name.includes(searchText)
    );

    // ===== آمار =====
    const stats = {
        pending: requests.filter(r => r.status === 'pending').length,
        approved: requests.filter(r => r.status === 'approved').length,
        rejected: requests.filter(r => r.status === 'rejected').length,
        total: requests.length,
    };

    // ===== نمایش =====
    return (
        <div style={{ padding: 24 }}>
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                        <Title level={4} style={{ margin: 0 }}>✅ درخواست‌های تایید</Title>
                        <Text type="secondary">{pagination.total} درخواست</Text>
                    </div>
                    <Space>
                        <Tooltip title="بارگذاری مجدد">
                            <Button icon={<ReloadOutlined />} onClick={handleRefresh} />
                        </Tooltip>
                        <Input.Search
                            placeholder="جستجو..."
                            allowClear
                            onSearch={handleSearch}
                            style={{ width: 200 }}
                            prefix={<SearchOutlined />}
                            enterButton
                        />
                    </Space>
                </div>

                <Tabs activeKey={activeTab} onChange={handleTabChange}>
                    <TabPane tab={`⏳ در انتظار (${stats.pending})`} key="pending" />
                    <TabPane tab={`✅ تایید شده (${stats.approved})`} key="approved" />
                    <TabPane tab={`❌ رد شده (${stats.rejected})`} key="rejected" />
                    <TabPane tab={`📋 همه (${stats.total})`} key="all" />
                </Tabs>

                <Table
                    dataSource={filteredData}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        showSizeChanger: true,
                        showTotal: (total) => `${total} درخواست`,
                        position: ['bottomRight'],
                        onChange: (page, pageSize) => {
                            setPagination({ ...pagination, current: page, pageSize: pageSize || 10 });
                        },
                    }}
                    bordered={false}
                />
            </Card>

            {/* ===== مودال جزئیات ===== */}
            <Modal
                title="جزئیات درخواست"
                open={detailVisible}
                onCancel={() => setDetailVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setDetailVisible(false)}>
                        بستن
                    </Button>,
                ]}
                width={600}
            >
                {selectedRequest && (
                    <div>
                        <Descriptions bordered column={1} size="middle">
                            <Descriptions.Item label="نوع درخواست">
                                <Tag color={getRequestTypeLabel(selectedRequest.request_type).color}>
                                    {getRequestTypeLabel(selectedRequest.request_type).label}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="درخواست‌دهنده">
                                {selectedRequest.requester_name}
                            </Descriptions.Item>
                            <Descriptions.Item label="واحد">
                                {selectedRequest.unit_name}
                            </Descriptions.Item>
                            <Descriptions.Item label="تاریخ ثبت">
                                {new Date(selectedRequest.created_at).toLocaleDateString('fa-IR')}
                            </Descriptions.Item>
                            <Descriptions.Item label="وضعیت">
                                <Badge
                                    status={getStatusBadge(selectedRequest.status).status}
                                    text={getStatusBadge(selectedRequest.status).text}
                                />
                            </Descriptions.Item>
                            {selectedRequest.admin_note && (
                                <Descriptions.Item label="یادداشت ادمین">
                                    {selectedRequest.admin_note}
                                </Descriptions.Item>
                            )}
                        </Descriptions>

                        {selectedRequest.personnel_data && (
                            <div style={{ marginTop: 16 }}>
                                <Text strong>اطلاعات پرسنل:</Text>
                                <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4, marginTop: 8 }}>
                                    {JSON.stringify(selectedRequest.personnel_data, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* ===== مودال عملیات ===== */}
            <Modal
                title={
                    actionType === 'approve' ? '✓ تایید درخواست' :
                    actionType === 'reject' ? '✗ رد درخواست' :
                    '🔄 درخواست اصلاح'
                }
                open={actionVisible}
                onCancel={() => {
                    setActionVisible(false);
                    form.resetFields();
                }}
                onOk={handleAction}
                confirmLoading={actionLoading}
                okText={
                    actionType === 'approve' ? '✓ تایید' :
                    actionType === 'reject' ? '✗ رد' :
                    '🔄 ارسال برای اصلاح'
                }
                cancelText="انصراف"
                okButtonProps={{
                    danger: actionType === 'reject',
                }}
            >
                {actionType === 'revision' && (
                    <Alert
                        message="درخواست اصلاح"
                        description="با این عمل، درخواست به سرپرست واحد بازگشت داده می‌شود تا اصلاحات لازم اعمال شود."
                        type="warning"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />
                )}
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="note"
                        label={actionType === 'revision' ? 'توضیحات اصلاح' : 'یادداشت (اختیاری)'}
                        rules={[
                            { required: actionType === 'revision', message: 'لطفاً توضیحات اصلاح را وارد کنید' }
                        ]}
                    >
                        <TextArea
                            rows={4}
                            placeholder={
                                actionType === 'revision'
                                    ? 'لطفاً توضیح دهید چه مواردی نیاز به اصلاح دارد...'
                                    : 'یادداشت (اختیاری)...'
                            }
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ApprovalsList;