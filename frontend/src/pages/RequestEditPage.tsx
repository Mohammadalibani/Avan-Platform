// frontend/src/pages/RequestEditPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, message } from 'antd';
import RequestForm from '../components/Requests/RequestForm';
import { requestsApi } from '../api/requests';

const RequestEditPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [requestData, setRequestData] = useState<any>(null);
    const [requestType, setRequestType] = useState<string>('overtime');

    useEffect(() => {
        if (id) {
            fetchRequestData(Number(id));
        }
    }, [id]);

    const fetchRequestData = async (requestId: number) => {
        try {
            setLoading(true);
            const res = await requestsApi.getRequest(requestId);
            if (res.data.success) {
                const data = res.data.data;
                setRequestType(data.request_type);
                setRequestData(data);
            }
        } catch (error) {
            console.error('Error fetching request:', error);
            message.error('خطا در دریافت اطلاعات درخواست');
            navigate('/requests');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <RequestForm
            type={requestType}
            isEdit={true}
            editData={requestData}
            requestId={id}
        />
    );
};

export default RequestEditPage;