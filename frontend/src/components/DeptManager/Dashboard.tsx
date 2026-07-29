// frontend/src/components/DeptManager/Dashboard.tsx
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
    Tabs,
} from 'antd';
import {
    UserOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    FileDoneOutlined,
    ReloadOutlined,
    SearchOutlined,
    PlusOutlined,
    DownloadOutlined,
    MoreOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    ApartmentOutlined,
    SendOutlined,
    RollbackOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';
import { deptManagerApi, DeptStats } from '../../api/deptManager';
import { Personnel, WorkPeriod } from '../../types';

// ===== مودال‌ها =====
import ApproveDirectModal from './modals/ApproveDirectModal';
import RevisionModal from './modals/RevisionModal';
import GroupApproveModal from './modals/GroupApproveModal';

const { Title, Text } = Typography;
const { Option } = Select;

const DeptManagerDashboard: React.FC = () => {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [periods, setPeriods] = useState<WorkPeriod[]>([]);
    const [selectedPeriod, setSelectedPeriod] = useState<number>();
    const [personnel, setPersonnel] = useState<Personnel[]>([]);
    const [stats, setStats] = useState<DeptStats | null>(null);
    const [units, setUnits] = useState<any[]>([]);
    const [searchText, setSearchText] = useState('');
    const [selectedUnit, setSelectedUnit] = useState<number>();
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 25, total: 0 });

    // ===== State مودال‌ها =====
    const [approveModalVisible, setApproveModalVisible] = useState(false);
    const [directModalVisible, setDirectModalVisible] = useState(false);
    const [revisionModalVisible, setRevisionModalVisible] = useState(false);
    const [groupApproveVisible, setGroupApproveVisible] = useState(false);
    const [selectedPersonnel, setSelectedPersonnel] = useState<{ id: number; name: string; unit: string } | null>(null);

    // ========== بارگذاری داده‌ها ==========
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            const periodsRes = await deptManagerApi.getWorkPeriods();
            if (periodsRes.data.success) {
                setPeriods(periodsRes.data.data);
                const activePeriod = periodsRes.data.data.find(p => p.is_active);
                if (activePeriod) {
                    setSelectedPeriod(activePeriod.id);
                } else if (periodsRes.data.data.length > 0) {
                    setSelectedPeriod(periodsRes.data.data[0].id);
                }
            }

            await Promise.all([
                fetchStats(),
                fetchUnits(),
                fetchPersonnel(),
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
            const res = await deptManagerApi.getDeptStats(selectedPeriod);
            if (res.data.success) {
                setStats(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchUnits = async () => {
        try {
            const res = await deptManagerApi.getDepartmentUnits(selectedPeriod);
            if (res.data.success) {
                setUnits(res.data.data.units);
            }
        } catch (error) {
            console.error('Error fetching units:', error);
        }
    };

    const fetchPersonnel = async (page = 1) => {
        try {
            const res = await deptManagerApi.getDeptPersonnel({
                period_id: selectedPeriod,
                unit_id: selectedUnit,
                search: searchText || undefined,
                page,
                per_page: pagination.pageSize,
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
        }
    };

    // ========== تغییرات ==========
    const handlePeriodChange = (value: number) => {
        setSelectedPeriod(value);
        setSelectedUnit(undefined);
        fetchStats();
        fetchUnits();
        fetchPersonnel(1);
    };

    const handleUnitChange = (value: number) => {
        setSelectedUnit(value);
        fetchPersonnel(1);
    };

    const handleSearch = (value: string) => {
        setSearchText(value);
        fetchPersonnel(1);
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

    // ========== توابع مودال‌ها ==========
    const handleApprove = (id: number, name: string, unit: string, direct: boolean = false) => {
        setSelectedPersonnel({ id, name, unit });
        if (direct) {
            setDirectModalVisible(true);
        } else {
            setApproveModalVisible(true);
        }
    };

    const handleRevision = (id: number, name: string, unit: string) => {
        setSelectedPersonnel({ id, name, unit });
        setRevisionModalVisible(true);
    };

    const handleGroupApprove = () => {
        if (selectedRowKeys.length > 0) {
            setGroupApproveVisible(true);
        }
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
            title: 'واحد',
            dataIndex: 'unit_name',
            key: 'unit_name',
            render: (text: string) => <Tag color="blue">{text}</Tag>,
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
            render: (_: any, record: Personnel) => {
                const canApprove = record.work_status === 'unit_pending' || record.work_status === 'dept_pending';
                const canDirectApprove = record.work_status === 'draft' || record.work_status === 'revision';
                const canRevision = record.work_status === 'dept_pending' || record.work_status === 'unit_pending';
                
                return (
                    <Space size="small">
                        <Tooltip title="مشاهده">
                            <Button type="text" icon={<EyeOutlined />} size="small" />
                        </Tooltip>
                        {canApprove && (
                            <Tooltip title="تایید کارکرد">
                                <Button
                                    type="text"
                                    icon={<CheckCircleOutlined />}
                                    size="small"
                                    style={{ color: '#52c41a' }}
                                    onClick={() => handleApprove(record.id, record.full_name, record.unit_name || '', false)}
                                />
                            </Tooltip>
                        )}
                        {canDirectApprove && (
                            <Tooltip title="تایید مستقیم (بدون سرپرست)">
                                <Button
                                    type="text"
                                    icon={<SendOutlined />}
                                    size="small"
                                    style={{ color: '#1890ff' }}
                                    onClick={() => handleApprove(record.id, record.full_name, record.unit_name || '', true)}
                                />
                            </Tooltip>
                        )}
                        {canRevision && (
                            <Tooltip title="اصلاح کارکرد">
                                <Button
                                    type="text"
                                    icon={<RollbackOutlined />}
                                    size="small"
                                    style={{ color: '#faad14' }}
                                    onClick={() => handleRevision(record.id, record.full_name, record.unit_name || '')}
                                />
                            </Tooltip>
                        )}
                        <Tooltip title="حذف">
                            <Button type="text" icon={<DeleteOutlined />} size="small" danger />
                        </Tooltip>
                    </Space>
                );
            },
            width: 280,
        },
    ];

    // ========== منوی عملیات گروهی ==========
    const groupActions: MenuProps['items'] = [
        {
            key: 'approve',
            label: 'تایید کارکرد انتخاب‌شده',
            icon: <CheckCircleOutlined />,
            onClick: handleGroupApprove,
        },
        {
            key: 'approve-direct',
            label: 'تایید مستقیم انتخاب‌شده',
            icon: <SendOutlined />,
            onClick: () => {
                if (selectedRowKeys.length > 0) {
                    setGroupApproveVisible(true);
                }
            },
        },
        {
            key: 'revision',
            label: 'اصلاح انتخاب‌شده',
            icon: <RollbackOutlined />,
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
            {/* ===== هدر خوش‌آمدگویی ===== */}
            <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', border: 'none' }}>
                <Row gutter={16} align="middle">
                    <Col flex="auto">
                        <Title level={3} style={{ color: 'white', margin: 0 }}>
                            👋 خوش آمدید {user?.full_name} عزیز
                        </Title>
                        <Space size="large" style={{ marginTop: 8 }}>
                            <Tag color="green">🏢 اداره: {stats?.department_name || '-'}</Tag>
                            <Tag color="cyan">📁 تعداد واحدها: {stats?.units_count || 0}</Tag>
                            <Tag color="orange">📅 دوره: {stats?.period_title || '-'}</Tag>
                            <Tag color="purple">🕒 تاریخ امروز: {new Date().toLocaleDateString('fa-IR')}</Tag>
                        </Space>
                    </Col>
                    <Col>
                        <Button type="primary" ghost icon={<ReloadOutlined />} onClick={handleRefresh}>
                            به‌روزرسانی
                        </Button>
                    </Col>
                </Row>
            </Card>

            {/* ===== فیلترها ===== */}
            <Card style={{ marginBottom: 24 }}>
                <Row gutter={16} align="middle">
                    <Col>
                        <Text strong>دوره کارکرد:</Text>
                        <Select
                            style={{ width: 180, marginLeft: 8 }}
                            value={selectedPeriod}
                            onChange={handlePeriodChange}
                        >
                            {periods.map(p => (
                                <Option key={p.id} value={p.id}>
                                    {p.title} {p.is_active && '⭐'}
                                </Option>
                            ))}
                        </Select>
                    </Col>
                    <Col>
                        <Text strong>واحد:</Text>
                        <Select
                            style={{ width: 180, marginLeft: 8 }}
                            allowClear
                            placeholder="همه واحدها"
                            value={selectedUnit}
                            onChange={handleUnitChange}
                        >
                            {units.map(u => (
                                <Option key={u.id} value={u.id}>
                                    {u.name} ({u.personnel_count})
                                </Option>
                            ))}
                        </Select>
                    </Col>
                    <Col flex="auto">
                        <Input.Search
                            placeholder="جستجو بر اساس نام، کد ملی..."
                            allowClear
                            onSearch={handleSearch}
                            style={{ width: 280 }}
                            prefix={<SearchOutlined />}
                            enterButton
                        />
                    </Col>
                    <Col>
                        <Button icon={<DownloadOutlined />}>
                            خروجی اکسل
                        </Button>
                    </Col>
                </Row>
            </Card>

            {/* ===== کارت‌های آماری ===== */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="کل پرسنل اداره"
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

            {/* ===== کارت‌های واحدها ===== */}
            <Card title="واحدهای اداره" style={{ marginBottom: 24 }}>
                <Row gutter={[16, 16]}>
                    {units.map((unit) => (
                        <Col xs={24} sm={12} lg={6} key={unit.id}>
                            <Card
                                hoverable
                                onClick={() => setSelectedUnit(unit.id)}
                                style={{
                                    border: selectedUnit === unit.id ? '2px solid #1890ff' : 'none',
                                }}
                            >
                                <div style={{ textAlign: 'center' }}>
                                    <ApartmentOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                                    <Title level={5} style={{ marginTop: 8 }}>{unit.name}</Title>
                                    <Space>
                                        <Tag color="blue">{unit.personnel_count} پرسنل</Tag>
                                        <Tag color={unit.completion_rate >= 80 ? 'green' : 'orange'}>
                                            {unit.completion_rate}%
                                        </Tag>
                                    </Space>
                                    <Progress percent={unit.completion_rate} size="small" />
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Card>

            {/* ===== جدول پرسنل ===== */}
            <Card
                title="لیست پرسنل اداره"
                extra={
                    <Space>
                        <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
                            رفرش
                        </Button>
                        <Button type="primary" icon={<PlusOutlined />}>
                            افزودن پرسنل
                        </Button>
                        <Dropdown menu={{ items: groupActions }} disabled={selectedRowKeys.length === 0}>
                            <Button icon={<MoreOutlined />}>
                                عملیات گروهی {selectedRowKeys.length > 0 && `(${selectedRowKeys.length})`}
                            </Button>
                        </Dropdown>
                    </Space>
                }
            >
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
                    onChange={(newPagination) => fetchPersonnel(newPagination.current)}
                    bordered={false}
                    scroll={{ x: 'max-content' }}
                />
            </Card>

            {/* ===== مودال‌ها ===== */}
            <ApproveDirectModal
                visible={approveModalVisible}
                onClose={() => setApproveModalVisible(false)}
                onSuccess={handleRefresh}
                personnelId={selectedPersonnel?.id || 0}
                personnelName={selectedPersonnel?.name || ''}
                unitName={selectedPersonnel?.unit || ''}
                isDirect={false}
            />

            <ApproveDirectModal
                visible={directModalVisible}
                onClose={() => setDirectModalVisible(false)}
                onSuccess={handleRefresh}
                personnelId={selectedPersonnel?.id || 0}
                personnelName={selectedPersonnel?.name || ''}
                unitName={selectedPersonnel?.unit || ''}
                isDirect={true}
            />

            <RevisionModal
                visible={revisionModalVisible}
                onClose={() => setRevisionModalVisible(false)}
                onSuccess={handleRefresh}
                personnelId={selectedPersonnel?.id || 0}
                personnelName={selectedPersonnel?.name || ''}
                unitName={selectedPersonnel?.unit || ''}
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

export default DeptManagerDashboard;