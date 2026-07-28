// frontend/src/components/Users/UserFormModal.tsx
import React, { useState } from 'react';
import { Modal, Form, Input, Select, Switch, message } from 'antd';
import { usersApi } from '../../api/users';
import { User } from '../../types';

interface UserFormModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editingUser?: User | null;
}

const UserFormModal: React.FC<UserFormModalProps> = ({
    visible,
    onClose,
    onSuccess,
    editingUser,
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const isEditing = !!editingUser;

    const handleSubmit = async (values: any) => {
        try {
            setLoading(true);
            if (isEditing) {
                await usersApi.update(editingUser.id, values);
                message.success('کاربر با موفقیت ویرایش شد');
            } else {
                await usersApi.create(values);
                message.success('کاربر با موفقیت ایجاد شد');
            }
            onSuccess();
            onClose();
            form.resetFields();
        } catch (error) {
            message.error(isEditing ? 'خطا در ویرایش کاربر' : 'خطا در ایجاد کاربر');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={isEditing ? 'ویرایش کاربر' : 'افزودن کاربر جدید'}
            open={visible}
            onCancel={() => {
                onClose();
                form.resetFields();
            }}
            onOk={form.submit}
            confirmLoading={loading}
            width={600}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={editingUser || {}}
            >
                <Form.Item
                    name="full_name"
                    label="نام کامل"
                    rules={[{ required: true, message: 'لطفاً نام کامل را وارد کنید' }]}
                >
                    <Input placeholder="نام و نام خانوادگی" />
                </Form.Item>

                <Form.Item
                    name="username"
                    label="نام کاربری"
                    rules={[{ required: true, message: 'لطفاً نام کاربری را وارد کنید' }]}
                >
                    <Input placeholder="نام کاربری" />
                </Form.Item>

                <Form.Item
                    name="national_code"
                    label="کد ملی"
                    rules={[
                        { required: true, message: 'لطفاً کد ملی را وارد کنید' },
                        { len: 10, message: 'کد ملی باید ۱۰ رقم باشد' },
                    ]}
                >
                    <Input placeholder="۱۲۳۴۵۶۷۸۹۰" maxLength={10} />
                </Form.Item>

                <Form.Item
                    name="phone"
                    label="شماره تماس"
                    rules={[{ required: true, message: 'لطفاً شماره تماس را وارد کنید' }]}
                >
                    <Input placeholder="۰۹۱۲۳۴۵۶۷۸۹" />
                </Form.Item>

                <Form.Item
                    name="email"
                    label="ایمیل"
                    rules={[{ type: 'email', message: 'ایمیل معتبر وارد کنید' }]}
                >
                    <Input placeholder="example@avan.com" />
                </Form.Item>

                <Form.Item
                    name="role"
                    label="نقش"
                    rules={[{ required: true, message: 'لطفاً نقش را انتخاب کنید' }]}
                >
                    <Select>
                        <Select.Option value="admin">مدیر</Select.Option>
                        <Select.Option value="user">کاربر</Select.Option>
                    </Select>
                </Form.Item>

                <Form.Item
                    name="is_active"
                    label="وضعیت"
                    valuePropName="checked"
                >
                    <Switch checkedChildren="فعال" unCheckedChildren="غیرفعال" />
                </Form.Item>

                {!isEditing && (
                    <Form.Item
                        name="password"
                        label="رمز عبور"
                        rules={[{ required: true, message: 'لطفاً رمز عبور را وارد کنید' }]}
                    >
                        <Input.Password placeholder="حداقل ۶ کاراکتر" />
                    </Form.Item>
                )}
            </Form>
        </Modal>
    );
};

export default UserFormModal;