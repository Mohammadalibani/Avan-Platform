import React, { useState } from 'react';
import { Modal, Form, Input, Button, message, Typography, Space, Tag, Alert } from 'antd';
import { RollbackOutlined } from '@ant-design/icons';
import { deptManagerApi } from '../../../api/deptManager';

const { Text } = Typography;
const { TextArea } = Input;

interface RevisionModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    personnelId: number;
    personnelName: string;
    unitName: string;
}

const RevisionModal: React.FC<RevisionModalProps> = ({
    visible,
    onClose,
    onSuccess,
    personnelId,
    personnelName,
    unitName,
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (values: { note: string }) => {
        if (!values.note || values.note.trim() === '') {
            message.error('لطفاً توضیحات اصلاح را وارد کنید');
            return;
        }

        try {
            setLoading(true);
            const response = await deptManagerApi.rejectWork(personnelId, values.note);

            if (response.data.success) {
                message.success(`کارکرد ${personnelName} برای اصلاح بازگشت داده شد`);
                form.resetFields();
                onSuccess();
                onClose();
            }
        } catch (error: any) {
            console.error('Error rejecting work:', error);
            message.error(error.response?.data?.message || 'خطا در اصلاح کارکرد');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="اصلاح کارکرد"
            open={visible}
            onCancel={() => {
                form.resetFields();
                onClose();
            }}
            footer={null}
            width={500}
            destroyOnClose
        >
            <div style={{ marginBottom: 16 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Space>
                        <Text strong>پرسنل:</Text>
                        <Tag color="blue">{personnelName}</Tag>
                    </Space>
                    <Space>
                        <Text strong>واحد:</Text>
                        <Tag color="green">{unitName}</Tag>
                    </Space>
                </Space>
            </div>

            <Alert
                message="اصلاح کارکرد"
                description="کارکرد این پرسنل به سرپرست واحد بازگشت داده می‌شود تا اصلاحات لازم اعمال شود."
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
            />

            <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <Form.Item
                    name="note"
                    label="توضیحات اصلاح"
                    rules={[{ required: true, message: 'لطفاً توضیحات اصلاح را وارد کنید' }]}
                >
                    <TextArea rows={4} placeholder="لطفاً توضیح دهید چه مواردی نیاز به اصلاح دارد..." />
                </Form.Item>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <Button onClick={() => { form.resetFields(); onClose(); }}>
                        انصراف
                    </Button>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        icon={<RollbackOutlined />}
                        danger
                    >
                        بازگشت به سرپرست واحد
                    </Button>
                </div>
            </Form>
        </Modal>
    );
};

export default RevisionModal;