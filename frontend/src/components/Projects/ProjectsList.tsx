// frontend/src/components/Projects/ProjectsList.tsx
import React, { useState } from 'react';
import { Table, Card, Typography, Tag, Space, Button, Input, Tooltip, Popconfirm, message, Progress } from 'antd';
import { 
    SearchOutlined, 
    PlusOutlined, 
    EditOutlined, 
    DeleteOutlined, 
    EyeOutlined,
    FolderOutlined,
    ReloadOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    PlayCircleOutlined
} from '@ant-design/icons';
import { mockProjects } from '../../api/mockData';

const { Title } = Typography;
const { Search } = Input;

const ProjectsList: React.FC = () => {
    const [projects, setProjects] = useState(mockProjects);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');

    const handleDelete = (projectId: number, projectName: string) => {
        setLoading(true);
        setTimeout(() => {
            setProjects(projects.filter(p => p.id !== projectId));
            message.success(`پروژه ${projectName} با موفقیت حذف شد`);
            setLoading(false);
        }, 500);
    };

    const statusMap = {
        active: { color: 'green', icon: <PlayCircleOutlined />, label: 'فعال' },
        completed: { color: 'blue', icon: <CheckCircleOutlined />, label: 'تکمیل شده' },
        pending: { color: 'orange', icon: <ClockCircleOutlined />, label: 'در انتظار' }
    };

    const columns = [
        {
            title: 'نام پروژه',
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: any) => (
                <Space>
                    <FolderOutlined style={{ color: '#1890ff', fontSize: 20 }} />
                    <div>
                        <div style={{ fontWeight: 500 }}>{text}</div>
                        <div style={{ fontSize: 12, color: '#888' }}>{record.description}</div>
                    </div>
                </Space>
            )
        },
        {
            title: 'وضعیت',
            dataIndex: 'status',
            key: 'status',
            render: (status: keyof typeof statusMap) => {
                const info = statusMap[status];
                return (
                    <Tag icon={info.icon} color={info.color} style={{ borderRadius: 12 }}>
                        {info.label}
                    </Tag>
                );
            }
        },
        {
            title: 'پیشرفت',
            key: 'progress',
            render: () => (
                <Progress percent={Math.floor(Math.random() * 100)} size="small" />
            )
        },
        {
            title: 'تاریخ ایجاد',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (text: string) => (
                <span>{new Date(text).toLocaleDateString('fa-IR')}</span>
            )
        },
        {
            title: 'عملیات',
            key: 'actions',
            render: (_: any, record: any) => (
                <Space size="small">
                    <Tooltip title="مشاهده">
                        <Button type="text" icon={<EyeOutlined />} style={{ color: '#1890ff' }} />
                    </Tooltip>
                    <Tooltip title="ویرایش">
                        <Button type="text" icon={<EditOutlined />} style={{ color: '#faad14' }} />
                    </Tooltip>
                    <Tooltip title="حذف">
                        <Popconfirm
                            title="حذف پروژه"
                            description={`آیا از حذف پروژه "${record.name}" اطمینان دارید؟`}
                            onConfirm={() => handleDelete(record.id, record.name)}
                            okText="بله، حذف کن"
                            cancelText="انصراف"
                            okButtonProps={{ danger: true }}
                        >
                            <Button type="text" icon={<DeleteOutlined />} danger />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            )
        }
    ];

    return (
        <Card style={{ borderRadius: 16 }} bodyStyle={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <Title level={4} style={{ margin: 0 }}>مدیریت پروژه‌ها</Title>
                    <span style={{ color: '#888', fontSize: 14 }}>
                        {projects.length} پروژه
                    </span>
                </div>
                <Space>
                    <Tooltip title="بارگذاری مجدد">
                        <Button icon={<ReloadOutlined />} onClick={() => setProjects([...mockProjects])} />
                    </Tooltip>
                    <Search
                        placeholder="جستجوی پروژه..."
                        allowClear
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ width: 220 }}
                        prefix={<SearchOutlined style={{ color: '#888' }} />}
                    />
                    <Button type="primary" icon={<PlusOutlined />}>
                        پروژه جدید
                    </Button>
                </Space>
            </div>
            <Table
                dataSource={projects.filter(p => p.name.includes(searchText))}
                columns={columns}
                rowKey="id"
                loading={loading}
                pagination={{ 
                    pageSize: 8,
                    showSizeChanger: true,
                    showTotal: (total) => `${total} پروژه`
                }}
                bordered={false}
            />
        </Card>
    );
};

export default ProjectsList;