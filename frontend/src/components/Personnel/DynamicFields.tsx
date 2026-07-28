// frontend/src/components/Personnel/DynamicFields.tsx
import React, { useState, useEffect } from 'react';
import { Form, Input, DatePicker, InputNumber, Select, Spin, message } from 'antd';
import { fieldsApi, DynamicField } from '../../api/fields';
import dayjs from 'dayjs';

interface DynamicFieldsProps {
    personnelId?: number;
    periodId?: number;
    values?: Record<string, any>;
    onValuesChange?: (values: Record<string, any>) => void;
    readOnly?: boolean;
}

const DynamicFields: React.FC<DynamicFieldsProps> = ({
    personnelId,
    periodId,
    values = {},
    onValuesChange,
    readOnly = false,
}) => {
    const [fields, setFields] = useState<DynamicField[]>([]);
    const [loading, setLoading] = useState(true);
    const [fieldValues, setFieldValues] = useState<Record<string, any>>(values);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchFields();
    }, []);

    useEffect(() => {
        if (values && Object.keys(values).length > 0) {
            setFieldValues(values);
            form.setFieldsValue(values);
        }
    }, [values, form]);

    const fetchFields = async () => {
        try {
            setLoading(true);
            const res = await fieldsApi.getActiveFields();
            if (res.data.success) {
                setFields(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching fields:', error);
            message.error('خطا در دریافت فیلدها');
        } finally {
            setLoading(false);
        }
    };

    const handleValueChange = (changedValues: any, allValues: any) => {
        setFieldValues(allValues);
        if (onValuesChange) {
            onValuesChange(allValues);
        }
    };

    const renderField = (field: DynamicField) => {
        const commonProps = {
            style: { width: '100%' },
            disabled: readOnly || field.is_locked,
        };

        switch (field.field_type) {
            case 'text':
                return (
                    <Form.Item
                        key={field.id}
                        name={String(field.id)}
                        label={field.title}
                        rules={[
                            { required: field.is_required, message: `لطفاً ${field.title} را وارد کنید` },
                        ]}
                    >
                        <Input {...commonProps} placeholder={field.title} />
                    </Form.Item>
                );
            
            case 'number':
                return (
                    <Form.Item
                        key={field.id}
                        name={String(field.id)}
                        label={field.title}
                        rules={[
                            { required: field.is_required, message: `لطفاً ${field.title} را وارد کنید` },
                        ]}
                    >
                        <InputNumber {...commonProps} placeholder={field.title} style={{ width: '100%' }} />
                    </Form.Item>
                );
            
            case 'date':
                return (
                    <Form.Item
                        key={field.id}
                        name={String(field.id)}
                        label={field.title}
                        rules={[
                            { required: field.is_required, message: `لطفاً ${field.title} را وارد کنید` },
                        ]}
                    >
                        <DatePicker {...commonProps} format="YYYY/MM/DD" style={{ width: '100%' }} />
                    </Form.Item>
                );
            
            case 'decimal':
                return (
                    <Form.Item
                        key={field.id}
                        name={String(field.id)}
                        label={field.title}
                        rules={[
                            { required: field.is_required, message: `لطفاً ${field.title} را وارد کنید` },
                        ]}
                    >
                        <InputNumber {...commonProps} placeholder={field.title} style={{ width: '100%' }} step={0.01} />
                    </Form.Item>
                );
            
            default:
                return null;
        }
    };

    if (loading) {
        return <Spin size="small" />;
    }

    if (fields.length === 0) {
        return <div style={{ color: '#888', textAlign: 'center', padding: 16 }}>هیچ فیلدی تعریف نشده است</div>;
    }

    return (
        <Form
            form={form}
            layout="vertical"
            onValuesChange={handleValueChange}
            initialValues={fieldValues}
        >
            {fields.map((field) => renderField(field))}
        </Form>
    );
};

export default DynamicFields;