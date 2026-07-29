// frontend/src/components/Tickets/WorkMessagesList.tsx
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
    message,
    Spin,
    Modal,
    Form,
    Badge,
    Avatar,
    Divider,
    Timeline,
} from 'antd';
import {
    SearchOutlined,
    ReloadOutlined,
    EyeOutlined,
    UserOutlined,
    SendOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface WorkMessage {
    id: number;
    personnel_id: number;
    personnel_name: string;
    period_title: string;
    message: string;
    sender_id: number;
    sender_name: string;
    status: 'draft' | 'unit_pending' | 'dept_pending' | 'org_pending' | 'org_approved' | 'revision';
    created_at: string;
    replies?: WorkMessageReply[];
}

interface WorkMessageReply {
    id: number;
    work_message_id: number;
    user_id: number;
    user_name: string;
    message: string;
    created_at: string;
}

const WorkMessagesList: React.FC = () => {
    const { user } = useAuthStore();
    const [messages, setMessages] = useState<WorkMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

    // ===== مودال‌ها =====
    const [detailVisible, setDetailVisible] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<WorkMessage | null>(null);
    const [replyLoading, setReplyLoading] = useState(false);
    const [replyForm] = Form.useForm();

    // ===== داده‌های آزمایشی =====
    const mockMessages: WorkMessage[] = [
        {
            id: 1,
            personnel_id: 1,
            personnel_name: 'رضا احمدی',
            period_title: 'دوره تابستان ۱۴۰۴',
            message: 'لطفاً اطلاعات سمت این پرسنل را اصلاح کنید. در سیستم فعلی سمت ایشان اشتباه ثبت شده است.',
            sender_id: 2,
            sender_name: 'مدیر اداره فناوری اطلاعات',
            status: 'revision',
            created_at: new Date(Date.now() - 3600000).toISOString(),
            replies: [
                {
                    id: 1,
                    work_message_id: 1,
                    user_id: 3,
                    user_name: 'سرپرست واحد',
                    message: 'اطلاعات اصلاح شد. لطفاً بررسی کنید.',
                    created_at: new Date(Date.now() - 1800000).toISOString(),
                },
            ],
        },
        {
            id: 2,
            personnel_id: 2,
            personnel_name: 'سارا کریمی',
            period_title: 'دوره تابستان ۱۴۰۴',
            message: 'کارکرد این پرسنل تایید شده است. لطفاً برای تایید نهایی اقدام کنید.',
            sender_id: 4,
            sender_name: 'مدیر اداره منابع انسانی',
            status: 'org_pending',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            replies: [],
        },
        {
            id: 3,
            personnel_id: 3,
            personnel_name: 'محمد محمدی',
            period_title: 'دوره بهار ۱۴۰۴',
            message: 'مدارک این پرسنل کامل نیست. لطفاً مدارک را تکمیل کنید.',
            sender_id: 1,
            sender_name: 'مدیر سازمان',
            status: 'revision',
            created_at: new Date(Date.now() - 172800000).toISOString(),
            replies: [
                {
                    id: 2,
                    work_message_id: 3,
                    user_id: 5,
                    user_name: 'مدیر منابع انسانی',
                    message: 'مدارک تکمیل شد. لطفاً مجدداً بررسی کنید.',
                    created_at: new Date(Date.now() - 86400000).toISOString(),
                },
            ],
        },
    ];

    // ===== بارگذاری داده‌ها =====
    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        try {
            setLoading(true);
            setMessages(mockMessages);
            setPagination({ ...pagination, total: mockMessages.length });
        } catch (error) {
            console.error('Error fetching work messages:', error);
            message.error('خطا در دریافت پیام‌های کاری');
        } finally {
            setLoading(false);
        }
    };

    // ===== نمایش جزئیات =====
    const showDetail = (record: WorkMessage) => {
        setSelectedMessage(record);
        setDetailVisible(true);
        replyForm.resetFields();
    };

    // ===== ارسال پاسخ =====
    const handleReply = async (values: { message: string }) => {
        if (!selectedMessage) return;
        try {
            setReplyLoading(true);
            const newReply: WorkMessageReply = {
                id: Date.now(),
                work_message_id: selectedMessage.id,
                user_id: user?.id || 1,
                user_name: user?.full_name || 'کاربر',
                message: values.message,
                created_at: new Date().toISOString(),
            };
            
            const updatedMessage = { ...selectedMessage };
            if (!updatedMessage.replies) {
                updatedMessage.replies = [];
            }
            updatedMessage.replies.push(newReply);
            setSelectedMessage(updatedMessage);
            
            message.success('پاسخ با موفقیت ارسال شد');
            replyForm.resetFields();
            fetchMessages();
        } catch (error: any) {
            console.error('Error replying:', error);
            message.error('خطا در ارسال پاسخ');
        } finally {
            setReplyLoading(false);
        }
    };

    // ===== فیلترها =====
    const handleSearch = (value: string) => {
        setSearchText(value);
    };

    const handleRefresh = () => {
        fetchMessages();
        message.success('اطلاعات به‌روزرسانی شد');
    };

    // ===== وضعیت‌ها =====
    const getStatusBadge = (status: string) => {
        const map: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
            draft: { color: 'default', text: 'پیش‌نویس', icon: <ClockCircleOutlined /> },
            unit_pending: { color: 'processing', text: 'در انتظار تایید سرپرست', icon: <ClockCircleOutlined /> },
            dept_pending: { color: 'processing', text: 'در انتظار تایید مدیر اداره', icon: <ClockCircleOutlined /> },
            org_pending: { color: 'processing', text: 'در انتظار تایید مدیر سازمان', icon: <ClockCircleOutlined /> },
            org_approved: { color: 'success', text: 'تایید نهایی شده', icon: <CheckCircleOutlined /> },
            revision: { color: 'warning', text: 'نیاز به اصلاح دارد', icon: <ExclamationCircleOutlined /> },
        };
        return map[status] || { color: 'default', text: status, icon: null };
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
            title: 'پرسنل',
            dataIndex: 'personnel_name',
            key: 'personnel_name',
            render: (text: string) => (
                <Space>
                    <Avatar size="small" icon={<UserOutlined />} />
                    <Text strong>{text}</Text>
                </Space>
            ),
        },
        {
            title: 'دوره',
            dataIndex: 'period_title',
            key: 'period_title',
            render: (text: string) => <Tag color="purple">{text}</Tag>,
        },
        {
            title: 'فرستنده',
            dataIndex: 'sender_name',
            key: 'sender_name',
            render: (text: string) => <Tag color="blue">{text}</Tag>,
        },
        {
            title: 'پیام',
            dataIndex: 'message',
            key: 'message',
            render: (text: string) => (
                <div style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {text}
                </div>
            ),
        },
        {
            title: 'وضعیت کارکرد',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const info = getStatusBadge(status);
                return <Badge status={info.color as any} text={info.text} />;
            },
        },
        {
            title: 'تاریخ',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date: string) => new Date(date).toLocaleDateString('fa-IR'),
        },
        {
            title: 'عملیات',
            key: 'actions',
            render: (_: any, record: WorkMessage) => (
                <Tooltip title="مشاهده">
                    <Button
                        type="text"
                        icon={<EyeOutlined />}
                        size="small"
                        onClick={() => showDetail(record)}
                    />
                </Tooltip>
            ),
            width: 80,
        },
    ];

    // ===== فیلتر داده‌ها =====
    const filteredData = messages.filter((msg) =>
        msg.personnel_name.includes(searchText) ||
        msg.sender_name.includes(searchText) ||
        msg.message.includes(searchText)
    );

    return (
        <div style={{ padding: 24 }}>
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                        <Title level={4} style={{ margin: 0 }}>💬 پیام‌های کاری</Title>
                        <Text type="secondary">{pagination.total} پیام</Text>
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
                        showTotal: (total) => `${total} پیام`,
                        position: ['bottomRight'],
                    }}
                    bordered={false}
                />
            </Card>

            {/* ===== مودال جزئیات پیام ===== */}
            <Modal
                title={`جزئیات پیام - ${selectedMessage?.personnel_name}`}
                open={detailVisible}
                onCancel={() => {
                    setDetailVisible(false);
                    setSelectedMessage(null);
                    replyForm.resetFields();
                }}
                footer={null}
                width={700}
                destroyOnClose
            >
                {selectedMessage && (
                    <div>
                        <div style={{ marginBottom: 16 }}>
                            <Space>
                                <Tag color="blue">{selectedMessage.sender_name}</Tag>
                                <Text>→</Text>
                                <Tag color="green">{selectedMessage.personnel_name}</Tag>
                                <Badge
                                    status={getStatusBadge(selectedMessage.status).color as any}
                                    text={getStatusBadge(selectedMessage.status).text}
                                />
                            </Space>
                            <div style={{ marginTop: 8, color: '#888', fontSize: 12 }}>
                                دوره: {selectedMessage.period_title}
                            </div>
                            <div style={{ marginTop: 4, color: '#888', fontSize: 12 }}>
                                {new Date(selectedMessage.created_at).toLocaleString('fa-IR')}
                            </div>
                        </div>

                        <Card size="small" style={{ marginBottom: 16, background: '#f5f5f5' }}>
                            <Text>{selectedMessage.message}</Text>
                        </Card>

                        <Divider>پاسخ‌ها</Divider>

                        <Timeline>
                            {selectedMessage.replies?.map((reply) => (
                                <Timeline.Item key={reply.id} color="blue">
                                    <div>
                                        <Space>
                                            <Text strong>{reply.user_name}</Text>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                {new Date(reply.created_at).toLocaleString('fa-IR')}
                                            </Text>
                                        </Space>
                                        <div style={{ marginTop: 4 }}>{reply.message}</div>
                                    </div>
                                </Timeline.Item>
                            ))}
                            {!selectedMessage.replies?.length && (
                                <Text type="secondary">هیچ پاسخی ثبت نشده است</Text>
                            )}
                        </Timeline>

                        <Divider>ارسال پاسخ</Divider>

                        <Form form={replyForm} layout="vertical" onFinish={handleReply}>
                            <Form.Item
                                name="message"
                                rules={[{ required: true, message: 'لطفاً متن پاسخ را وارد کنید' }]}
                            >
                                <TextArea rows={3} placeholder="متن پاسخ..." />
                            </Form.Item>
                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={replyLoading}
                                    icon={<SendOutlined />}
                                >
                                    ارسال پاسخ
                                </Button>
                            </Form.Item>
                        </Form>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default WorkMessagesList;