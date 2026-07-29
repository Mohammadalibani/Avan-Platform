// frontend/src/components/OrgManager/modals/GroupFinalApproveModal.tsx
import React, { useState } from 'react';
import { Modal, Form, Input, Button, message, Typography, Tag, Space, Alert } from 'antd';
import { CrownOutlined } from '@ant-design/icons';
import { orgManagerApi } from '../../../api/orgManager';

const { Text } = Typography;
const { TextArea } = Input;

interface GroupFinalApproveModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    personnelIds: number[];
    personnelNames: string[];
}

const GroupFinalApproveModal: React.FC<GroupFinalApproveModalProps> = ({
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
            const response = await orgManagerApi.finalApproveGroupWork(personnelIds, values.note);

            if (response.data.success) {
                message.success(`${personnelIds.length} پرسنل با موفقیت تایید نهایی شدند`);
                form.resetFields();
                onSuccess();
                onClose();
            }
        } catch (error: any) {
            console.error('Error final approving group work:', error);
            message.error(error.response?.data?.message || 'خطا در تایید نهایی گروهی');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="تایید نهایی گروهی کارکرد"
            open={visible}
            onCancel={() => {
                form.resetFields();
                onClose();
            }}
            footer={null}
            width={600}
            destroyOnClose
        >
            <div style={{ marginBottom: 16 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>تعداد پرسنل قابل تایید نهایی: {personnelIds.length}</Text>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {personnelNames.map((name, index) => (
                            <Tag key={index} color="blue">{name}</Tag>
                        ))}
                    </div>
                </Space>
            </div>

            <Alert
                message="تایید نهایی گروهی"
                description="تمامی پرسنل انتخاب‌شده تایید نهایی می‌شوند و فرآیند کارکرد آنها تکمیل می‌گردد."
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
                        تایید نهایی همه
                    </Button>
                </div>
            </Form>
        </Modal>
    );
};

export default GroupFinalApproveModal;