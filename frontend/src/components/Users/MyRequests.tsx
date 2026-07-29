// frontend/src/components/Users/MyRequests.tsx
import React, { useState, useEffect } from 'react';
import {
    Card,
    Table,
    Typography,
    Space,
    Button,
    Select,
    Tag,
    Badge,
    Modal,
    message,
    Spin,
    Row,
    Col,
    Statistic,
} from 'antd';
import {
    PlusOutlined,
    ReloadOutlined,
    EyeOutlined,
    EditOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { requestsApi, Request } from '../../api/requests';

const { Title, Text } = Typography;
const { Option } = Select;

const MyRequests: React.FC = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [detailVisible, setDetailVisible] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);

    useEffect(() => {
        fetchRequests();
    }, [statusFilter, typeFilter, pagination.current]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await requestsApi.getMyRequests({
                status: statusFilter || undefined,
                type: typeFilter || undefined,
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
            console.error('Error fetching requests:', error);
            message.error('خطا در دریافت درخواست‌ها');
        } finally {
            setLoading(false);
        }
    };

    const showDetail = (record: Request) => {
        setSelectedRequest(record);
        setDetailVisible(true);
    };

    const getStatusBadge = (status: string) => {
        const map: Record<string, { color: string; text: string; status: 'default' | 'processing' | 'success' | 'warning' | 'error' }> = {
            pending_unit: { color: 'gold', text: 'در انتظار تایید', status: 'processing' },
            approved: { color: 'green', text: 'تایید شده', status: 'success' },
            rejected: { color: 'red', text: 'رد شده', status: 'error' },
            revision: { color: 'blue', text: 'نیاز به اصلاح', status: 'warning' },
        };
        return map[status] || { color: 'default', text: status, status: 'default' };
    };

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
            dataIndex: 'request_type_persian',
            key: 'request_type_persian',
        },
        {
            title: 'تاریخ ثبت',
            dataIndex: 'request_date',
            key: 'request_date',
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
            render: (_: any, record: Request) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EyeOutlined />}
                        size="small"
                        onClick={() => showDetail(record)}
                    >
                        مشاهده
                    </Button>
                    {record.status === 'revision' && (
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            size="small"
                            style={{ color: '#faad14' }}
                            onClick={() => navigate(`/requests/${record.id}/edit`)}
                        >
                            ویرایش
                        </Button>
                    )}
                </Space>
            ),
        },
    ];

    const stats = {
        total: requests.length,
        pending: requests.filter(r => r.status === 'pending_unit').length,
        approved: requests.filter(r => r.status === 'approved').length,
        rejected: requests.filter(r => r.status === 'rejected').length,
    };

    return (
        <div style={{ padding: 24 }}>
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Title level={4} style={{ margin: 0 }}>📋 درخواست‌های من</Title>
                    <Space>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => navigate('/requests/new')}
                        >
                            درخواست جدید
                        </Button>
                    </Space>
                </div>

                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col xs={12} sm={6}>
                        <Card size="small">
                            <Statistic title="کل درخواست‌ها" value={stats.total} />
                        </Card>
                    </Col>
                    <Col xs={12} sm={6}>
                        <Card size="small">
                            <Statistic title="در انتظار تایید" value={stats.pending} valueStyle={{ color: '#faad14' }} />
                        </Card>
                    </Col>
                    <Col xs={12} sm={6}>
                        <Card size="small">
                            <Statistic title="تایید شده" value={stats.approved} valueStyle={{ color: '#52c41a' }} />
                        </Card>
                    </Col>
                    <Col xs={12} sm={6}>
                        <Card size="small">
                            <Statistic title="رد شده" value={stats.rejected} valueStyle={{ color: '#ff4d4f' }} />
                        </Card>
                    </Col>
                </Row>

                <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                    <Select
                        style={{ width: 150 }}
                        placeholder="وضعیت"
                        allowClear
                        value={statusFilter}
                        onChange={(value) => setStatusFilter(value || '')}
                    >
                        <Option value="pending_unit">در انتظار تایید</Option>
                        <Option value="approved">تایید شده</Option>
                        <Option value="rejected">رد شده</Option>
                        <Option value="revision">نیاز به اصلاح</Option>
                    </Select>
                    <Select
                        style={{ width: 150 }}
                        placeholder="نوع درخواست"
                        allowClear
                        value={typeFilter}
                        onChange={(value) => setTypeFilter(value || '')}
                    >
                        <Option value="overtime">اضافه کار</Option>
                        <Option value="annual_leave">مرخصی روزانه</Option>
                        <Option value="hourly_leave">مرخصی ساعتی</Option>
                        <Option value="daily_mission">ماموریت روزانه</Option>
                        <Option value="official_mission">ماموریت اداری</Option>
                        <Option value="deficiency">ثبت نواقص</Option>
                        <Option value="arbaeen">سفر اربعین</Option>
                    </Select>
                    <Button icon={<ReloadOutlined />} onClick={fetchRequests}>
                        رفرش
                    </Button>
                </div>

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
                    }}
                    onChange={(newPagination) => {
                        setPagination({
                            ...pagination,
                            current: newPagination.current || 1,
                            pageSize: newPagination.pageSize || 10,
                        });
                    }}
                />
            </Card>

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
                                <Text strong>نوع درخواست:</Text>
                                <div>{selectedRequest.request_type_persian}</div>
                            </Col>
                            <Col span={12}>
                                <Text strong>وضعیت:</Text>
                                <div>
                                    <Badge
                                        status={getStatusBadge(selectedRequest.status).status}
                                        text={getStatusBadge(selectedRequest.status).text}
                                    />
                                </div>
                            </Col>
                            <Col span={12}>
                                <Text strong>تاریخ ثبت:</Text>
                                <div>{selectedRequest.request_date}</div>
                            </Col>
                            <Col span={12}>
                                <Text strong>درخواست‌دهنده:</Text>
                                <div>{selectedRequest.requester_name}</div>
                            </Col>
                            {selectedRequest.revision_note && (
                                <Col span={24}>
                                    <Text strong>توضیحات اصلاح:</Text>
                                    <div style={{ color: '#faad14' }}>{selectedRequest.revision_note}</div>
                                </Col>
                            )}
                            {selectedRequest.reject_reason && (
                                <Col span={24}>
                                    <Text strong>دلیل رد:</Text>
                                    <div style={{ color: '#ff4d4f' }}>{selectedRequest.reject_reason}</div>
                                </Col>
                            )}
                            {selectedRequest.extra_data && (
                                <Col span={24}>
                                    <Text strong>اطلاعات تکمیلی:</Text>
                                    <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
                                        {JSON.stringify(selectedRequest.extra_data, null, 2)}
                                    </pre>
                                </Col>
                            )}
                        </Row>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default MyRequests;