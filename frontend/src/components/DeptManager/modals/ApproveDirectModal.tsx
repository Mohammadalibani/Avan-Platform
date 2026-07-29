import React, { useState } from 'react';
import { Modal, Form, Input, Button, message, Typography, Space, Tag, Alert } from 'antd';
import { CheckOutlined, SendOutlined } from '@ant-design/icons';
import { deptManagerApi } from '../../../api/deptManager';

const { Text } = Typography;
const { TextArea } = Input;

interface ApproveDirectModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    personnelId: number;
    personnelName: string;
    unitName: string;
    isDirect?: boolean;
}

const ApproveDirectModal: React.FC<ApproveDirectModalProps> = ({
    visible,
    onClose,
    onSuccess,
    personnelId,
    personnelName,
    unitName,
    isDirect = false,
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (values: { note?: string }) => {
        try {
            setLoading(true);
            
            let response;
            if (isDirect) {
                response = await deptManagerApi.approveDirectWork(personnelId, values.note);
            } else {
                response = await deptManagerApi.approveDeptWork(personnelId, values.note);
            }

            if (response.data.success) {
                const actionText = isDirect ? 'تایید مستقیم' : 'تایید';
                message.success(`کارکرد ${personnelName} با موفقیت ${actionText} شد`);
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
        <Modal
            title={isDirect ? 'تایید مستقیم کارکرد' : 'تایید کارکرد'}
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

            {isDirect && (
                <Alert
                    message="تایید مستقیم"
                    description="این عمل بدون نیاز به تایید سرپرست واحد انجام می‌شود و وضعیت کارکرد مستقیماً به مدیر سازمان ارسال می‌شود."
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                />
            )}

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
                        icon={isDirect ? <SendOutlined /> : <CheckOutlined />}
                    >
                        {isDirect ? 'تایید مستقیم' : 'تایید'}
                    </Button>
                </div>
            </Form>
        </Modal>
    );
};

export default ApproveDirectModal;