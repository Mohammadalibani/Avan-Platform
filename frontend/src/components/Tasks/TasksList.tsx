// frontend/src/components/Tasks/TasksList.tsx
import React, { useEffect, useState } from 'react';
import { Table, Tag, Typography, Card, Button, Space, Modal, Form, Input, Select, DatePicker, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { tasksApi } from '../../api/tasks';
import { projectsApi } from '../../api/projects';
import { Task, Project } from '../../types';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

const TasksList: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [tasksRes, projectsRes] = await Promise.all([
                tasksApi.getAll(),
                projectsApi.getAll(),
            ]);
            setTasks(tasksRes.data.data || []);
            setProjects(projectsRes.data.data || []);
        } catch (error) {
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingTask(null);
        form.resetFields();
        form.setFieldsValue({ status: 'pending', priority: 'medium' });
        setModalVisible(true);
    };

    const handleEdit = (task: Task) => {
        setEditingTask(task);
        form.setFieldsValue({
            ...task,
            due_date: task.due_date ? dayjs(task.due_date) : null,
        });
        setModalVisible(true);
    };

    const handleDelete = async (id: number) => {
        try {
            await tasksApi.delete(id);
            message.success('Task deleted successfully');
            fetchData();
        } catch (error) {
            message.error('Failed to delete task');
        }
    };

    const handleSubmit = async (values: any) => {
        try {
            const data = {
                ...values,
                due_date: values.due_date ? values.due_date.format('YYYY-MM-DD') : null,
            };
            
            if (editingTask) {
                await tasksApi.update(editingTask.id, data);
                message.success('Task updated successfully');
            } else {
                await tasksApi.create(data);
                message.success('Task created successfully');
            }
            setModalVisible(false);
            fetchData();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'green';
            case 'in_progress': return 'orange';
            case 'pending': return 'default';
            default: return 'default';
        }
    };

    const columns = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
        },
        {
            title: 'Project',
            dataIndex: 'project_name',
            key: 'project_name',
            render: (text: string) => text || 'N/A',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={getStatusColor(status)}>{status.replace('_', ' ').toUpperCase()}</Tag>
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
            title: 'Assigned To',
            dataIndex: 'assigned_to_name',
            key: 'assigned_to_name',
            render: (text: string) => text || 'Unassigned',
        },
        {
            title: 'Due Date',
            dataIndex: 'due_date',
            key: 'due_date',
            render: (date: string) => date ? new Date(date).toLocaleDateString() : 'N/A',
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: Task) => (
                <Space>
                    <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                        Edit
                    </Button>
                    <Popconfirm
                        title="Delete task"
                        description="Are you sure you want to delete this task?"
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
                <Title level={2}>Tasks</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                    New Task
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={tasks}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />

            <Modal
                title={editingTask ? 'Edit Task' : 'Create New Task'}
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
                        name="title"
                        label="Task Title"
                        rules={[{ required: true, message: 'Please enter task title' }]}
                    >
                        <Input placeholder="Enter task title" />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Description"
                    >
                        <Input.TextArea rows={3} placeholder="Enter task description" />
                    </Form.Item>

                    <Form.Item
                        name="project_id"
                        label="Project"
                        rules={[{ required: true, message: 'Please select a project' }]}
                    >
                        <Select placeholder="Select project">
                            {projects.map((project) => (
                                <Option key={project.id} value={project.id}>
                                    {project.name} ({project.code})
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="status"
                        label="Status"
                        rules={[{ required: true }]}
                    >
                        <Select>
                            <Option value="pending">Pending</Option>
                            <Option value="in_progress">In Progress</Option>
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
                        name="estimated_hours"
                        label="Estimated Hours"
                    >
                        <Input type="number" placeholder="Enter estimated hours" />
                    </Form.Item>

                    <Form.Item
                        name="due_date"
                        label="Due Date"
                    >
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit">
                                {editingTask ? 'Update' : 'Create'}
                            </Button>
                            <Button onClick={() => setModalVisible(false)}>Cancel</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
};

export default TasksList;