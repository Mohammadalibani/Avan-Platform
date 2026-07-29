import React, { useState } from 'react';
import { Modal, Form, Input, Button, message, Typography, Tag, Space, Alert, Switch } from 'antd';
import { CheckOutlined, SendOutlined } from '@ant-design/icons';
import { deptManagerApi } from '../../../api/deptManager';

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
    const [isDirect, setIsDirect] = useState(false);

    const handleSubmit = async (values: { note?: string }) => {
        try {
            setLoading(true);
            
            let response;
            if (isDirect) {
                response = await deptManagerApi.approveDirectGroupWork(personnelIds, values.note);
            } else {
                response = await deptManagerApi.approveGroupWork(personnelIds, values.note);
            }

            if (response.data.success) {
                const actionText = isDirect ? 'تایید مستقیم' : 'تایید';
                message.success(`${personnelIds.length} پرسنل با موفقیت ${actionText} شدند`);
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
        <Modal
            title="تایید گروهی کارکرد"
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
                    <Text strong>تعداد پرسنل قابل تایید: {personnelIds.length}</Text>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {personnelNames.map((name, index) => (
                            <Tag key={index} color="blue">{name}</Tag>
                        ))}
                    </div>
                </Space>
            </div>

            <div style={{ marginBottom: 16 }}>
                <Space>
                    <Text strong>تایید مستقیم:</Text>
                    <Switch
                        checked={isDirect}
                        onChange={setIsDirect}
                        checkedChildren="فعال"
                        unCheckedChildren="غیرفعال"
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {isDirect ? 'بدون نیاز به تایید سرپرست' : 'نیاز به تایید سرپرست'}
                    </Text>
                </Space>
            </div>

            {isDirect && (
                <Alert
                    message="تایید مستقیم گروهی"
                    description="تمامی پرسنل انتخاب‌شده بدون نیاز به تایید سرپرست واحد، مستقیماً به مدیر سازمان ارسال می‌شوند."
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
                        {isDirect ? 'تایید مستقیم همه' : 'تایید همه'}
                    </Button>
                </div>
            </Form>
        </Modal>
    );
};

export default GroupApproveModal;