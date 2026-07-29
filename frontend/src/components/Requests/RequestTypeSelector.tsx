// frontend/src/components/Requests/RequestTypeSelector.tsx
import React from 'react';
import { Modal, Card, Row, Col, Typography } from 'antd';
import {
    ClockCircleOutlined,
    WarningOutlined,
    CalendarOutlined,
    CarOutlined,
    GlobalOutlined,
    HomeOutlined,
    ThunderboltOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

interface RequestTypeSelectorProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (type: string) => void;
}

const requestTypes = [
    { key: 'overtime', label: 'اضافه کار ساعتی', icon: <ClockCircleOutlined />, color: '#f59e0b' },
    { key: 'deficiency', label: 'ثبت نواقص', icon: <WarningOutlined />, color: '#ef4444' },
    { key: 'annual-leave', label: 'مرخصی روزانه', icon: <CalendarOutlined />, color: '#10b981' },
    { key: 'hourly-leave', label: 'مرخصی ساعتی', icon: <ThunderboltOutlined />, color: '#10b981' },
    { key: 'daily-mission', label: 'ماموریت روزانه', icon: <CarOutlined />, color: '#3b82f6' },
    { key: 'official-mission', label: 'ماموریت اداری', icon: <HomeOutlined />, color: '#3b82f6' },
    { key: 'arbaeen', label: 'سفر اربعین', icon: <GlobalOutlined />, color: '#8b5cf6' },
];

const RequestTypeSelector: React.FC<RequestTypeSelectorProps> = ({
    visible,
    onClose,
    onSelect,
}) => {
    return (
        <Modal
            title="➕ انتخاب نوع درخواست"
            open={visible}
            onCancel={onClose}
            footer={null}
            width={700}
            destroyOnClose
        >
            <Row gutter={[16, 16]}>
                {requestTypes.map((type) => (
                    <Col xs={12} sm={8} key={type.key}>
                        <Card
                            hoverable
                            onClick={() => {
                                onSelect(type.key);
                                onClose();
                            }}
                            style={{ textAlign: 'center', height: 100 }}
                            bodyStyle={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <div style={{ fontSize: 24, color: type.color }}>{type.icon}</div>
                            <Text style={{ marginTop: 8 }}>{type.label}</Text>
                        </Card>
                    </Col>
                ))}
            </Row>
        </Modal>
    );
};

export default RequestTypeSelector;