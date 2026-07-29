// frontend/src/components/Projects/ProjectDetail.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Typography, Descriptions, Tag, Spin, Button, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { projectsApi } from '../../api/projects';
import { Project } from '../../types';
import toast from 'react-hot-toast';

const { Title } = Typography;

const ProjectDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchProject(parseInt(id));
        }
    }, [id]);

    const fetchProject = async (projectId: number) => {
        try {
            const response = await projectsApi.getById(projectId);
            setProject(response.data.data);
        } catch (error) {
            toast.error('Failed to fetch project');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 50 }} />;
    }

    if (!project) {
        return <Title level={4}>Project not found</Title>;
    }

    return (
        <Card>
            <Space style={{ marginBottom: 16 }}>
                <Button icon={<ArrowLeftOutlined />}>
                    <Link to="/projects">Back to Projects</Link>
                </Button>
            </Space>
            
            <Title level={2}>{project.name}</Title>
            
            <Descriptions bordered column={2}>
                <Descriptions.Item label="Code">{project.code}</Descriptions.Item>
                <Descriptions.Item label="Status">
                    <Tag color={project.status === 'active' ? 'green' : 'blue'}>
                        {project.status.toUpperCase()}
                    </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Priority">
                    <Tag color={project.priority === 'high' ? 'red' : 'orange'}>
                        {project.priority.toUpperCase()}
                    </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Progress">{project.progress}%</Descriptions.Item>
                <Descriptions.Item label="Tasks">{project.task_count}</Descriptions.Item>
                <Descriptions.Item label="Owner">{project.owner_name || 'N/A'}</Descriptions.Item>
                {project.description && (
                    <Descriptions.Item label="Description" span={2}>
                        {project.description}
                    </Descriptions.Item>
                )}
            </Descriptions>
        </Card>
    );
};

export default ProjectDetail;