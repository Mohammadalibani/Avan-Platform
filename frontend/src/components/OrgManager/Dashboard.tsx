// frontend/src/components/OrgManager/Dashboard.tsx
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
    Modal,
    Form,
    Alert,
    Empty,
    Collapse,
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
    CrownOutlined,
    TeamOutlined,
    BuildOutlined,
    GlobalOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';
import { orgManagerApi, OrgStats, DepartmentStats, UnitStats } from '../../api/orgManager';
import { Personnel, WorkPeriod } from '../../types';

// ===== مودال‌ها =====
import FinalApproveModal from './modals/FinalApproveModal';
import RejectToDeptModal from './modals/RejectToDeptModal';
import GroupFinalApproveModal from './modals/GroupFinalApproveModal';

const { Title, Text } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

const OrgManagerDashboard: React.FC = () => {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [periods, setPeriods] = useState<WorkPeriod[]>([]);
    const [selectedPeriod, setSelectedPeriod] = useState<number>();
    const [personnel, setPersonnel] = useState<Personnel[]>([]);
    const [stats, setStats] = useState<OrgStats | null>(null);
    const [departments, setDepartments] = useState<DepartmentStats[]>([]);
    const [selectedDepartment, setSelectedDepartment] = useState<number>();
    const [selectedUnit, setSelectedUnit] = useState<number>();
    const [searchText, setSearchText] = useState('');
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 25, total: 0 });
    const [expandedDept, setExpandedDept] = useState<number | null>(null);
    const [deptUnits, setDeptUnits] = useState<UnitStats[]>([]);
    const [unitsLoading, setUnitsLoading] = useState(false);

    // ===== State مودال‌ها =====
    const [finalModalVisible, setFinalModalVisible] = useState(false);
    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [groupFinalVisible, setGroupFinalVisible] = useState(false);
    const [selectedPersonnel, setSelectedPersonnel] = useState<{ id: number; name: string; dept: string } | null>(null);

    // ========== بارگذاری داده‌ها ==========
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            const periodsRes = await orgManagerApi.getWorkPeriods();
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
                fetchDepartments(),
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
            const res = await orgManagerApi.getOrgStats(selectedPeriod);
            if (res.data.success) {
                setStats(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchDepartments = async () => {
        try {
            const res = await orgManagerApi.getDepartments(selectedPeriod);
            if (res.data.success) {
                setDepartments(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    };

    const fetchDepartmentUnits = async (deptId: number) => {
        try {
            setUnitsLoading(true);
            const res = await orgManagerApi.getDepartmentUnits(deptId, selectedPeriod);
            if (res.data.success) {
                setDeptUnits(res.data.data);
                setExpandedDept(deptId);
            }
        } catch (error) {
            console.error('Error fetching department units:', error);
            message.error('خطا در دریافت واحدهای اداره');
        } finally {
            setUnitsLoading(false);
        }
    };

    const fetchPersonnel = async (page = 1) => {
        try {
            const res = await orgManagerApi.getOrgPersonnel({
                period_id: selectedPeriod,
                department_id: selectedDepartment,
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
        setSelectedDepartment(undefined);
        setSelectedUnit(undefined);
        setExpandedDept(null);
        fetchStats();
        fetchDepartments();
        fetchPersonnel(1);
    };

    const handleDepartmentClick = (deptId: number) => {
        if (expandedDept === deptId) {
            setExpandedDept(null);
            setDeptUnits([]);
            setSelectedDepartment(undefined);
            setSelectedUnit(undefined);
        } else {
            fetchDepartmentUnits(deptId);
            setSelectedDepartment(deptId);
            setSelectedUnit(undefined);
            fetchPersonnel(1);
        }
    };

    const handleUnitClick = (unitId: number) => {
        setSelectedUnit(unitId);
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
    const handleFinalApprove = (id: number, name: string, dept: string) => {
        setSelectedPersonnel({ id, name, dept });
        setFinalModalVisible(true);
    };

    const handleReject = (id: number, name: string, dept: string) => {
        setSelectedPersonnel({ id, name, dept });
        setRejectModalVisible(true);
    };

    const handleGroupFinalApprove = () => {
        if (selectedRowKeys.length > 0) {
            setGroupFinalVisible(true);
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
            title: 'اداره',
            dataIndex: 'department_name',
            key: 'department_name',
            render: (text: string) => <Tag color="purple">{text}</Tag>,
        },
        {
            title: 'واحد',
            dataIndex: 'unit_name',
            key: 'unit_name',
            render: (text: string) => <Tag color="blue">{text}</Tag>,
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
                const canFinalApprove = record.work_status === 'org_pending' || record.work_status === 'dept_pending';
                const canReject = record.work_status === 'org_pending' || record.work_status === 'dept_pending';
                
                return (
                    <Space size="small">
                        <Tooltip title="مشاهده">
                            <Button type="text" icon={<EyeOutlined />} size="small" />
                        </Tooltip>
                        {canFinalApprove && (
                            <Tooltip title="تایید نهایی">
                                <Button
                                    type="text"
                                    icon={<CrownOutlined />}
                                    size="small"
                                    style={{ color: '#722ed1' }}
                                    onClick={() => handleFinalApprove(record.id, record.full_name, record.department_name || '')}
                                />
                            </Tooltip>
                        )}
                        {canReject && (
                            <Tooltip title="بازگشت به مدیر اداره">
                                <Button
                                    type="text"
                                    icon={<RollbackOutlined />}
                                    size="small"
                                    style={{ color: '#faad14' }}
                                    onClick={() => handleReject(record.id, record.full_name, record.department_name || '')}
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
            key: 'final-approve',
            label: 'تایید نهایی انتخاب‌شده',
            icon: <CrownOutlined />,
            onClick: handleGroupFinalApprove,
        },
        {
            key: 'reject',
            label: 'بازگشت به مدیر اداره',
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
            <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}>
                <Row gutter={16} align="middle">
                    <Col flex="auto">
                        <Title level={3} style={{ color: 'white', margin: 0 }}>
                            👋 خوش آمدید {user?.full_name} عزیز
                        </Title>
                        <Space size="large" style={{ marginTop: 8 }}>
                            <Tag color="gold">🏢 سازمان: {stats?.period_title || '-'}</Tag>
                            <Tag color="cyan">📁 ادارات: {stats?.departments_count || 0}</Tag>
                            <Tag color="green">👥 کل پرسنل: {stats?.total_personnel || 0}</Tag>
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
                        <Text strong>اداره:</Text>
                        <Select
                            style={{ width: 180, marginLeft: 8 }}
                            allowClear
                            placeholder="همه ادارات"
                            value={selectedDepartment}
                            onChange={(value) => {
                                setSelectedDepartment(value);
                                setSelectedUnit(undefined);
                                fetchPersonnel(1);
                            }}
                        >
                            {departments.map(d => (
                                <Option key={d.id} value={d.id}>
                                    {d.name} ({d.personnel_count})
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
                            onChange={(value) => {
                                setSelectedUnit(value);
                                fetchPersonnel(1);
                            }}
                            disabled={!selectedDepartment}
                        >
                            {deptUnits.map(u => (
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
                            title="کل پرسنل سازمان"
                            value={stats?.total_personnel || 0}
                            prefix={<GlobalOutlined />}
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
                            title="تایید نهایی شده"
                            value={stats?.approved_count || 0}
                            prefix={<CrownOutlined />}
                            valueStyle={{ color: '#722ed1' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="در انتظار تایید نهایی"
                            value={stats?.pending_count || 0}
                            prefix={<ClockCircleOutlined />}
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* ===== کارت‌های ادارات ===== */}
            <Card title="ادارات سازمان" style={{ marginBottom: 24 }}>
                <Row gutter={[16, 16]}>
                    {departments.map((dept) => (
                        <Col xs={24} md={12} lg={8} key={dept.id}>
                            <Card
                                hoverable
                                onClick={() => handleDepartmentClick(dept.id)}
                                style={{
                                    border: expandedDept === dept.id ? '2px solid #722ed1' : 'none',
                                    background: expandedDept === dept.id ? '#f9f0ff' : 'white',
                                }}
                            >
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Space>
                                            <div
                                                style={{
                                                    width: 12,
                                                    height: 12,
                                                    borderRadius: '50%',
                                                    background: dept.color || '#1890ff',
                                                }}
                                            />
                                            <Text strong style={{ fontSize: 16 }}>{dept.name}</Text>
                                        </Space>
                                        <Tag color={dept.completion_rate >= 80 ? 'green' : 'orange'}>
                                            {dept.completion_rate}%
                                        </Tag>
                                    </div>
                                    <div style={{ marginTop: 8 }}>
                                        <Space>
                                            <Tag icon={<TeamOutlined />}>{dept.personnel_count} پرسنل</Tag>
                                            <Tag icon={<BuildOutlined />}>{dept.units_count} واحد</Tag>
                                        </Space>
                                    </div>
                                    <Progress percent={dept.completion_rate} size="small" />
                                    {dept.managers.length > 0 && (
                                        <div style={{ marginTop: 8 }}>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                مدیران: {dept.managers.join('، ')}
                                            </Text>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>

                {/* ===== واحدهای اداره انتخاب‌شده ===== */}
                {expandedDept && (
                    <div style={{ marginTop: 16, padding: 16, background: '#f9f0ff', borderRadius: 8 }}>
                        <Title level={5}>
                            واحدهای {departments.find(d => d.id === expandedDept)?.name}
                        </Title>
                        <Spin spinning={unitsLoading}>
                            <Row gutter={[16, 16]}>
                                {deptUnits.map((unit) => (
                                    <Col xs={24} sm={12} lg={6} key={unit.id}>
                                        <Card
                                            hoverable
                                            size="small"
                                            onClick={() => handleUnitClick(unit.id)}
                                            style={{
                                                border: selectedUnit === unit.id ? '2px solid #1890ff' : 'none',
                                            }}
                                        >
                                            <Text strong>{unit.name}</Text>
                                            <div style={{ marginTop: 4 }}>
                                                <Space>
                                                    <Tag color="blue">{unit.personnel_count} پرسنل</Tag>
                                                    <Tag color={unit.completion_rate >= 80 ? 'green' : 'orange'}>
                                                        {unit.completion_rate}%
                                                    </Tag>
                                                </Space>
                                            </div>
                                            <Progress percent={unit.completion_rate} size="small" />
                                            {unit.supervisor_names.length > 0 && (
                                                <Text type="secondary" style={{ fontSize: 11 }}>
                                                    سرپرستان: {unit.supervisor_names.join('، ')}
                                                </Text>
                                            )}
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        </Spin>
                    </div>
                )}
            </Card>

            {/* ===== جدول پرسنل ===== */}
            <Card
                title="لیست پرسنل سازمان"
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
            <FinalApproveModal
                visible={finalModalVisible}
                onClose={() => setFinalModalVisible(false)}
                onSuccess={handleRefresh}
                personnelId={selectedPersonnel?.id || 0}
                personnelName={selectedPersonnel?.name || ''}
                departmentName={selectedPersonnel?.dept || ''}
            />

            <RejectToDeptModal
                visible={rejectModalVisible}
                onClose={() => setRejectModalVisible(false)}
                onSuccess={handleRefresh}
                personnelId={selectedPersonnel?.id || 0}
                personnelName={selectedPersonnel?.name || ''}
                departmentName={selectedPersonnel?.dept || ''}
            />

            <GroupFinalApproveModal
                visible={groupFinalVisible}
                onClose={() => setGroupFinalVisible(false)}
                onSuccess={handleRefresh}
                personnelIds={selectedRowKeys as number[]}
                personnelNames={personnel
                    .filter(p => selectedRowKeys.includes(p.id))
                    .map(p => p.full_name)}
            />
        </div>
    );
};

export default OrgManagerDashboard;