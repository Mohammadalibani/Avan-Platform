// frontend/src/components/Users/UsersList.tsx
import React, { useEffect, useState } from 'react';
import { Table, Tag, Typography, Card } from 'antd';
import { usersApi } from '../../api/users';
import { User } from '../../types';
import toast from 'react-hot-toast';

const { Title } = Typography;

const UsersList: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await usersApi.getAll();
            setUsers(response.data.data || []);
        } catch (error) {
            toast.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Username',
            dataIndex: 'username',
            key: 'username',
        },
        {
            title: 'Full Name',
            dataIndex: 'full_name',
            key: 'full_name',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Status',
            dataIndex: 'is_active',
            key: 'is_active',
            render: (isActive: boolean) => (
                <Tag color={isActive ? 'green' : 'red'}>
                    {isActive ? 'Active' : 'Inactive'}
                </Tag>
            ),
        },
        {
            title: 'Roles',
            dataIndex: 'roles',
            key: 'roles',
            render: (roles: string[]) => (
                <>
                    {roles?.map((role) => (
                        <Tag key={role} color="blue">{role}</Tag>
                    ))}
                    {(!roles || roles.length === 0) && <span>No roles</span>}
                </>
            ),
        },
    ];

    return (
        <Card>
            <Title level={2}>Users</Title>
            <Table
                columns={columns}
                dataSource={users}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />
        </Card>
    );
};

export default UsersList;