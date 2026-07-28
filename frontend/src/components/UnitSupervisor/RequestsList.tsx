// frontend/src/components/UnitSupervisor/RequestsList.tsx
import React, { useState, useEffect } from 'react';
import {
    Card,
    Table,
    Typography,
    Space,
    Button,
    Tag,
    Badge,
    Modal,
    Input,
    message,
    Spin,
    Select,
    Row,
    Col,
    Statistic,
    Empty,
} from 'antd';
import {
    ReloadOutlined,
    EyeOutlined,
    CheckOutlined,
    CloseOutlined,
    EditOutlined,
    ExclamationCircleOutlined,
    FilterOutlined,
    ClearOutlined,
} from '@ant-design/icons';
import { unitSupervisorApi } from '../../api/unitSupervisor';
import { PersonnelRequest } from '../../types';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// وضعیت‌های درخواست
const STATUS_MAP: Record<string, { color: string; label: string; status: 'default' | 'processing' | 'success' | 'warning' | 'error' }> = {
    pending: { color: 'gold', label: 'در انتظار تایید', status: 'processing' },
    approved: { color: 'green', label: 'تایید شده', status: 'success' },
    rejected: { color: 'red', label: 'رد شده', status: 'error' },
};

// نوع‌های درخواست
const REQUEST_TYPE_MAP: Record<string, { label: string; icon: string }> = {
    add: { label: '➕ افزودن پرسنل جدید', icon: '➕' },
    delete: { label: '🗑️ حذف پرسنل', icon: '🗑️' },
};

interface RequestsListProps {
    unitId?: number;
}

