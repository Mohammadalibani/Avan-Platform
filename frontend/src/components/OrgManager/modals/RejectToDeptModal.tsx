// frontend/src/components/OrgManager/modals/RejectToDeptModal.tsx
import React, { useState } from 'react';
import { Modal, Form, Input, Button, message, Typography, Space, Tag, Alert } from 'antd';
import { RollbackOutlined } from '@ant-design/icons';
import { orgManagerApi } from '../../../api/orgManager';

const { Text } = Typography;
const { TextArea } = Input;

interface RejectToDeptModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    personnelId: number;
    personnelName: string;
    departmentName: string;
}

const RejectToDeptModal: React.FC<RejectToDeptModalProps> = ({
    visible,
    onClose,
    onSuccess,
    personnelId,
    personnelName,
    departmentName,
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (values: { note: string }) => {
        if (!values.note || values.note.trim() === '') {
            message.error('لطفاً توضیحات را وارد کنید');
            return;
        }

        try {
            setLoading(true);
            const response = await orgManagerApi.rejectToDept(personnelId, values.note);

            if (response.data.success) {
                message.success(`کارکرد ${personnelName} به مدیر اداره بازگشت داده شد`);
                form.resetFields();
                onSuccess();
                onClose();
            }
        } catch (error: any) {
            console.error('Error rejecting to dept:', error);
            message.error(error.response?.data?.message || 'خطا در بازگشت کارکرد');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="بازگشت به مدیر اداره"
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
                        <Text strong>اداره:</Text>
                        <Tag color="purple">{departmentName}</Tag>
                    </Space>
                </Space>
            </div>

            <Alert
                message="بازگشت به مدیر اداره"
                description="کارکرد این پرسنل به مدیر اداره بازگشت داده می‌شود تا اصلاحات لازم اعمال شود."
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
            />

            <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <Form.Item
                    name="note"
                    label="توضیحات"
                    rules={[{ required: true, message: 'لطفاً توضیحات را وارد کنید' }]}
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
                        بازگشت به مدیر اداره
                    </Button>
                </div>
            </Form>
        </Modal>
    );
};

export default RejectToDeptModal;