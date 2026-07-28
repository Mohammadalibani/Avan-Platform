// frontend/src/components/Tickets/TicketsList.tsx
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
    Select,
    Tabs,
    Avatar,
    Divider,
    Timeline,
} from 'antd';
import {
    SearchOutlined,
    PlusOutlined,
    ReloadOutlined,
    EyeOutlined,
    DeleteOutlined,
    UserOutlined,
    MailOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ExclamationCircleOutlined,
    SendOutlined,
} from '@ant-design/icons';
import { ticketsApi, Ticket, TicketReply } from '../../api/tickets';
import { useAuthStore } from '../../store/authStore';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

const TicketsList: React.FC = () => {
    const { user } = useAuthStore();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [activeTab, setActiveTab] = useState('open');
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

    // ===== مودال‌ها =====
    const [detailVisible, setDetailVisible] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [replyLoading, setReplyLoading] = useState(false);
    const [replyForm] = Form.useForm();

    const [newTicketVisible, setNewTicketVisible] = useState(false);
    const [ticketForm] = Form.useForm();
    const [ticketLoading, setTicketLoading] = useState(false);

    // ===== داده‌های آزمایشی =====
    const mockTickets: Ticket[] = [
        {
            id: 1,
            title: 'مشکل در ثبت درخواست مرخصی',
            message: 'سلام. من نمی‌توانم درخواست مرخصی ثبت کنم. خطای ۵۰۰ دریافت می‌کنم.',
            sender_id: 2,
            sender_name: 'رضا احمدی',
            receiver_id: 1,
            receiver_name: 'مدیر سیستم',
            status: 'open',
            priority: 'important',
            message_type: 'ticket',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            reply_count: 2,
            replies: [
                {
                    id: 1,
                    ticket_id: 1,
                    user_id: 1,
                    user_name: 'مدیر سیستم',
                    message: 'در حال بررسی مشکل هستیم. لطفاً صبر کنید.',
                    is_admin_reply: true,
                    created_at: new Date(Date.now() - 3600000).toISOString(),
                },
                {
                    id: 2,
                    ticket_id: 1,
                    user_id: 2,
                    user_name: 'رضا احمدی',
                    message: 'ممنون. منتظر پاسخ شما هستم.',
                    is_admin_reply: false,
                    created_at: new Date(Date.now() - 1800000).toISOString(),
                },
            ],
        },
        {
            id: 2,
            title: 'درخواست تغییر رمز عبور',
            message: 'سلام. لطفاً رمز عبور من را بازنشانی کنید.',
            sender_id: 3,
            sender_name: 'سارا کریمی',
            receiver_id: 1,
            receiver_name: 'مدیر سیستم',
            status: 'in_progress',
            priority: 'normal',
            message_type: 'ticket',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            updated_at: new Date(Date.now() - 86400000).toISOString(),
            reply_count: 0,
            replies: [],
        },
        {
            id: 3,
            title: 'گزارش خطا در سیستم',
            message: 'سیستم به کندی کار می‌کند و گاهی اوقات قطع می‌شود.',
            sender_id: 4,
            sender_name: 'محمد محمدی',
            receiver_id: 1,
            receiver_name: 'مدیر سیستم',
            status: 'closed',
            priority: 'urgent',
            message_type: 'ticket',
            created_at: new Date(Date.now() - 172800000).toISOString(),
            updated_at: new Date(Date.now() - 172800000).toISOString(),
            reply_count: 1,
            replies: [
                {
                    id: 3,
                    ticket_id: 3,
                    user_id: 1,
                    user_name: 'مدیر سیستم',
                    message: 'مشکل برطرف شد. سرور ری‌استارت شد.',
                    is_admin_reply: true,
                    created_at: new Date(Date.now() - 86400000).toISOString(),
                },
            ],
        },
    ];

    // ===== بارگذاری داده‌ها =====
    useEffect(() => {
        fetchTickets();
    }, [activeTab, pagination.current]);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            // استفاده از داده‌های آزمایشی
            setTickets(mockTickets);
            setPagination({
                ...pagination,
                total: mockTickets.length,
            });
        } catch (error) {
            console.error('Error fetching tickets:', error);
            message.error('خطا در دریافت تیکت‌ها');
        } finally {
            setLoading(false);
        }
    };

    // ===== نمایش جزئیات =====
    const showDetail = (record: Ticket) => {
        setSelectedTicket(record);
        setDetailVisible(true);
        replyForm.resetFields();
    };

    // ===== ارسال پاسخ =====
    const handleReply = async (values: { message: string }) => {
        if (!selectedTicket) return;
        try {
            setReplyLoading(true);
            // شبیه‌سازی ارسال پاسخ
            const newReply: TicketReply = {
                id: Date.now(),
                ticket_id: selectedTicket.id,
                user_id: user?.id || 1,
                user_name: user?.full_name || 'کاربر',
                message: values.message,
                is_admin_reply: user?.role === 'admin',
                created_at: new Date().toISOString(),
            };
            
            // به‌روزرسانی تیکت
            const updatedTicket = { ...selectedTicket };
            if (!updatedTicket.replies) {
                updatedTicket.replies = [];
            }
            updatedTicket.replies.push(newReply);
            updatedTicket.reply_count = (updatedTicket.reply_count || 0) + 1;
            setSelectedTicket(updatedTicket);
            
            message.success('پاسخ با موفقیت ارسال شد');
            replyForm.resetFields();
            fetchTickets();
        } catch (error: any) {
            console.error('Error replying to ticket:', error);
            message.error(error.response?.data?.message || 'خطا در ارسال پاسخ');
        } finally {
            setReplyLoading(false);
        }
    };

    // ===== ایجاد تیکت جدید =====
    const handleCreateTicket = async (values: any) => {
        try {
            setTicketLoading(true);
            const newTicket: Ticket = {
                id: Date.now(),
                title: values.title,
                message: values.message,
                sender_id: user?.id || 1,
                sender_name: user?.full_name || 'کاربر',
                receiver_id: values.receiver_id || 1,
                receiver_name: 'مدیر سیستم',
                status: 'open',
                priority: values.priority || 'normal',
                message_type: 'ticket',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                reply_count: 0,
                replies: [],
            };
            
            setTickets([newTicket, ...tickets]);
            message.success('تیکت با موفقیت ایجاد شد');
            setNewTicketVisible(false);
            ticketForm.resetFields();
            fetchTickets();
        } catch (error: any) {
            console.error('Error creating ticket:', error);
            message.error(error.response?.data?.message || 'خطا در ایجاد تیکت');
        } finally {
            setTicketLoading(false);
        }
    };

    // ===== حذف تیکت =====
    const handleDeleteTicket = async (id: number, title: string) => {
        try {
            setTickets(tickets.filter(t => t.id !== id));
            message.success(`تیکت "${title}" با موفقیت حذف شد`);
            fetchTickets();
        } catch (error: any) {
            console.error('Error deleting ticket:', error);
            message.error(error.response?.data?.message || 'خطا در حذف تیکت');
        }
    };

    // ===== فیلترها =====
    const handleSearch = (value: string) => {
        setSearchText(value);
    };

    const handleRefresh = () => {
        fetchTickets();
        message.success('اطلاعات به‌روزرسانی شد');
    };

    const handleTabChange = (key: string) => {
        setActiveTab(key);
        setPagination({ ...pagination, current: 1 });
    };

    // ===== وضعیت‌ها =====
    const getStatusBadge = (status: string) => {
        const map: Record<string, { color: string; text: string; status: 'default' | 'processing' | 'success' | 'warning' | 'error' }> = {
            open: { color: 'gold', text: 'باز', status: 'warning' },
            in_progress: { color: 'processing', text: 'در حال بررسی', status: 'processing' },
            closed: { color: 'green', text: 'بسته', status: 'success' },
        };
        return map[status] || { color: 'default', text: status, status: 'default' };
    };

    const getPriorityBadge = (priority: string) => {
        const map: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
            normal: { color: 'blue', text: 'عادی', icon: <MailOutlined /> },
            important: { color: 'orange', text: 'مهم', icon: <ExclamationCircleOutlined /> },
            urgent: { color: 'red', text: 'فوری', icon: <CloseCircleOutlined /> },
        };
        return map[priority] || { color: 'default', text: priority, icon: null };
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
            render: (text: string, record: Ticket) => (
                <Space>
                    <Text strong>{text}</Text>
                    {record.reply_count && record.reply_count > 0 && (
                        <Badge count={record.reply_count} size="small" />
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
            title: 'گیرنده',
            dataIndex: 'receiver_name',
            key: 'receiver_name',
            render: (text: string) => <Tag color="blue">{text}</Tag>,
        },
        {
            title: 'اولویت',
            dataIndex: 'priority',
            key: 'priority',
            render: (priority: string) => {
                const info = getPriorityBadge(priority);
                return <Tag color={info.color} icon={info.icon}>{info.text}</Tag>;
            },
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
            title: 'تاریخ',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date: string) => new Date(date).toLocaleDateString('fa-IR'),
        },
        {
            title: 'عملیات',
            key: 'actions',
            render: (_: any, record: Ticket) => (
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
                            title="حذف تیکت"
                            description={`آیا از حذف تیکت "${record.title}" اطمینان دارید؟`}
                            onConfirm={() => handleDeleteTicket(record.id, record.title)}
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
    const getFilteredData = () => {
        let filtered = tickets;
        
        // فیلتر بر اساس تب
        if (activeTab !== 'all') {
            filtered = filtered.filter(t => t.status === activeTab);
        }
        
        // فیلتر بر اساس جستجو
        if (searchText) {
            filtered = filtered.filter(t =>
                t.title.includes(searchText) ||
                t.sender_name.includes(searchText) ||
                t.receiver_name.includes(searchText)
            );
        }
        
        return filtered;
    };

    const filteredData = getFilteredData();

    // ===== آمار =====
    const stats = {
        open: tickets.filter(t => t.status === 'open').length,
        in_progress: tickets.filter(t => t.status === 'in_progress').length,
        closed: tickets.filter(t => t.status === 'closed').length,
        total: tickets.length,
    };

    // ===== نمایش =====
    return (
        <div style={{ padding: 24 }}>
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                        <Title level={4} style={{ margin: 0 }}>🎫 مدیریت تیکت‌ها</Title>
                        <Text type="secondary">{pagination.total} تیکت</Text>
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
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => setNewTicketVisible(true)}>
                            تیکت جدید
                        </Button>
                    </Space>
                </div>

                <Tabs activeKey={activeTab} onChange={handleTabChange}>
                    <TabPane tab={`🟡 باز (${stats.open})`} key="open" />
                    <TabPane tab={`🔵 در حال بررسی (${stats.in_progress})`} key="in_progress" />
                    <TabPane tab={`🟢 بسته (${stats.closed})`} key="closed" />
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
                        showTotal: (total) => `${total} تیکت`,
                        position: ['bottomRight'],
                    }}
                    onChange={(newPagination) => {
                        setPagination({ ...pagination, current: newPagination.current || 1, pageSize: newPagination.pageSize || 10 });
                    }}
                    bordered={false}
                />
            </Card>

            {/* ===== مودال جزئیات تیکت ===== */}
            <Modal
                title={`جزئیات تیکت: ${selectedTicket?.title}`}
                open={detailVisible}
                onCancel={() => {
                    setDetailVisible(false);
                    setSelectedTicket(null);
                    replyForm.resetFields();
                }}
                footer={null}
                width={700}
                destroyOnClose
            >
                {selectedTicket && (
                    <div>
                        <div style={{ marginBottom: 16 }}>
                            <Space>
                                <Tag color="blue">{selectedTicket.sender_name}</Tag>
                                <Text>→</Text>
                                <Tag color="green">{selectedTicket.receiver_name}</Tag>
                                <Badge
                                    status={getStatusBadge(selectedTicket.status).status}
                                    text={getStatusBadge(selectedTicket.status).text}
                                />
                                <Tag color={getPriorityBadge(selectedTicket.priority).color}>
                                    {getPriorityBadge(selectedTicket.priority).text}
                                </Tag>
                            </Space>
                            <div style={{ marginTop: 8, color: '#888', fontSize: 12 }}>
                                {new Date(selectedTicket.created_at).toLocaleString('fa-IR')}
                            </div>
                        </div>

                        <Card size="small" style={{ marginBottom: 16, background: '#f5f5f5' }}>
                            <Text>{selectedTicket.message}</Text>
                        </Card>

                        <Divider>پاسخ‌ها</Divider>

                        <Timeline>
                            {selectedTicket.replies?.map((reply) => (
                                <Timeline.Item
                                    key={reply.id}
                                    color={reply.is_admin_reply ? 'blue' : 'green'}
                                >
                                    <div>
                                        <Space>
                                            <Text strong>{reply.user_name}</Text>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                {new Date(reply.created_at).toLocaleString('fa-IR')}
                                            </Text>
                                            {reply.is_admin_reply && (
                                                <Tag color="blue">پاسخ ادمین</Tag>
                                            )}
                                        </Space>
                                        <div style={{ marginTop: 4 }}>{reply.message}</div>
                                    </div>
                                </Timeline.Item>
                            ))}
                            {!selectedTicket.replies?.length && (
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

            {/* ===== مودال تیکت جدید ===== */}
            <Modal
                title="➕ تیکت جدید"
                open={newTicketVisible}
                onCancel={() => {
                    setNewTicketVisible(false);
                    ticketForm.resetFields();
                }}
                footer={null}
                width={600}
                destroyOnClose
            >
                <Spin spinning={ticketLoading}>
                    <Form form={ticketForm} layout="vertical" onFinish={handleCreateTicket}>
                        <Form.Item
                            name="title"
                            label="عنوان"
                            rules={[{ required: true, message: 'لطفاً عنوان را وارد کنید' }]}
                        >
                            <Input placeholder="عنوان تیکت" />
                        </Form.Item>

                        <Form.Item
                            name="message"
                            label="متن"
                            rules={[{ required: true, message: 'لطفاً متن را وارد کنید' }]}
                        >
                            <TextArea rows={4} placeholder="متن تیکت..." />
                        </Form.Item>

                        <Form.Item
                            name="priority"
                            label="اولویت"
                            rules={[{ required: true, message: 'لطفاً اولویت را انتخاب کنید' }]}
                            initialValue="normal"
                        >
                            <Select>
                                <Option value="normal">عادی</Option>
                                <Option value="important">مهم</Option>
                                <Option value="urgent">فوری</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="receiver_id"
                            label="گیرنده"
                            rules={[{ required: true, message: 'لطفاً گیرنده را انتخاب کنید' }]}
                        >
                            <Select placeholder="انتخاب گیرنده">
                                <Option value={1}>ادمین</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item>
                            <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Button onClick={() => {
                                    setNewTicketVisible(false);
                                    ticketForm.resetFields();
                                }}>
                                    انصراف
                                </Button>
                                <Button type="primary" htmlType="submit" loading={ticketLoading}>
                                    ارسال تیکت
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Spin>
            </Modal>
        </div>
    );
};

export default TicketsList;