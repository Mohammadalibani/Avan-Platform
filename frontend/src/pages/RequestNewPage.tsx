// frontend/src/pages/RequestNewPage.tsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RequestForm from '../components/Requests/RequestForm';

const RequestNewPage: React.FC = () => {
    const { type } = useParams<{ type: string }>();
    const navigate = useNavigate();

    // تبدیل نوع درخواست به فرمت صحیح
    const getRequestType = (type: string) => {
        const typeMap: Record<string, string> = {
            'overtime': 'overtime',
            'deficiency': 'deficiency',
            'annual-leave': 'annual_leave',
            'hourly-leave': 'hourly_leave',
            'daily-mission': 'daily_mission',
            'official-mission': 'official_mission',
            'arbaeen': 'arbaeen',
        };
        return typeMap[type] || 'overtime';
    };

    if (!type) {
        navigate('/requests');
        return null;
    }

    const requestType = getRequestType(type);
    return <RequestForm type={requestType} />;
};

export default RequestNewPage;