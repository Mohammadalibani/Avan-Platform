// frontend/src/components/Subordinate/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import {
    Card,
    Row,
    Col,
    Statistic,
    Typography,
    Spin,
    message,
    Table,
    Tag,
    Space,
    Button,
    Badge,
    Avatar,
    Divider,
    Descriptions,
    Select,
    DatePicker,
} from 'antd';
import {
    UserOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    FileTextOutlined,
    CalendarOutlined,
    TeamOutlined,
    ReloadOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';
import { subordinateApi, SubordinateStats, AttendanceRecord } from '../../api/subordinate';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const SubordinateDashboard: React.FC = () => {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<SubordinateStats | null>(null);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [filterMonth, setFilterMonth] = useState<string>('');

    // ===== بارگذاری داده‌ها =====
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                fetchStats(),
                fetchAttendance(),
            ]);
        } catch (error) {
            console.error('Error fetching data:', error);
            message.error('خطا در دریافت اطلاعات');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await subordinateApi.getStats();
            if (res.data.success) {
                setStats(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchAttendance = async (month?: string) => {
        try {
            const res = await subordinateApi.getAttendance({ month });
            if (res.data.success) {
                setAttendance(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching attendance:', error);
        }
    };

    // ===== فیلترها =====
    const handleMonthChange = (value: string) => {
        setFilterMonth(value);
        fetchAttendance(value);
    };

    const handleRefresh = () => {
        fetchData();
        message.success('اطلاعات به‌روزرسانی شد');
    };

    // ===== وضعیت حضور =====
    const getAttendanceStatus = (status: string) => {
        const map: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
            present: { color: 'green', text: 'حاضر', icon: <CheckCircleOutlined /> },
            absent: { color: 'red', text: 'غایب', icon: <CloseCircleOutlined /> },
            late: { color: 'orange', text: 'تأخیر', icon: <ClockCircleOutlined /> },
            leave: { color: 'blue', text: 'مرخصی', icon: <FileTextOutlined /> },
            holiday: { color: 'purple', text: 'تعطیل', icon: <CalendarOutlined /> },
        };
        return map[status] || { color: 'default', text: status, icon: null };
    };

    // ===== ستون‌های جدول حضور =====
    const attendanceColumns = [
        {
            title: 'ردیف',
            dataIndex: 'id',
            key: 'id',
            render: (_: any, __: any, index: number) => index + 1,
            width: 60,
        },
        {
            title: 'تاریخ',
            dataIndex: 'date',
            key: 'date',
            render: (date: string) => new Date(date).toLocaleDateString('fa-IR'),
        },
        {
            title: 'روز هفته',
            dataIndex: 'day_of_week',
            key: 'day_of_week',
        },
        {
            title: 'ساعت ورود',
            dataIndex: 'check_in',
            key: 'check_in',
            render: (time: string) => time || '-',
        },
        {
            title: 'ساعت خروج',
            dataIndex: 'check_out',
            key: 'check_out',
            render: (time: string) => time || '-',
        },
        {
            title: 'وضعیت',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const info = getAttendanceStatus(status);
                return <Tag color={info.color} icon={info.icon}>{info.text}</Tag>;
            },
        },
    ];

    // ===== داده‌های آزمایشی برای حضور =====
    const mockAttendance: AttendanceRecord[] = [
        { id: 1, date: '2026-07-26', day_of_week: 'شنبه', check_in: '08:15', check_out: '16:30', status: 'present' },
        { id: 2, date: '2026-07-25', day_of_week: 'پنج‌شنبه', check_in: '08:00', check_out: '14:00', status: 'present' },
        { id: 3, date: '2026-07-24', day_of_week: 'چهارشنبه', check_in: '08:30', check_out: '16:45', status: 'late' },
        { id: 4, date: '2026-07-23', day_of_week: 'سه‌شنبه', check_in: '', check_out: '', status: 'leave' },
        { id: 5, date: '2026-07-22', day_of_week: 'دوشنبه', check_in: '08:00', check_out: '16:30', status: 'present' },
        { id: 6, date: '2026-07-21', day_of_week: 'یک‌شنبه', check_in: '', check_out: '', status: 'holiday' },
        { id: 7, date: '2026-07-20', day_of_week: 'شنبه', check_in: '08:10', check_out: '16:20', status: 'present' },
    ];

    // ===== نمایش =====
    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div style={{ padding: 24 }}>
            {/* ===== هدر خوش‌آمدگویی ===== */}
            <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', border: 'none' }}>
                <Row gutter={16} align="middle">
                    <Col flex="auto">
                        <Space>
                            <Avatar size={64} icon={<UserOutlined />} style={{ backgroundColor: 'white', color: '#11998e' }} />
                            <div>
                                <Title level={3} style={{ color: 'white', margin: 0 }}>
                                    👋 خوش آمدید {user?.full_name} عزیز
                                </Title>
                                <Space size="large" style={{ marginTop: 8 }}>
                                    <Tag color="green">نقش: {user?.role_persian || 'کاربر عادی'}</Tag>
                                    <Tag color="cyan">
                                        عضویت: {stats?.membership_years || 0} سال {stats?.membership_months || 0} ماه {stats?.membership_days || 0} روز
                                    </Tag>
                                    <Tag color="purple">🕒 {new Date().toLocaleDateString('fa-IR')}</Tag>
                                </Space>
                            </div>
                        </Space>
                    </Col>
                    <Col>
                        <Button type="primary" ghost icon={<ReloadOutlined />} onClick={handleRefresh}>
                            به‌روزرسانی
                        </Button>
                    </Col>
                </Row>
            </Card>

            {/* ===== کارت‌های آماری ===== */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="کل درخواست‌ها"
                            value={stats?.total_requests || 0}
                            prefix={<FileTextOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="در انتظار تایید"
                            value={stats?.pending_requests || 0}
                            prefix={<ClockCircleOutlined />}
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="تایید شده"
                            value={stats?.approved_requests || 0}
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="رد شده"
                            value={stats?.rejected_requests || 0}
                            prefix={<CloseCircleOutlined />}
                            valueStyle={{ color: '#ff4d4f' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* ===== کارت اطلاعات پروفایل ===== */}
            <Card title="👤 اطلاعات پروفایل" style={{ marginBottom: 24 }}>
                <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }}>
                    <Descriptions.Item label="کد پرسنلی">{user?.personnel_code || '-'}</Descriptions.Item>
                    <Descriptions.Item label="کد ملی">{user?.national_code || '-'}</Descriptions.Item>
                    <Descriptions.Item label="نام">{user?.full_name || '-'}</Descriptions.Item>
                    <Descriptions.Item label="شماره تماس">{user?.phone || '-'}</Descriptions.Item>
                    <Descriptions.Item label="نقش">{user?.role_persian || '-'}</Descriptions.Item>
                    <Descriptions.Item label="وضعیت">
                        <Badge status={user?.is_active ? 'success' : 'error'} text={user?.is_active ? 'فعال' : 'غیرفعال'} />
                    </Descriptions.Item>
                    <Descriptions.Item label="تاریخ عضویت">
                        {user?.created_at ? new Date(user.created_at).toLocaleDateString('fa-IR') : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="آخرین ورود">
                        {user?.last_login ? new Date(user.last_login).toLocaleString('fa-IR') : 'اولین ورود'}
                    </Descriptions.Item>
                    <Descriptions.Item label="نام کاربری">{user?.username || '-'}</Descriptions.Item>
                </Descriptions>
            </Card>

            {/* ===== بخش حضور و غیاب ===== */}
            <Card
                title="📋 حضور و غیاب"
                extra={
                    <Space>
                        <Select
                            style={{ width: 150 }}
                            placeholder="انتخاب ماه"
                            value={filterMonth}
                            onChange={handleMonthChange}
                            allowClear
                        >
                            <Option value="1404/01">فروردین ۱۴۰۴</Option>
                            <Option value="1404/02">اردیبهشت ۱۴۰۴</Option>
                            <Option value="1404/03">خرداد ۱۴۰۴</Option>
                            <Option value="1404/04">تیر ۱۴۰۴</Option>
                            <Option value="1404/05">مرداد ۱۴۰۴</Option>
                        </Select>
                        <Button icon={<ReloadOutlined />} onClick={() => fetchAttendance(filterMonth)} />
                    </Space>
                }
            >
                <Table
                    dataSource={mockAttendance}
                    columns={attendanceColumns}
                    rowKey="id"
                    pagination={{ pageSize: 10, showTotal: (total) => `${total} رکورد` }}
                    bordered={false}
                />
            </Card>
        </div>
    );
};

export default SubordinateDashboard;