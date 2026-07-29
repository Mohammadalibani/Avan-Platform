import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, message, Spin, Row, Col, Switch, Divider } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { unitSupervisorApi } from '../../../api/unitSupervisor';
import { WorkPeriod } from '../../../types';

const { Option } = Select;
const { TextArea } = Input;

interface AddPersonnelModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    unitId?: number;
    periodId?: number;
}

const AddPersonnelModal: React.FC<AddPersonnelModalProps> = ({
    visible,
    onClose,
    onSuccess,
    unitId,
    periodId,
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [periods, setPeriods] = useState<WorkPeriod[]>([]);
    const [loadingPeriods, setLoadingPeriods] = useState(false);

    useEffect(() => {
        if (visible) {
            fetchPeriods();
        }
    }, [visible]);

    const fetchPeriods = async () => {
        try {
            setLoadingPeriods(true);
            const response = await unitSupervisorApi.getWorkPeriods();
            if (response.data.success) {
                setPeriods(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching periods:', error);
        } finally {
            setLoadingPeriods(false);
        }
    };

    const handleSubmit = async (values: any) => {
        try {
            setLoading(true);
            const data = {
                ...values,
                unit_id: unitId,
                period_id: values.period_id || periodId,
            };
            const response = await unitSupervisorApi.addPersonnel(data);
            if (response.data.success) {
                message.success('پرسنل با موفقیت افزوده شد');
                form.resetFields();
                onSuccess();
                onClose();
            }
        } catch (error: any) {
            console.error('Error adding personnel:', error);
            message.error(error.response?.data?.message || 'خطا در افزودن پرسنل');
        } finally {
            setLoading(false);
        }
    };

    const dynamicFields = [
        { key: 'position', label: 'سمت', type: 'text' },
        { key: 'education', label: 'مدرک تحصیلی', type: 'text' },
        { key: 'hire_date', label: 'تاریخ استخدام', type: 'date' },
    ];

    return (
        <Modal title="افزودن پرسنل جدید" open={visible} onCancel={() => { form.resetFields(); onClose(); }} footer={null} width={700} destroyOnClose>
            <Spin spinning={loadingPeriods}>
                <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ period_id: periodId, is_active: true }}>
                    <Divider>اطلاعات پایه</Divider>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="national_code" label="کد ملی" rules={[{ required: true, message: 'لطفا کد ملی را وارد کنید' }, { len: 10, message: 'کد ملی باید ۱۰ رقم باشد' }]}>
                                <Input placeholder="۱۲۳۴۵۶۷۸۹۰" maxLength={10} dir="ltr" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="period_id" label="دوره کارکرد" rules={[{ required: true, message: 'لطفا دوره را انتخاب کنید' }]}>
                                <Select placeholder="انتخاب دوره" loading={loadingPeriods}>
                                    {periods.map((p) => (
                                        <Option key={p.id} value={p.id}>{p.title} {p.is_active && '⭐'}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="first_name" label="نام" rules={[{ required: true, message: 'لطفا نام را وارد کنید' }]}>
                                <Input placeholder="نام" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="last_name" label="نام خانوادگی" rules={[{ required: true, message: 'لطفا نام خانوادگی را وارد کنید' }]}>
                                <Input placeholder="نام خانوادگی" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="phone" label="شماره تماس">
                                <Input placeholder="۰۹۱۲۳۴۵۶۷۸۹" dir="ltr" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="is_active" label="وضعیت" valuePropName="checked">
                                <Switch checkedChildren="فعال" unCheckedChildren="غیرفعال" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Divider>اطلاعات تکمیلی</Divider>
                    <Row gutter={16}>
                        {dynamicFields.map((field) => (
                            <Col span={12} key={field.key}>
                                <Form.Item name={field.key} label={field.label}>
                                    {field.type === 'date' ? <Input placeholder="۱۴۰۴/۰۲/۰۱" /> : <Input placeholder={`${field.label} را وارد کنید`} />}
                                </Form.Item>
                            </Col>
                        ))}
                    </Row>
                    <Form.Item name="note" label="یادداشت">
                        <TextArea rows={3} placeholder="یادداشت (اختیاری)" />
                    </Form.Item>
                    <Divider />
                    <Row justify="end" gutter={8}>
                        <Col><Button onClick={() => { form.resetFields(); onClose(); }}>انصراف</Button></Col>
                        <Col><Button type="primary" htmlType="submit" loading={loading} icon={<PlusOutlined />}>ثبت درخواست</Button></Col>
                    </Row>
                </Form>
            </Spin>
        </Modal>
    );
};

export default AddPersonnelModal;