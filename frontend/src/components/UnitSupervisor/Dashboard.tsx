// frontend/src/components/UnitSupervisor/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import {
    Card,
    Row,
    Col,
    Statistic,
    Table,
    Typography,
    Spin,
    message,
    Select,
    Button,
    Space,
    Tag,
    Badge,
    Progress,
    Input,
    Tooltip,
    Dropdown,
    MenuProps,
} from 'antd';
import {
    UserOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    FileDoneOutlined,
    ReloadOutlined,
    SearchOutlined,
    PlusOutlined,
    UploadOutlined,
    DownloadOutlined,
    MoreOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';
import { unitSupervisorApi } from '../../api/unitSupervisor';
import { Personnel, WorkPeriod, UnitStats } from '../../types';
import AddPersonnelModal from './modals/AddPersonnelModal';
import ApproveWorkModal from './modals/ApproveWorkModal';
import GroupApproveModal from './modals/GroupApproveModal';

const { Title, Text } = Typography;
const { Option } = Select;

const UnitSupervisorDashboard: React.FC = () => {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [periods, setPeriods] = useState<WorkPeriod[]>([]);
    const [selectedPeriod, setSelectedPeriod] = useState<number>();
    const [personnel, setPersonnel] = useState<Personnel[]>([]);
    const [stats, setStats] = useState<UnitStats | null>(null);
    const [searchText, setSearchText] = useState('');
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 25, total: 0 });

    // ===== State مودال‌ها =====
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [approveModalVisible, setApproveModalVisible] = useState(false);
    const [groupApproveVisible, setGroupApproveVisible] = useState(false);
    const [selectedPersonnel, setSelectedPersonnel] = useState<{ id: number; name: string } | null>(null);

    // ========== بارگذاری داده‌ها ==========
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            const periodsRes = await unitSupervisorApi.getWorkPeriods();
            if (periodsRes.data.success) {
                setPeriods(periodsRes.data.data);
                const activePeriod = periodsRes.data.data.find(p => p.is_active);
                if (activePeriod) {
                    setSelectedPeriod(activePeriod.id);
                } else if (periodsRes.data.data.length > 0) {
                    setSelectedPeriod(periodsRes.data.data[0].id);
                }
            }

            const statsRes = await unitSupervisorApi.getUnitStats(selectedPeriod);
            if (statsRes.data.success) {
                setStats(statsRes.data.data);
            }

            await fetchPersonnel();
        } catch (error) {
            console.error('Error fetching data:', error);
            message.error('خطا در دریافت اطلاعات');
        } finally {
            setLoading(false);
        }
    };

    const fetchPersonnel = async (page = 1) => {
        try {
            const response = await unitSupervisorApi.getUnitPersonnel({
                period_id: selectedPeriod,
                search: searchText || undefined,
                page,
                per_page: pagination.pageSize,
            });
            if (response.data.success) {
                setPersonnel(response.data.data.personnel);
                setPagination({
                    ...pagination,
                    current: page,
                    total: response.data.total || 0,
                });
            }
        } catch (error) {
            console.error('Error fetching personnel:', error);
            message.error('خطا در دریافت پرسنل');
        }
    };

    // ========== تغییرات ==========
    const handlePeriodChange = (value: number) => {
        setSelectedPeriod(value);
        fetchPersonnel(1);
        unitSupervisorApi.getUnitStats(value).then(res => {
            if (res.data.success) setStats(res.data.data);
        });
    };

    const handleSearch = (value: string) => {
        setSearchText(value);
        fetchPersonnel(1);
    };

    const handleTableChange = (newPagination: any) => {
        fetchPersonnel(newPagination.current);
    };

    const handleRefresh = () => {
        fetchData();
        message.success('اطلاعات به‌روزرسانی شد');
    };

    // ========== انتخاب ردیف‌ها ==========
    const rowSelection = {
        selectedRowKeys,
        onChange: (selectedKeys: React.Key[]) => {
            setSelectedRowKeys(selectedKeys);
        },
    };

    // ========== وضعیت کارکرد ==========
    const getWorkStatusBadge = (status: string) => {
        const map: Record<string, { color: string; text: string; status: 'default' | 'processing' | 'success' | 'warning' | 'error' }> = {
            draft: { color: 'default', text: 'پیش‌نویس', status: 'default' },
            unit_pending: { color: 'processing', text: 'در انتظار تایید سرپرست', status: 'processing' },
            dept_pending: { color: 'processing', text: 'در انتظار تایید مدیر اداره', status: 'processing' },
            org_pending: { color: 'processing', text: 'در انتظار تایید مدیر سازمان', status: 'processing' },
            org_approved: { color: 'success', text: 'تایید نهایی شده', status: 'success' },
            revision: { color: 'warning', text: 'نیاز به اصلاح دارد', status: 'warning' },
        };
        return map[status] || { color: 'default', text: status, status: 'default' };
    };

    // ========== ستون‌های جدول ==========
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
            width: 120,
        },
        {
            title: 'نام و نام خانوادگی',
            dataIndex: 'full_name',
            key: 'full_name',
            render: (text: string) => <Text strong>{text}</Text>,
        },
        {
            title: 'سمت',
            dataIndex: 'position',
            key: 'position',
            render: (text: string) => text || '-',
        },
        {
            title: 'وضعیت کارکرد',
            dataIndex: 'work_status',
            key: 'work_status',
            render: (status: string) => {
                const info = getWorkStatusBadge(status);
                return <Badge status={info.status} text={info.text} />;
            },
        },
        {
            title: 'عملیات',
            key: 'actions',
            render: (_: any, record: Personnel) => (
                <Space size="small">
                    <Tooltip title="مشاهده">
                        <Button type="text" icon={<EyeOutlined />} size="small" />
                    </Tooltip>
                    {(record.work_status === 'draft' || record.work_status === 'revision') && (
                        <>
                            <Tooltip title="ویرایش">
                                <Button type="text" icon={<EditOutlined />} size="small" />
                            </Tooltip>
                            <Tooltip title="تایید کارکرد">
                                <Button
                                    type="text"
                                    icon={<CheckCircleOutlined />}
                                    size="small"
                                    style={{ color: '#52c41a' }}
                                    onClick={() => {
                                        setSelectedPersonnel({ id: record.id, name: record.full_name });
                                        setApproveModalVisible(true);
                                    }}
                                />
                            </Tooltip>
                            <Tooltip title="حذف">
                                <Button type="text" icon={<DeleteOutlined />} size="small" danger />
                            </Tooltip>
                        </>
                    )}
                </Space>
            ),
            width: 180,
        },
    ];

    // ========== منوی عملیات گروهی ==========
    const groupActions: MenuProps['items'] = [
        {
            key: 'approve',
            label: 'تایید کارکرد انتخاب‌شده',
            icon: <CheckCircleOutlined />,
            onClick: () => {
                if (selectedRowKeys.length > 0) {
                    setGroupApproveVisible(true);
                }
            },
        },
        {
            key: 'delete',
            label: 'حذف انتخاب‌شده',
            icon: <DeleteOutlined />,
            danger: true,
        },
    ];

    // ========== نمایش ==========
    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div style={{ padding: 24 }}>
            {/* هدر خوش‌آمدگویی */}
            <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}>
                <Row gutter={16} align="middle">
                    <Col flex="auto">
                        <Title level={3} style={{ color: 'white', margin: 0 }}>
                            خوش آمدید {user?.full_name} عزیز
                        </Title>
                        <Space size="large" style={{ marginTop: 8 }}>
                            <Tag color="blue">اداره: {stats?.department_name || '-'}</Tag>
                            <Tag color="green">واحد: {stats?.unit_name || '-'}</Tag>
                            <Tag color="orange">دوره: {stats?.period_title || '-'}</Tag>
                            <Tag color="purple">تاریخ امروز: {new Date().toLocaleDateString('fa-IR')}</Tag>
                        </Space>
                    </Col>
                    <Col>
                        <Button type="primary" ghost icon={<ReloadOutlined />} onClick={handleRefresh}>
                            به‌روزرسانی
                        </Button>
                    </Col>
                </Row>
            </Card>

            {/* انتخاب دوره و تایید گروهی */}
            <Card style={{ marginBottom: 24 }}>
                <Row gutter={16} align="middle" justify="space-between">
                    <Col>
                        <Space>
                            <Text strong>انتخاب دوره کارکرد:</Text>
                            <Select
                                style={{ width: 200 }}
                                value={selectedPeriod}
                                onChange={handlePeriodChange}
                                placeholder="انتخاب دوره"
                            >
                                {periods.map(p => (
                                    <Option key={p.id} value={p.id}>
                                        {p.title} {p.is_active && '⭐'}
                                    </Option>
                                ))}
                            </Select>
                        </Space>
                    </Col>
                    <Col>
                        <Button
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            disabled={selectedRowKeys.length === 0}
                            onClick={() => setGroupApproveVisible(true)}
                        >
                            تایید گروهی کارکرد دوره انتخاب شده
                            {selectedRowKeys.length > 0 && ` (${selectedRowKeys.length} انتخاب)`}
                        </Button>
                    </Col>
                </Row>
            </Card>

            {/* کارت‌های آماری */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="تعداد پرسنل"
                            value={stats?.total_personnel || 0}
                            prefix={<UserOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="درصد تکمیل اطلاعات"
                            value={stats?.completion_rate || 0}
                            suffix="%"
                            prefix={<FileDoneOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                        <Progress percent={stats?.completion_rate || 0} size="small" strokeColor="#52c41a" />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="تایید شده"
                            value={stats?.approved_count || 0}
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ color: '#722ed1' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="در انتظار تایید"
                            value={stats?.pending_count || 0}
                            prefix={<ClockCircleOutlined />}
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* جدول پرسنل */}
            <Card
                title="لیست پرسنل واحد"
                extra={
                    <Space>
                        <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
                            رفرش
                        </Button>
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalVisible(true)}>
                            افزودن پرسنل
                        </Button>
                        <Button icon={<UploadOutlined />}>
                            آپلود اکسل
                        </Button>
                        <Button icon={<DownloadOutlined />}>
                            خروجی اکسل
                        </Button>
                        <Dropdown menu={{ items: groupActions }} disabled={selectedRowKeys.length === 0}>
                            <Button icon={<MoreOutlined />}>
                                عملیات گروهی {selectedRowKeys.length > 0 && `(${selectedRowKeys.length})`}
                            </Button>
                        </Dropdown>
                    </Space>
                }
            >
                <div style={{ marginBottom: 16 }}>
                    <Input.Search
                        placeholder="جستجو بر اساس نام، کد ملی، شماره تماس..."
                        allowClear
                        onSearch={handleSearch}
                        style={{ width: 350 }}
                        prefix={<SearchOutlined />}
                        enterButton
                    />
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
                    onChange={handleTableChange}
                    bordered={false}
                    scroll={{ x: 'max-content' }}
                />
            </Card>

            {/* ===== مودال‌ها ===== */}
            <AddPersonnelModal
                visible={addModalVisible}
                onClose={() => setAddModalVisible(false)}
                onSuccess={handleRefresh}
                unitId={stats?.unit_id}
                periodId={selectedPeriod}
            />

            <ApproveWorkModal
                visible={approveModalVisible}
                onClose={() => setApproveModalVisible(false)}
                onSuccess={handleRefresh}
                personnelId={selectedPersonnel?.id || 0}
                personnelName={selectedPersonnel?.name || ''}
            />

            <GroupApproveModal
                visible={groupApproveVisible}
                onClose={() => setGroupApproveVisible(false)}
                onSuccess={handleRefresh}
                personnelIds={selectedRowKeys as number[]}
                personnelNames={personnel
                    .filter(p => selectedRowKeys.includes(p.id))
                    .map(p => p.full_name)}
            />
        </div>
    );
};

export default UnitSupervisorDashboard;