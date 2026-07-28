// frontend/src/components/NotFound/NotFound.tsx
import React from 'react';
import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Result
            status="404"
            title="۴۰۴"
            subTitle="متأسفیم، صفحه‌ای که به دنبال آن هستید وجود ندارد."
            extra={
                <Button type="primary" onClick={() => navigate('/')}>
                    بازگشت به داشبورد
                </Button>
            }
        />
    );
};

export default NotFound;