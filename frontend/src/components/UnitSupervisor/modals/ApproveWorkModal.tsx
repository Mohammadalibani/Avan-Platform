import React, { useState } from 'react';
import { Modal, Form, Input, Button, message, Typography, Space, Tag } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { unitSupervisorApi } from '../../../api/unitSupervisor';

const { Text } = Typography;
const { TextArea } = Input;

interface ApproveWorkModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    personnelId: number;
    personnelName: string;
}

const ApproveWorkModal: React.FC<ApproveWorkModalProps> = ({
    visible,
    onClose,
    onSuccess,
    personnelId,
    personnelName,
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (values: { note?: string }) => {
        try {
            setLoading(true);
            const response = await unitSupervisorApi.approvePersonnelWork(personnelId, values.note);
            if (response.data.success) {
                message.success('کارکرد با موفقیت تایید شد');
                form.resetFields();
                onSuccess();
                onClose();
            }
        } catch (error: any) {
            console.error('Error approving work:', error);
            message.error(error.response?.data?.message || 'خطا در تایید کارکرد');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal title="تایید کارکرد" open={visible} onCancel={() => { form.resetFields(); onClose(); }} footer={null} width={500} destroyOnClose>
            <div style={{ marginBottom: 16 }}>
                <Space>
                    <Text strong>پرسنل:</Text>
                    <Tag color="blue">{personnelName}</Tag>
                </Space>
            </div>
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <Form.Item name="note" label="توضیحات (اختیاری)">
                    <TextArea rows={3} placeholder="توضیحات..." />
                </Form.Item>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <Button onClick={() => { form.resetFields(); onClose(); }}>انصراف</Button>
                    <Button type="primary" htmlType="submit" loading={loading} icon={<CheckOutlined />}>تایید</Button>
                </div>
            </Form>
        </Modal>
    );
};

export default ApproveWorkModal;