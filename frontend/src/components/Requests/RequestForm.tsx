// frontend/src/components/Requests/RequestForm.tsx
import React, { useState, useEffect } from 'react';
import {
    Card,
    Form,
    Input,
    Button,
    DatePicker,
    Select,
    message,
    Spin,
    Row,
    Col,
    Typography,
    Space,
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { requestsApi } from '../../api/requests';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface RequestFormProps {
    type: string;
    isEdit?: boolean;
    editData?: any;
    requestId?: string;
}

const RequestForm: React.FC<RequestFormProps> = ({ type, isEdit = false, editData }) => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [duration, setDuration] = useState<string>('');


const getFormConfig = () => {
    const configs: Record<string, { title: string; fields: any[] }> = {
        overtime: {
            title: '⏰ اضافه کار ساعتی',
            fields: [
                { name: 'date', label: 'تاریخ', type: 'date', required: true },
                { name: 'start_time', label: 'زمان شروع', type: 'time', required: true },
                { name: 'end_time', label: 'زمان پایان', type: 'time', required: true },
                { name: 'subject', label: 'موضوع', type: 'text', required: true },
                { name: 'description', label: 'توضیحات', type: 'textarea' },
            ],
        },
        deficiency: {
            title: '⚠️ ثبت نواقص',
            fields: [
                { name: 'date', label: 'تاریخ', type: 'date', required: true },
                { name: 'time', label: 'زمان', type: 'time', required: true },
                { name: 'deficiency_type', label: 'نوع نقص', type: 'select', required: true, options: ['ورود', 'خروج'] },
                { name: 'description', label: 'توضیحات', type: 'textarea', required: true },
            ],
        },
        annual_leave: {
            title: '🌴 مرخصی روزانه',
            fields: [
                { name: 'request_date', label: 'تاریخ درخواست', type: 'date' },
                { name: 'start_date', label: 'تاریخ شروع', type: 'date', required: true },
                { name: 'end_date', label: 'تاریخ پایان', type: 'date', required: true },
                { name: 'leave_type', label: 'نوع مرخصی', type: 'select', required: true, options: ['استحقاقی', 'استعلاجی', 'تشویقی'] },
                { name: 'description', label: 'توضیحات', type: 'textarea' },
            ],
        },
        hourly_leave: {
            title: '⏱️ مرخصی ساعتی',
            fields: [
                { name: 'request_date', label: 'تاریخ درخواست', type: 'date' },
                { name: 'start_time', label: 'زمان شروع', type: 'time', required: true },
                { name: 'end_time', label: 'زمان پایان', type: 'time', required: true },
                { name: 'leave_type', label: 'نوع مرخصی', type: 'select', required: true, options: ['استحقاقی', 'استعلاجی', 'تشویقی'] },
                { name: 'description', label: 'توضیحات', type: 'textarea' },
            ],
        },
        daily_mission: {
            title: '🚗 ماموریت روزانه',
            fields: [
                { name: 'mission_type', label: 'نوع مأموریت', type: 'select', required: true, options: ['خارج از شهر', 'داخل شهر'] },
                { name: 'subject', label: 'موضوع', type: 'text', required: true },
                { name: 'vehicle', label: 'وسیله نقلیه', type: 'text' },
                { name: 'origin', label: 'مبدأ', type: 'text', required: true },
                { name: 'destination', label: 'مقصد', type: 'text', required: true },
                { name: 'departure_date', label: 'تاریخ رفت', type: 'date', required: true },
                { name: 'return_date', label: 'تاریخ برگشت', type: 'date', required: true },
                { name: 'departure_time', label: 'زمان رفت', type: 'time' },
                { name: 'return_time', label: 'زمان برگشت', type: 'time' },
                { name: 'location', label: 'مکان', type: 'text' },
                { name: 'advance_payment', label: 'مبلغ پیش‌پرداخت', type: 'number' },
                { name: 'order_number', label: 'شماره دستور', type: 'text' },
                { name: 'travel_details', label: 'جزئیات سفر', type: 'textarea' },
                { name: 'companions', label: 'همراهان', type: 'text' },
                { name: 'description', label: 'توضیحات', type: 'textarea' },
            ],
        },
        official_mission: {
            title: '📋 ماموریت اداری',
            fields: [
                { name: 'mission_type', label: 'نوع مأموریت', type: 'select', required: true, options: ['اداری', 'فنی', 'بازرسی', 'ماموریت طرح بسیج', 'آموزشی'] },
                { name: 'date', label: 'تاریخ', type: 'date', required: true },
                { name: 'start_time', label: 'زمان شروع', type: 'time', required: true },
                { name: 'end_time', label: 'زمان پایان', type: 'time', required: true },
                { name: 'subject', label: 'موضوع', type: 'text', required: true },
                { name: 'description', label: 'توضیحات', type: 'textarea' },
            ],
        },
        arbaeen: {
            title: '🕋 سفر اربعین',
            fields: [
                { name: 'departure_date', label: 'تاریخ رفت', type: 'date', required: true },
                { name: 'return_date', label: 'تاریخ برگشت', type: 'date', required: true },
                { name: 'exit_border', label: 'مرز خروج', type: 'text', required: true },
                { name: 'entry_border', label: 'مرز ورود', type: 'text', required: true },
                { name: 'description', label: 'توضیحات', type: 'textarea' },
            ],
        },
    };
    return configs[type] || configs.overtime;
};

    const config = getFormConfig();

    // ===== محاسبه خودکار مدت =====
    const calculateDuration = (values: any) => {
        if (type === 'annual_leave' && values.start_date && values.end_date) {
            const start = dayjs(values.start_date);
            const end = dayjs(values.end_date);
            const days = end.diff(start, 'day') + 1;
            setDuration(`${days} روز`);
            return;
        }

        if ((type === 'overtime' || type === 'hourly_leave' || type === 'official_mission') &&
            values.start_time && values.end_time) {
            const start = dayjs(values.start_time, 'HH:mm');
            const end = dayjs(values.end_time, 'HH:mm');
            const diff = end.diff(start, 'minute');
            if (diff > 0) {
                const hours = Math.floor(diff / 60);
                const minutes = diff % 60;
                setDuration(`${hours} ساعت ${minutes} دقیقه`);
            } else {
                setDuration('');
            }
            return;
        }

        if ((type === 'daily_mission' || type === 'arbaeen') &&
            values.departure_date && values.return_date) {
            const start = dayjs(values.departure_date);
            const end = dayjs(values.return_date);
            const days = end.diff(start, 'day') + 1;
            setDuration(`${days} روز`);
            return;
        }

        setDuration('');
    };

    // ===== ارسال فرم =====
    const handleSubmit = async (values: any) => {
        try {
            setLoading(true);
            const data = {
                request_type: type,
                data: values,
            };

            if (isEdit && editData?.id) {
                await requestsApi.updateRequest(editData.id, data);
                message.success('درخواست با موفقیت ویرایش و ارسال مجدد شد');
            } else {
                await requestsApi.createRequest(data);
                message.success('درخواست با موفقیت ثبت شد');
            }

            navigate('/requests');
        } catch (error: any) {
            console.error('Error submitting request:', error);
            message.error(error.response?.data?.message || 'خطا در ثبت درخواست');
        } finally {
            setLoading(false);
        }
    };

    // ===== نظارت بر تغییرات فرم =====
    const handleValuesChange = (_: any, allValues: any) => {
        calculateDuration(allValues);
    };

    // ===== تنظیم مقادیر اولیه برای ویرایش =====
    useEffect(() => {
    if (isEdit && editData) {
        form.setFieldsValue(editData.data);
    }
}, [isEdit, editData, form]);

    // ===== رندر فیلد =====
    const renderField = (field: any) => {
        const commonProps = {
            style: { width: '100%' },
        };

        switch (field.type) {
            case 'date':
                return <DatePicker {...commonProps} format="YYYY/MM/DD" />;
            case 'time':
                return <DatePicker {...commonProps} picker="time" format="HH:mm" />;
            case 'select':
                return (
                    <Select {...commonProps} placeholder={`انتخاب ${field.label}`}>
                        {field.options?.map((opt: string) => (
                            <Option key={opt} value={opt}>{opt}</Option>
                        ))}
                    </Select>
                );
            case 'textarea':
                return <TextArea rows={3} placeholder={field.label} />;
            case 'number':
                return <Input type="number" placeholder={field.label} />;
            default:
                return <Input placeholder={field.label} />;
        }
    };

    return (
        <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
            <Card>
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Button
                        type="text"
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate('/requests')}
                    >
                        بازگشت به درخواست‌ها
                    </Button>

                    <Title level={3}>{config.title}</Title>

                    {duration && (
                        <div style={{ padding: 12, background: '#f0f5ff', borderRadius: 8 }}>
                            <Text strong>مدت: </Text>
                            <Text style={{ color: '#1890ff' }}>{duration}</Text>
                        </div>
                    )}

                    <Spin spinning={loading}>
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleSubmit}
                            onValuesChange={handleValuesChange}
                            initialValues={isEdit ? editData?.data : {}}
                        >
                            <Row gutter={16}>
                                {config.fields.map((field) => (
                                    <Col span={field.type === 'textarea' ? 24 : 12} key={field.name}>
                                        <Form.Item
                                            name={field.name}
                                            label={field.label}
                                            rules={[
                                                { required: field.required, message: `لطفاً ${field.label} را وارد کنید` },
                                            ]}
                                        >
                                            {renderField(field)}
                                        </Form.Item>
                                    </Col>
                                ))}
                            </Row>

                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={loading}
                                    icon={<SaveOutlined />}
                                    block
                                    size="large"
                                >
                                    {isEdit ? 'ذخیره و ارسال مجدد' : 'ثبت درخواست'}
                                </Button>
                            </Form.Item>
                        </Form>
                    </Spin>
                </Space>
            </Card>
        </div>
    );
};

export default RequestForm;