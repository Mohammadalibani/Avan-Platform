// frontend/src/components/Admin/ExcelTemplate.tsx
import React, { useState, useEffect } from 'react';
import {
    Card,
    Form,
    Input,
    Button,
    ColorPicker,
    Select,
    message,
    Spin,
    Space,
    Typography,
    Row,
    Col,
    Divider,
    Table,
    Popconfirm,
} from 'antd';
import {
    SaveOutlined,
    ReloadOutlined,
    RollbackOutlined,
} from '@ant-design/icons';
import { excelTemplateApi, ExcelTemplate as ExcelTemplateType } from '../../api/excelTemplate';

const { Title, Text } = Typography;
const { Option } = Select;

const ExcelTemplateSettings: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [template, setTemplate] = useState<ExcelTemplateType | null>(null);
    const [form] = Form.useForm();

    // ===== بارگذاری داده‌ها =====
    useEffect(() => {
        fetchTemplate();
    }, []);

    const fetchTemplate = async () => {
        try {
            setLoading(true);
            const res = await excelTemplateApi.getTemplate();
            if (res.data.success) {
                setTemplate(res.data.data);
                form.setFieldsValue(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching template:', error);
            message.error('خطا در دریافت قالب');
        } finally {
            setLoading(false);
        }
    };

    // ===== ذخیره قالب =====
    const handleSave = async (values: any) => {
        try {
            setSaving(true);
            await excelTemplateApi.updateTemplate(values);
            message.success('قالب با موفقیت ذخیره شد');
            fetchTemplate();
        } catch (error) {
            console.error('Error saving template:', error);
            message.error('خطا در ذخیره قالب');
        } finally {
            setSaving(false);
        }
    };

    // ===== بازنشانی به پیش‌فرض =====
    const handleReset = async () => {
        try {
            await excelTemplateApi.resetTemplate();
            message.success('قالب به پیش‌فرض بازنشانی شد');
            fetchTemplate();
        } catch (error) {
            console.error('Error resetting template:', error);
            message.error('خطا در بازنشانی قالب');
        }
    };

    // ===== نمونه داده برای پیش‌نمایش =====
    const previewData = [
        { id: 1, name: 'رضا احمدی', code: '1234567890', position: 'کارشناس', department: 'فناوری اطلاعات' },
        { id: 2, name: 'سارا کریمی', code: '0987654321', position: 'مدیر', department: 'منابع انسانی' },
        { id: 3, name: 'محمد محمدی', code: '1122334455', position: 'کارشناس ارشد', department: 'مالی' },
    ];

    const previewColumns = [
        { title: 'ردیف', dataIndex: 'id', key: 'id' },
        { title: 'نام', dataIndex: 'name', key: 'name' },
        { title: 'کد ملی', dataIndex: 'code', key: 'code' },
        { title: 'سمت', dataIndex: 'position', key: 'position' },
        { title: 'اداره', dataIndex: 'department', key: 'department' },
    ];

    // ===== نمایش =====
    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div style={{ padding: 24 }}>
            <Title level={3}>📊 قالب گزارش اکسل</Title>
            <Text type="secondary">شخصی‌سازی ظاهر فایل‌های خروجی Excel</Text>

            <Row gutter={16} style={{ marginTop: 16 }}>
                {/* ===== تنظیمات ===== */}
                <Col span={14}>
                    <Card>
                        <Spin spinning={saving}>
                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={handleSave}
                                initialValues={template || {}}
                            >
                                <Divider orientation="right">تنظیمات رنگ‌بندی</Divider>

                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item name="name" label="نام قالب">
                                            <Input placeholder="قالب پیش‌فرض" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="header_bg_color" label="رنگ پس‌زمینه هدر">
                                            <ColorPicker showText />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item name="header_text_color" label="رنگ متن هدر">
                                            <ColorPicker showText />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="even_row_color" label="رنگ ردیف‌های زوج">
                                            <ColorPicker showText />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item name="odd_row_color" label="رنگ ردیف‌های فرد">
                                            <ColorPicker showText />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="border_color" label="رنگ خطوط">
                                            <ColorPicker showText />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Divider orientation="right">تنظیمات خطوط</Divider>

                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item name="outer_border_style" label="خط کادر دور جدول">
                                            <Select>
                                                <Option value="thick">ضخیم</Option>
                                                <Option value="medium">متوسط</Option>
                                                <Option value="thin">نازک</Option>
                                                <Option value="double">دوخط</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="vertical_border_style" label="خطوط عمودی">
                                            <Select>
                                                <Option value="thin">نازک</Option>
                                                <Option value="medium">متوسط</Option>
                                                <Option value="dotted">چین</Option>
                                                <Option value="dashed">نقطه‌چین</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item name="horizontal_border_style" label="خطوط افقی">
                                            <Select>
                                                <Option value="dotted">نقطه‌چین</Option>
                                                <Option value="dashed">چین</Option>
                                                <Option value="thin">نازک</Option>
                                                <Option value="medium">متوسط</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="font_name" label="نام فونت">
                                            <Select>
                                                <Option value="B Nazanin">B Nazanin</Option>
                                                <Option value="Vazirmatn">Vazirmatn</Option>
                                                <Option value="IranSans">IranSans</Option>
                                                <Option value="Tahoma">Tahoma</Option>
                                                <Option value="Segoe UI">Segoe UI</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item name="header_font_size" label="سایز فونت هدر">
                                            <Input type="number" placeholder="12" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="data_font_size" label="سایز فونت داده‌ها">
                                            <Input type="number" placeholder="11" />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Form.Item>
                                    <Space>
                                        <Button type="primary" htmlType="submit" loading={saving} icon={<SaveOutlined />}>
                                             ذخیره تنظیمات
                                        </Button>
                                        <Popconfirm
                                            title="بازنشانی به پیش‌فرض"
                                            description="آیا از بازنشانی تنظیمات به پیش‌فرض اطمینان دارید؟"
                                            onConfirm={handleReset}
                                            okText="بله"
                                            cancelText="انصراف"
                                        >
                                            <Button icon={<RollbackOutlined />}>
                                                     بازنشانی به پیش‌فرض
                                            </Button>
                                        </Popconfirm>
                                    </Space>
                                </Form.Item>
                            </Form>
                        </Spin>
                    </Card>
                </Col>

                {/* ===== پیش‌نمایش ===== */}
                <Col span={10}>
                    <Card title="📋 پیش‌نمایش">
                        <div style={{ 
                            background: form.getFieldValue('header_bg_color') || '#2c3e50',
                            color: form.getFieldValue('header_text_color') || '#ffffff',
                            padding: 8,
                            borderRadius: '4px 4px 0 0',
                            fontWeight: 'bold',
                            textAlign: 'center',
                        }}>
                            {form.getFieldValue('name') || 'قالب پیش‌فرض'}
                        </div>
                        <Table
                            dataSource={previewData}
                            columns={previewColumns}
                            pagination={false}
                            size="small"
                            bordered
                            style={{ marginTop: 0 }}
                            rowClassName={(_, index) => 
                                index % 2 === 0 ? 'even-row' : 'odd-row'
                            }
                        />
                        <style>{`
                            .even-row {
                                background-color: ${form.getFieldValue('even_row_color') || '#f8f9fa'} !important;
                            }
                            .odd-row {
                                background-color: ${form.getFieldValue('odd_row_color') || '#ffffff'} !important;
                            }
                            .ant-table-thead > tr > th {
                                background-color: ${form.getFieldValue('header_bg_color') || '#2c3e50'} !important;
                                color: ${form.getFieldValue('header_text_color') || '#ffffff'} !important;
                            }
                        `}</style>
                        <div style={{ marginTop: 8, textAlign: 'center', color: '#888', fontSize: 12 }}>
                            <Text type="secondary">پیش‌نمایش با تنظیمات فعلی</Text>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default ExcelTemplateSettings;