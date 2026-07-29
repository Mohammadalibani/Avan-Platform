// frontend/src/components/Profile/DocumentsSection.tsx
import React, { useState, useEffect } from 'react';
import {
    Card,
    Table,
    Button,
    Modal,
    Form,
    Select,
    Input,
    Upload,
    message,
    Spin,
    Tag,
    Space,
    Typography,
    Tooltip,
    Popconfirm,
    Image,
} from 'antd';
import {
    UploadOutlined,
    DeleteOutlined,
    EyeOutlined,
    FileImageOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined,
    ReloadOutlined,
} from '@ant-design/icons';
import { documentsApi, UserDocument } from '../../api/documents';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const DocumentsSection: React.FC = () => {
    const [documents, setDocuments] = useState<UserDocument[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // ===== مودال‌ها =====
    const [uploadModalVisible, setUploadModalVisible] = useState(false);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [form] = Form.useForm();

    // ===== بارگذاری مدارک =====
    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const res = await documentsApi.getMyDocuments();
            if (res.data.success) {
                setDocuments(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching documents:', error);
            message.error('خطا در دریافت مدارک');
        } finally {
            setLoading(false);
        }
    };

    // ===== آپلود مدرک =====
    const handleUpload = async (values: any) => {
        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('doc_type', values.doc_type);
            formData.append('doc_title', values.doc_title || '');
            formData.append('file', values.file[0].originFileObj);

            const res = await documentsApi.uploadDocument(formData);
            if (res.data.success) {
                message.success('مدرک با موفقیت آپلود شد');
                setUploadModalVisible(false);
                form.resetFields();
                fetchDocuments();
            }
        } catch (error: any) {
            console.error('Error uploading document:', error);
            message.error(error.response?.data?.message || 'خطا در آپلود مدرک');
        } finally {
            setUploading(false);
        }
    };

    // ===== حذف مدرک =====
    const handleDelete = async (id: number, title: string) => {
        try {
            const res = await documentsApi.deleteDocument(id);
            if (res.data.success) {
                message.success(`مدرک ${title} با موفقیت حذف شد`);
                fetchDocuments();
            }
        } catch (error: any) {
            console.error('Error deleting document:', error);
            message.error(error.response?.data?.message || 'خطا در حذف مدرک');
        }
    };

    // ===== مشاهده تصویر =====
    const handlePreview = async (filename: string) => {
        try {
            const res = await documentsApi.getDocumentImage(filename);
            const url = URL.createObjectURL(res.data);
            setPreviewImage(url);
            setPreviewVisible(true);
        } catch (error) {
            console.error('Error loading image:', error);
            message.error('خطا در بارگذاری تصویر');
        }
    };

    // ===== وضعیت مدرک =====
    const getStatusBadge = (status: string) => {
        const map: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
            pending: { color: 'gold', text: 'در انتظار تایید', icon: <ClockCircleOutlined /> },
            approved: { color: 'green', text: 'تایید شده', icon: <CheckCircleOutlined /> },
            rejected: { color: 'red', text: 'رد شده', icon: <CloseCircleOutlined /> },
        };
        return map[status] || { color: 'default', text: status, icon: null };
    };

    const getDocTypeLabel = (type: string) => {
        const map: Record<string, string> = {
            national_id: 'کارت ملی',
            birth_certificate: 'شناسنامه',
            education: 'مدرک تحصیلی',
            military: 'کارت پایان خدمت',
            police: 'سوء پیشینه',
            other: 'سایر',
        };
        return map[type] || type;
    };

    // ===== ستون‌های جدول =====
    const columns = [
        {
            title: 'ردیف',
            dataIndex: 'id',
            key: 'id',
            render: (_: any, __: any, index: number) => index + 1,
            width: 60,
        },
        {
            title: 'نوع مدرک',
            dataIndex: 'doc_type',
            key: 'doc_type',
            render: (type: string) => getDocTypeLabel(type),
        },
        {
            title: 'عنوان',
            dataIndex: 'doc_title',
            key: 'doc_title',
            render: (text: string) => text || '-',
        },
        {
            title: 'نام فایل',
            dataIndex: 'doc_original_name',
            key: 'doc_original_name',
        },
        {
            title: 'حجم',
            dataIndex: 'doc_size',
            key: 'doc_size',
            render: (size: number) => {
                if (size < 1024) return `${size} B`;
                if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
                return `${(size / (1024 * 1024)).toFixed(1)} MB`;
            },
        },
        {
            title: 'تاریخ آپلود',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date: string) => new Date(date).toLocaleDateString('fa-IR'),
        },
        {
            title: 'وضعیت',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const info = getStatusBadge(status);
                return <Tag color={info.color} icon={info.icon}>{info.text}</Tag>;
            },
        },
        {
            title: 'عملیات',
            key: 'actions',
            render: (_: any, record: UserDocument) => (
                <Space size="small">
                    <Tooltip title="مشاهده تصویر">
                        <Button
                            type="text"
                            icon={<EyeOutlined />}
                            size="small"
                            onClick={() => handlePreview(record.doc_filename)}
                        />
                    </Tooltip>
                    {record.status === 'pending' && (
                        <Tooltip title="حذف">
                            <Popconfirm
                                title="حذف مدرک"
                                description={`آیا از حذف مدرک "${record.doc_title || record.doc_type}" اطمینان دارید؟`}
                                onConfirm={() => handleDelete(record.id, record.doc_title || record.doc_type)}
                                okText="بله، حذف کن"
                                cancelText="انصراف"
                                okButtonProps={{ danger: true }}
                            >
                                <Button type="text" icon={<DeleteOutlined />} size="small" danger />
                            </Popconfirm>
                        </Tooltip>
                    )}
                </Space>
            ),
            width: 120,
        },
    ];

    // ===== آمار =====
    const stats = {
        total: documents.length,
        pending: documents.filter(d => d.status === 'pending').length,
        approved: documents.filter(d => d.status === 'approved').length,
        rejected: documents.filter(d => d.status === 'rejected').length,
    };

    // ===== Upload Props =====
    const uploadProps = {
        beforeUpload: (file: File) => {
            const isImage = file.type.startsWith('image/');
            if (!isImage) {
                message.error('فایل باید تصویر باشد (JPG, PNG, GIF)');
                return false;
            }
            const isLt5M = file.size / 1024 / 1024 < 5;
            if (!isLt5M) {
                message.error('حجم فایل باید کمتر از ۵ مگابایت باشد');
                return false;
            }
            return true;
        },
        maxCount: 1,
    };

    // ===== نمایش =====
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Space>
                    <Title level={4} style={{ margin: 0 }}>📎 مدارک</Title>
                    <Text type="secondary">({stats.total} مدرک)</Text>
                </Space>
                <Space>
                    <Tag color="gold">⏳ {stats.pending} در انتظار</Tag>
                    <Tag color="green">✅ {stats.approved} تایید شده</Tag>
                    <Tag color="red">❌ {stats.rejected} رد شده</Tag>
                    <Button
                        type="primary"
                        icon={<UploadOutlined />}
                        onClick={() => setUploadModalVisible(true)}
                    >
                        آپلود مدرک
                    </Button>
                </Space>
            </div>

            <Card>
                <Table
                    dataSource={documents}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10, showTotal: (total) => `${total} مدرک` }}
                    bordered={false}
                    locale={{ emptyText: 'هیچ مدرکی آپلود نشده است' }}
                />
            </Card>

            {/* ===== مودال آپلود مدرک ===== */}
            <Modal
                title="📤 آپلود مدرک جدید"
                open={uploadModalVisible}
                onCancel={() => {
                    setUploadModalVisible(false);
                    form.resetFields();
                }}
                footer={null}
                width={500}
                destroyOnClose
            >
                <Spin spinning={uploading}>
                    <Form form={form} layout="vertical" onFinish={handleUpload}>
                        <Form.Item
                            name="doc_type"
                            label="نوع مدرک"
                            rules={[{ required: true, message: 'لطفاً نوع مدرک را انتخاب کنید' }]}
                        >
                            <Select placeholder="انتخاب نوع مدرک">
                                <Option value="national_id">کارت ملی</Option>
                                <Option value="birth_certificate">شناسنامه</Option>
                                <Option value="education">مدرک تحصیلی</Option>
                                <Option value="military">کارت پایان خدمت</Option>
                                <Option value="police">سوء پیشینه</Option>
                                <Option value="other">سایر</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item name="doc_title" label="عنوان (اختیاری)">
                            <Input placeholder="عنوان مدرک" />
                        </Form.Item>

                        <Form.Item
                            name="file"
                            label="فایل"
                            rules={[{ required: true, message: 'لطفاً فایل را انتخاب کنید' }]}
                            valuePropName="fileList"
                            getValueFromEvent={(e) => e.fileList}
                        >
                            <Upload {...uploadProps} listType="picture">
                                <Button icon={<UploadOutlined />}>انتخاب فایل</Button>
                            </Upload>
                        </Form.Item>

                        <Form.Item>
                            <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Button onClick={() => {
                                    setUploadModalVisible(false);
                                    form.resetFields();
                                }}>
                                    انصراف
                                </Button>
                                <Button type="primary" htmlType="submit" loading={uploading}>
                                    آپلود
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Spin>
            </Modal>

            {/* ===== مودال پیش‌نمایش تصویر ===== */}
            <Modal
                title="پیش‌نمایش مدرک"
                open={previewVisible}
                onCancel={() => {
                    setPreviewVisible(false);
                    setPreviewImage('');
                }}
                footer={null}
                width={600}
            >
                <div style={{ textAlign: 'center' }}>
                    <img
                        src={previewImage}
                        alt="پیش‌نمایش مدرک"
                        style={{
                            maxWidth: '100%',
                            maxHeight: 500,
                            objectFit: 'contain',
                        }}
                    />
                </div>
            </Modal>
        </div>
    );
};

export default DocumentsSection;