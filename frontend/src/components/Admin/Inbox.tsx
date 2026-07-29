// frontend/src/components/Admin/Inbox.tsx
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
    Avatar,
    Divider,
    Timeline,
    Tabs,
} from 'antd';
import {
    SearchOutlined,
    ReloadOutlined,
    EyeOutlined,
    DeleteOutlined,
    UserOutlined,
    SendOutlined,
    MailOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
} from '@ant-design/icons';
import { inboxApi, InboxMessage } from '../../api/inbox';
import { useAuthStore } from '../../store/authStore';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;

const AdminInbox: React.FC = () => {
    const { user } = useAuthStore();
    const [messages, setMessages] = useState<InboxMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [activeTab, setActiveTab] = useState('unread');
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

    // ===== مودال‌ها =====
    const [detailVisible, setDetailVisible] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<InboxMessage | null>(null);
    const [replyLoading, setReplyLoading] = useState(false);
    const [replyForm] = Form.useForm();

    // ===== داده‌های آزمایشی =====
    const mockMessages: InboxMessage[] = [
        {
            id: 1,
            title: 'درخواست تایید پرسنل جدید',
            message: 'سلام. لطفاً پرسنل جدید ثبت شده در واحد فناوری اطلاعات را تایید کنید.',
            sender_id: 2,
            sender_name: 'رضا احمدی',
            receiver_id: 1,
            receiver_name: 'مدیر سیستم',
            status: 'unread',
            created_at: new Date(Date.now() - 3600000).toISOString(),
            replies: [],
        },
        {
            id: 2,
            title: 'گزارش مشکل در سیستم',
            message: 'سیستم به کندی کار می‌کند. لطفاً بررسی کنید.',
            sender_id: 3,
            sender_name: 'سارا کریمی',
            receiver_id: 1,
            receiver_name: 'مدیر سیستم',
            status: 'read',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            replies: [
                {
                    id: 1,
                    message_id: 2,
                    user_id: 1,
                    user_name: 'مدیر سیستم',
                    message: 'مشکل بررسی شد. سرور ری‌استارت شد.',
                    created_at: new Date(Date.now() - 43200000).toISOString(),
                },
            ],
        },
        {
            id: 3,
            title: 'درخواست تغییر رمز عبور',
            message: 'سلام. لطفاً رمز عبور من را بازنشانی کنید.',
            sender_id: 4,
            sender_name: 'محمد محمدی',
            receiver_id: 1,
            receiver_name: 'مدیر سیستم',
            status: 'unread',
            created_at: new Date(Date.now() - 172800000).toISOString(),
            replies: [],
        },
    ];

    // ===== بارگذاری داده‌ها =====
    useEffect(() => {
        fetchMessages();
    }, [activeTab, pagination.current]);

    const fetchMessages = async () => {
        try {
            setLoading(true);
            // استفاده از داده‌های آزمایشی
            let filtered = mockMessages;
            if (activeTab === 'unread') {
                filtered = filtered.filter(m => m.status === 'unread');
            } else if (activeTab === 'read') {
                filtered = filtered.filter(m => m.status === 'read');
            }
            setMessages(filtered);
            setPagination({
                ...pagination,
                total: filtered.length,
            });
        } catch (error) {
            console.error('Error fetching messages:', error);
            message.error('خطا در دریافت پیام‌ها');
        } finally {
            setLoading(false);
        }
    };

    // ===== نمایش جزئیات =====
    const showDetail = async (record: InboxMessage) => {
        try {
            // علامت‌گذاری به عنوان خوانده شده
            if (record.status === 'unread') {
                await inboxApi.markAsRead(record.id);
                // به‌روزرسانی محلی
                setMessages(messages.map(m =>
                    m.id === record.id ? { ...m, status: 'read' } : m
                ));
            }
            setSelectedMessage(record);
            setDetailVisible(true);
            replyForm.resetFields();
        } catch (error) {
            console.error('Error marking message as read:', error);
        }
    };

    // ===== ارسال پاسخ =====
    const handleReply = async (values: { message: string }) => {
        if (!selectedMessage) return;
        try {
            setReplyLoading(true);
            const newReply = {
                id: Date.now(),
                message_id: selectedMessage.id,
                user_id: user?.id || 1,
                user_name: user?.full_name || 'مدیر سیستم',
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
            message.error(error.response?.data?.message || 'خطا در ارسال پاسخ');
        } finally {
            setReplyLoading(false);
        }
    };

    // ===== حذف پیام =====
    const handleDeleteMessage = async (id: number, title: string) => {
        try {
            setMessages(messages.filter(m => m.id !== id));
            message.success(`پیام "${title}" با موفقیت حذف شد`);
            fetchMessages();
        } catch (error: any) {
            console.error('Error deleting message:', error);
            message.error(error.response?.data?.message || 'خطا در حذف پیام');
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

    const handleTabChange = (key: string) => {
        setActiveTab(key);
        setPagination({ ...pagination, current: 1 });
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
            title: 'عنوان',
            dataIndex: 'title',
            key: 'title',
            render: (text: string, record: InboxMessage) => (
                <Space>
                    <Text strong={record.status === 'unread'}>
                        {text}
                    </Text>
                    {record.status === 'unread' && (
                        <Badge status="processing" />
                    )}
                </Space>
            ),
        },
        {
            title: 'فرستنده',
            dataIndex: 'sender_name',
            key: 'sender_name',
            render: (text: string) => (
                <Space>
                    <Avatar size="small" icon={<UserOutlined />} />
                    {text}
                </Space>
            ),
        },
        {
            title: 'وضعیت',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={status === 'unread' ? 'gold' : 'green'}>
                    {status === 'unread' ? 'خوانده نشده' : 'خوانده شده'}
                </Tag>
            ),
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
            render: (_: any, record: InboxMessage) => (
                <Space size="small">
                    <Tooltip title="مشاهده">
                        <Button
                            type="text"
                            icon={<EyeOutlined />}
                            size="small"
                            onClick={() => showDetail(record)}
                        />
                    </Tooltip>
                    <Tooltip title="حذف">
                        <Popconfirm
                            title="حذف پیام"
                            description={`آیا از حذف پیام "${record.title}" اطمینان دارید؟`}
                            onConfirm={() => handleDeleteMessage(record.id, record.title)}
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
    const filteredData = messages.filter((msg) =>
        msg.title.includes(searchText) ||
        msg.sender_name.includes(searchText) ||
        msg.message.includes(searchText)
    );

    // ===== آمار =====
    const stats = {
        unread: messages.filter(m => m.status === 'unread').length,
        read: messages.filter(m => m.status === 'read').length,
        total: messages.length,
    };

    // ===== نمایش =====
    return (
        <div style={{ padding: 24 }}>
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                        <Title level={4} style={{ margin: 0 }}>📬 صندوق پیام ادمین</Title>
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

                <Tabs activeKey={activeTab} onChange={handleTabChange}>
                    <TabPane tab={`🔴 خوانده نشده (${stats.unread})`} key="unread" />
                    <TabPane tab={`🟢 خوانده شده (${stats.read})`} key="read" />
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
                        showTotal: (total) => `${total} پیام`,
                        position: ['bottomRight'],
                    }}
                    onChange={(newPagination) => {
                        setPagination({ ...pagination, current: newPagination.current || 1, pageSize: newPagination.pageSize || 10 });
                    }}
                    bordered={false}
                />
            </Card>

            {/* ===== مودال جزئیات پیام ===== */}
            <Modal
                title={`جزئیات پیام: ${selectedMessage?.title}`}
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
                                <Tag color="green">{selectedMessage.receiver_name}</Tag>
                                <Tag color={selectedMessage.status === 'unread' ? 'gold' : 'green'}>
                                    {selectedMessage.status === 'unread' ? 'خوانده نشده' : 'خوانده شده'}
                                </Tag>
                            </Space>
                            <div style={{ marginTop: 8, color: '#888', fontSize: 12 }}>
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

export default AdminInbox;