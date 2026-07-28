import React, { useState } from 'react';
import { Modal, Form, Input, Button, message, Typography, Tag, Space } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { unitSupervisorApi } from '../../../api/unitSupervisor';

const { Text } = Typography;
const { TextArea } = Input;

interface GroupApproveModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    personnelIds: number[];
    personnelNames: string[];
}

const GroupApproveModal: React.FC<GroupApproveModalProps> = ({
    visible,
    onClose,
    onSuccess,
    personnelIds,
    personnelNames,
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (values: { note?: string }) => {
        try {
            setLoading(true);
            const response = await unitSupervisorApi.approveGroupWork(personnelIds, values.note);
            if (response.data.success) {
                message.success(`${personnelIds.length} پرسنل با موفقیت تایید شدند`);
                form.resetFields();
                onSuccess();
                onClose();
            }
        } catch (error: any) {
            console.error('Error approving group work:', error);
            message.error(error.response?.data?.message || 'خطا در تایید گروهی');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal title="تایید گروهی کارکرد" open={visible} onCancel={() => { form.resetFields(); onClose(); }} footer={null} width={600} destroyOnClose>
            <div style={{ marginBottom: 16 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>تعداد پرسنل قابل تایید: {personnelIds.length}</Text>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {personnelNames.map((name, index) => (
                            <Tag key={index} color="blue">{name}</Tag>
                        ))}
                    </div>
                </Space>
            </div>
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <Form.Item name="note" label="توضیحات (اختیاری)">
                    <TextArea rows={3} placeholder="توضیحات..." />
                </Form.Item>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <Button onClick={() => { form.resetFields(); onClose(); }}>انصراف</Button>
                    <Button type="primary" htmlType="submit" loading={loading} icon={<CheckOutlined />}>همه را تایید کن</Button>
                </div>
            </Form>
        </Modal>
    );
};

export default GroupApproveModal;