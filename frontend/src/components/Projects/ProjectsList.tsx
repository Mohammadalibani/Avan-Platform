// frontend/src/components/Projects/ProjectsList.tsx
import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Space, Typography, Card, Modal, Form, Input, Select, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { projectsApi } from '../../api/projects';
import { Project } from '../../types';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const { Title } = Typography;
const { Option } = Select;

const ProjectsList: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [form] = Form.useForm();
    const { user } = useAuthStore();

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await projectsApi.getAll();
            setProjects(response.data.data || []);
        } catch (error) {
            toast.error('Failed to fetch projects');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingProject(null);
        form.resetFields();
        form.setFieldsValue({ owner_id: user?.id, status: 'active', priority: 'medium' });
        setModalVisible(true);
    };

    const handleEdit = (project: Project) => {
        setEditingProject(project);
        form.setFieldsValue(project);
        setModalVisible(true);
    };

    const handleDelete = async (id: number) => {
        try {
            await projectsApi.delete(id);
            message.success('Project deleted successfully');
            fetchProjects();
        } catch (error) {
            message.error('Failed to delete project');
        }
    };

    const handleSubmit = async (values: any) => {
        try {
            if (editingProject) {
                await projectsApi.update(editingProject.id, values);
                message.success('Project updated successfully');
            } else {
                await projectsApi.create(values);
                message.success('Project created successfully');
            }
            setModalVisible(false);
            fetchProjects();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'green';
            case 'completed': return 'blue';
            case 'paused': return 'orange';
            default: return 'default';
        }
    };

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: Project) => (
                <Link to={`/projects/${record.id}`}>{text}</Link>
            ),
        },
        {
            title: 'Code',
            dataIndex: 'code',
            key: 'code',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
            ),
        },
        {
            title: 'Priority',
            dataIndex: 'priority',
            key: 'priority',
            render: (priority: string) => (
                <Tag color={priority === 'high' ? 'red' : priority === 'medium' ? 'orange' : 'blue'}>
                    {priority.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Tasks',
            dataIndex: 'task_count',
            key: 'task_count',
        },
        {
            title: 'Progress',
            dataIndex: 'progress',
            key: 'progress',
            render: (progress: number) => `${progress}%`,
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: Project) => (
                <Space>
                    <Button type="link" size="small" icon={<EyeOutlined />}>
                        <Link to={`/projects/${record.id}`}>View</Link>
                    </Button>
                    <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                        Edit
                    </Button>
                    <Popconfirm
                        title="Delete project"
                        description="Are you sure you want to delete this project?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={2}>Projects</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                    New Project
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={projects}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />

            <Modal
                title={editingProject ? 'Edit Project' : 'Create New Project'}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
                width={600}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    <Form.Item
                        name="name"
                        label="Project Name"
                        rules={[{ required: true, message: 'Please enter project name' }]}
                    >
                        <Input placeholder="Enter project name" />
                    </Form.Item>

                    <Form.Item
                        name="code"
                        label="Project Code"
                        rules={[{ required: true, message: 'Please enter project code' }]}
                    >
                        <Input placeholder="Enter project code (e.g., PRJ-001)" />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Description"
                    >
                        <Input.TextArea rows={3} placeholder="Enter project description" />
                    </Form.Item>

                    <Form.Item
                        name="status"
                        label="Status"
                        rules={[{ required: true }]}
                    >
                        <Select>
                            <Option value="active">Active</Option>
                            <Option value="paused">Paused</Option>
                            <Option value="completed">Completed</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="priority"
                        label="Priority"
                        rules={[{ required: true }]}
                    >
                        <Select>
                            <Option value="low">Low</Option>
                            <Option value="medium">Medium</Option>
                            <Option value="high">High</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="owner_id"
                        label="Owner"
                        hidden
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit">
                                {editingProject ? 'Update' : 'Create'}
                            </Button>
                            <Button onClick={() => setModalVisible(false)}>Cancel</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
};

export default ProjectsList;