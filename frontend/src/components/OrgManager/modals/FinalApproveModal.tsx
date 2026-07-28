// frontend/src/components/OrgManager/modals/FinalApproveModal.tsx
import React, { useState } from 'react';
import { Modal, Form, Input, Button, message, Typography, Space, Tag, Alert } from 'antd';
import { CrownOutlined } from '@ant-design/icons';
import { orgManagerApi } from '../../../api/orgManager';

const { Text } = Typography;
const { TextArea } = Input;

interface FinalApproveModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    personnelId: number;
    personnelName: string;
    departmentName: string;
}

const FinalApproveModal: React.FC<FinalApproveModalProps> = ({
    visible,
    onClose,
    onSuccess,
    personnelId,
    personnelName,
    departmentName,
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (values: { note?: string }) => {
        try {
            setLoading(true);
            const response = await orgManagerApi.finalApproveWork(personnelId, values.note);

            if (response.data.success) {
                message.success(`کارکرد ${personnelName} با موفقیت تایید نهایی شد`);
                form.resetFields();
                onSuccess();
                onClose();
            }
        } catch (error: any) {
                console.error('Error final approving work:', error);
                message.error(error.response?.data?.message || 'خطا در تایید نهایی کارکرد');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="تایید نهایی کارکرد"
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
                message="تایید نهایی"
                description="پس از تایید نهایی، وضعیت کارکرد این پرسنل به 'تایید نهایی شده' تغییر می‌کند و فرآیند تکمیل می‌شود."
                type="success"
                showIcon
                style={{ marginBottom: 16 }}
            />

            <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <Form.Item name="note" label="توضیحات (اختیاری)">
                    <TextArea rows={3} placeholder="توضیحات..." />
                </Form.Item>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <Button onClick={() => { form.resetFields(); onClose(); }}>
                        انصراف
                    </Button>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        icon={<CrownOutlined />}
                        style={{ background: '#722ed1', borderColor: '#722ed1' }}
                    >
                        تایید نهایی
                    </Button>
                </div>
            </Form>
        </Modal>
    );
};

export default FinalApproveModal;