const RequestsList: React.FC<RequestsListProps> = ({ unitId }) => {
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState<PersonnelRequest[]>([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [filters, setFilters] = useState({ status: '', type: '' });

    // ===== مودال جزئیات =====
    const [detailVisible, setDetailVisible] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<PersonnelRequest | null>(null);

    // ===== مودال عملیات =====
    const [actionVisible, setActionVisible] = useState(false);
    const [actionType, setActionType] = useState<'approve' | 'reject' | 'revision'>('approve');
    const [actionNote, setActionNote] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // ===== بارگذاری داده‌ها =====
    useEffect(() => {
        fetchRequests();
    }, [filters, pagination.current]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await unitSupervisorApi.getRequests({
                status: filters.status || undefined,
                type: filters.type || undefined,
                page: pagination.current,
                per_page: pagination.pageSize,
            });

            if (response.data.success) {
                setRequests(response.data.data.requests);
                setPagination({
                    ...pagination,
                    total: response.data.total || 0,
                });
            }
        } catch (error) {
            console.error('Error fetching requests:', error);
            message.error('خطا در دریافت درخواست‌ها');
        } finally {
            setLoading(false);
        }
    };

    // ===== نمایش جزئیات =====
    const showDetail = (record: PersonnelRequest) => {
        setSelectedRequest(record);
        setDetailVisible(true);
    };

    // ===== عملیات روی درخواست =====
    const showActionModal = (record: PersonnelRequest, action: 'approve' | 'reject' | 'revision') => {
        setSelectedRequest(record);
        setActionType(action);
        setActionNote('');
        setActionVisible(true);
    };

    const handleAction = async () => {
        if (!selectedRequest) return;

        try {
            setActionLoading(true);
            const response = await unitSupervisorApi.handleRequest(
                selectedRequest.id,
                actionType,
                actionNote || undefined
            );

            if (response.data.success) {
                const actionLabels = {
                    approve: 'تایید',
                    reject: 'رد',
                    revision: 'اصلاح',
                };
                message.success(`درخواست با موفقیت ${actionLabels[actionType]} شد`);
                setActionVisible(false);
                fetchRequests();
            }
        } catch (error) {
            console.error('Error handling request:', error);
            message.error('خطا در انجام عملیات');
        } finally {
            setActionLoading(false);
        }
    };

    // ===== آمار =====
    const stats = {
        total: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        approved: requests.filter(r => r.status === 'approved').length,
        rejected: requests.filter(r => r.status === 'rejected').length,
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
                const info = REQUEST_TYPE_MAP[type];
                return info ? (
                    <Tag color={type === 'add' ? 'green' : 'red'}>
                        {info.label}
                    </Tag>
                ) : type;
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
                const info = STATUS_MAP[status];
                return info ? (
                    <Badge status={info.status} text={info.label} />
                ) : status;
            },
        },
        {
            title: 'عملیات',
            key: 'actions',
            render: (_: any, record: PersonnelRequest) => (
                <Space size="small">
                    <Button
                        type="text"
                        icon={<EyeOutlined />}
                        size="small"
                        onClick={() => showDetail(record)}
                    >
                        مشاهده
                    </Button>
                    {record.status === 'pending' && (
                        <>
                            <Button
                                type="text"
                                icon={<CheckOutlined />}
                                size="small"
                                style={{ color: '#52c41a' }}
                                onClick={() => showActionModal(record, 'approve')}
                            >
                                تایید
                            </Button>
                            <Button
                                type="text"
                                icon={<EditOutlined />}
                                size="small"
                                style={{ color: '#faad14' }}
                                onClick={() => showActionModal(record, 'revision')}
                            >
                                اصلاح
                            </Button>
                            <Button
                                type="text"
                                icon={<CloseOutlined />}
                                size="small"
                                danger
                                onClick={() => showActionModal(record, 'reject')}
                            >
                                رد
                            </Button>
                        </>
                    )}
                </Space>
            ),
            width: 300,
        },
    ];

    // ===== فیلترها =====
    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    const clearFilters = () => {
        setFilters({ status: '', type: '' });
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    // ===== رندر =====
    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}>
                <Spin size="large" tip="در حال بارگذاری..." />
            </div>
        );
    }

    return (
        <div style={{ padding: 24 }}>
            <Title level={3}>📋 درخواست‌های پرسنل</Title>

            {/* ===== کارت‌های آمار ===== */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="کل درخواست‌ها"
                            value={stats.total}
                            prefix={<ExclamationCircleOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="در انتظار تایید"
                            value={stats.pending}
                            prefix={<Badge status="processing" />}
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="تایید شده"
                            value={stats.approved}
                            prefix={<Badge status="success" />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="رد شده"
                            value={stats.rejected}
                            prefix={<Badge status="error" />}
                            valueStyle={{ color: '#ff4d4f' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* ===== فیلترها ===== */}
            <Card style={{ marginBottom: 16 }}>
                <Row gutter={16} align="middle">
                    <Col>
                        <Text strong>فیلترها:</Text>
                    </Col>
                    <Col>
                        <Select
                            placeholder="وضعیت"
                            style={{ width: 150 }}
                            allowClear
                            value={filters.status || undefined}
                            onChange={(value) => handleFilterChange('status', value || '')}
                        >
                            <Option value="pending">در انتظار تایید</Option>
                            <Option value="approved">تایید شده</Option>
                            <Option value="rejected">رد شده</Option>
                        </Select>
                    </Col>
                    <Col>
                        <Select
                            placeholder="نوع درخواست"
                            style={{ width: 180 }}
                            allowClear
                            value={filters.type || undefined}
                            onChange={(value) => handleFilterChange('type', value || '')}
                        >
                            <Option value="add">افزودن پرسنل</Option>
                            <Option value="delete">حذف پرسنل</Option>
                        </Select>
                    </Col>
                    <Col>
                        <Button icon={<ClearOutlined />} onClick={clearFilters}>
                            پاک کردن فیلترها
                        </Button>
                    </Col>
                    <Col flex="auto" style={{ textAlign: 'left' }}>
                        <Button icon={<ReloadOutlined />} onClick={fetchRequests}>
                            رفرش
                        </Button>
                    </Col>
                </Row>
            </Card>

            {/* ===== جدول ===== */}
            <Card>
                <Table
                    dataSource={requests}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        showSizeChanger: true,
                        showTotal: (total) => `${total} درخواست`,
                        onChange: (page, pageSize) => {
                            setPagination({ ...pagination, current: page, pageSize: pageSize || 10 });
                        },
                    }}
                    locale={{
                        emptyText: <Empty description="هیچ درخواستی یافت نشد" />,
                    }}
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
                        <Row gutter={[16, 16]}>
                            <Col span={12}>
                                <Text type="secondary">نوع درخواست:</Text>
                                <div>
                                    {REQUEST_TYPE_MAP[selectedRequest.request_type]?.label || selectedRequest.request_type}
                                </div>
                            </Col>
                            <Col span={12}>
                                <Text type="secondary">وضعیت:</Text>
                                <div>
                                    <Badge
                                        status={STATUS_MAP[selectedRequest.status]?.status}
                                        text={STATUS_MAP[selectedRequest.status]?.label || selectedRequest.status}
                                    />
                                </div>
                            </Col>
                            <Col span={12}>
                                <Text type="secondary">درخواست‌دهنده:</Text>
                                <div>{selectedRequest.requester_name}</div>
                            </Col>
                            <Col span={12}>
                                <Text type="secondary">تاریخ ثبت:</Text>
                                <div>{new Date(selectedRequest.created_at).toLocaleDateString('fa-IR')}</div>
                            </Col>
                            <Col span={24}>
                                <Text type="secondary">واحد:</Text>
                                <div>{selectedRequest.unit_name}</div>
                            </Col>
                            {selectedRequest.admin_note && (
                                <Col span={24}>
                                    <Text type="secondary">یادداشت:</Text>
                                    <div style={{ background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
                                        {selectedRequest.admin_note}
                                    </div>
                                </Col>
                            )}
                            {selectedRequest.personnel_data && (
                                <Col span={24}>
                                    <Text type="secondary">اطلاعات پرسنل:</Text>
                                    <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
                                        {JSON.stringify(selectedRequest.personnel_data, null, 2)}
                                    </pre>
                                </Col>
                            )}
                        </Row>
                    </div>
                )}
            </Modal>

            {/* ===== مودال عملیات ===== */}
            <Modal
                title={
                    actionType === 'approve' ? 'تایید درخواست' :
                    actionType === 'reject' ? 'رد درخواست' : 'درخواست اصلاح'
                }
                open={actionVisible}
                onCancel={() => setActionVisible(false)}
                onOk={handleAction}
                confirmLoading={actionLoading}
                okText={
                    actionType === 'approve' ? '✓ تایید' :
                    actionType === 'reject' ? '✗ رد' : '🔄 اصلاح'
                }
                cancelText="انصراف"
                okButtonProps={{
                    danger: actionType === 'reject',
                }}
            >
                <div style={{ marginBottom: 16 }}>
                    <Text>
                        {actionType === 'approve' && 'آیا از تایید این درخواست اطمینان دارید؟'}
                        {actionType === 'reject' && 'آیا از رد این درخواست اطمینان دارید؟'}
                        {actionType === 'revision' && 'لطفاً توضیحات اصلاح را وارد کنید:'}
                    </Text>
                </div>
                <TextArea
                    rows={4}
                    placeholder={actionType === 'revision' ? 'توضیحات اصلاح...' : 'یادداشت (اختیاری)...'}
                    value={actionNote}
                    onChange={(e) => setActionNote(e.target.value)}
                />
            </Modal>
        </div>
    );
};

export default RequestsList;