import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import apiClient from '../../api/client';
import { Plus, Edit, Trash2, RefreshCw, UserCheck, UserX, Key } from 'lucide-react';
import toast from 'react-hot-toast';

interface User {
  id: number;
  national_code: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  role: string;
  role_persian: string;
  is_active: boolean;
  is_approved: boolean;
  department_name: string;
  unit_name: string;
  created_at: string;
  last_login: string | null;
}

const roleOptions = [
  { value: 'admin', label: 'مدیر کل سیستم' },
  { value: 'org_manager', label: 'مدیر سازمان' },
  { value: 'dept_manager', label: 'مدیر اداره' },
  { value: 'hr_manager', label: 'مدیر منابع انسانی' },
  { value: 'unit_supervisor', label: 'سرپرست واحد' },
  { value: 'subordinate', label: 'کاربر عادی' },
];

const UserList: React.FC = () => {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    national_code: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'subordinate',
    password: '',
  });

  // فیلترها
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.role) params.append('role', filters.role);
      if (filters.status) params.append('status', filters.status);
      
      const res = await apiClient.get(`/users?${params.toString()}`);
      setUsers(res.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('خطا در دریافت لیست کاربران');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const res = await apiClient.post('/users', formData);
      toast.success('کاربر با موفقیت ایجاد شد');
      setModalOpen(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'خطا در ایجاد کاربر');
    }
  };

  const handleEdit = async () => {
    if (!editingUser) return;
    try {
      await apiClient.put(`/users/${editingUser.id}`, {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        role: formData.role,
      });
      toast.success('اطلاعات کاربر با موفقیت به‌روزرسانی شد');
      setModalOpen(false);
      setEditingUser(null);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'خطا در ویرایش کاربر');
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm('آیا از حذف این کاربر مطمئن هستید؟')) return;
    try {
      await apiClient.delete(`/users/${userId}`);
      toast.success('کاربر با موفقیت حذف شد');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'خطا در حذف کاربر');
    }
  };

  const handleResetPassword = async (userId: number) => {
    if (!confirm('رمز عبور کاربر به ۴ رقم آخر کد ملی تغییر خواهد کرد. ادامه می‌دهید؟')) return;
    try {
      const res = await apiClient.post(`/users/${userId}/reset-password`);
      toast.success(`رمز عبور با موفقیت به ${res.data.new_password} تغییر یافت`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'خطا در تغییر رمز عبور');
    }
  };

  const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
    try {
      await apiClient.put(`/users/${userId}`, { is_active: !currentStatus });
      toast.success(`وضعیت کاربر با موفقیت تغییر یافت`);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'خطا در تغییر وضعیت');
    }
  };

  const resetForm = () => {
    setFormData({
      national_code: '',
      first_name: '',
      last_name: '',
      phone: '',
      role: 'subordinate',
      password: '',
    });
  };

  const openCreateModal = () => {
    resetForm();
    setEditingUser(null);
    setModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      national_code: user.national_code,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone || '',
      role: user.role,
      password: '',
    });
    setModalOpen(true);
  };

  const columns = [
    { key: 'full_name', title: 'نام و نام خانوادگی', sortable: true },
    { key: 'national_code', title: 'کد ملی', sortable: true },
    { key: 'role_persian', title: 'نقش', sortable: true },
    { key: 'department_name', title: 'اداره' },
    { key: 'unit_name', title: 'واحد' },
    {
      key: 'is_active',
      title: 'وضعیت',
      render: (item: User) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.is_active && item.is_approved ? 'bg-green-100 text-green-700' : item.is_active ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
          {item.is_active && item.is_approved ? 'فعال' : item.is_active ? 'در انتظار تایید' : 'غیرفعال'}
        </span>
      ),
    },
    {
      key: 'last_login',
      title: 'آخرین ورود',
      render: (item: User) => item.last_login || 'هرگز',
    },
  ];

  const actions = (item: User) => (
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={() => openEditModal(item)}
        className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
        title="ویرایش"
      >
        <Edit size={16} />
      </button>
      <button
        onClick={() => handleToggleStatus(item.id, item.is_active)}
        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
        title={item.is_active ? 'غیرفعال کردن' : 'فعال کردن'}
      >
        {item.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
      </button>
      <button
        onClick={() => handleResetPassword(item.id)}
        className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
        title="ریست رمز عبور"
      >
        <Key size={16} />
      </button>
      <button
        onClick={() => handleDelete(item.id)}
        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
        title="حذف"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">مدیریت کاربران</h2>
          <p className="text-slate-500 text-sm">مدیریت کاربران سامانه و دسترسی‌های آنها</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchUsers}>
            <RefreshCw size={16} className="ml-1" />
            رفرش
          </Button>
          <Button onClick={openCreateModal}>
            <Plus size={16} className="ml-1" />
            کاربر جدید
          </Button>
        </div>
      </div>

      {/* فیلترها */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-4 flex flex-wrap gap-3 items-center">
        <Input
          placeholder="جستجوی کاربر..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="max-w-xs"
        />
        <select
          value={filters.role}
          onChange={(e) => setFilters({ ...filters, role: e.target.value })}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">همه نقش‌ها</option>
          {roleOptions.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">همه وضعیت‌ها</option>
          <option value="active">فعال</option>
          <option value="inactive">غیرفعال</option>
          <option value="pending">در انتظار تایید</option>
        </select>
        <Button variant="outline" size="sm" onClick={fetchUsers}>
          اعمال فیلتر
        </Button>
      </div>

      <DataTable
        data={users}
        columns={columns}
        keyExtractor={(item) => item.id}
        loading={loading}
        searchPlaceholder="جستجوی کاربر..."
        actions={actions}
      />

      {/* مودال ایجاد/ویرایش */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingUser(null);
          resetForm();
        }}
        title={editingUser ? 'ویرایش کاربر' : 'ایجاد کاربر جدید'}
        size="lg"
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          editingUser ? handleEdit() : handleCreate();
        }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">کد ملی *</label>
              <Input
                value={formData.national_code}
                onChange={(e) => setFormData({ ...formData, national_code: e.target.value })}
                disabled={!!editingUser}
                required
                maxLength={10}
                placeholder="۱۰ رقم"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">نام *</label>
              <Input
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">نام خانوادگی *</label>
              <Input
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">شماره تماس</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">نقش *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                {roleOptions.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            {!editingUser && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">رمز عبور</label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="خالی = ۴ رقم آخر کد ملی"
                />
              </div>
            )}
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setModalOpen(false);
                setEditingUser(null);
                resetForm();
              }}
            >
              انصراف
            </Button>
            <Button type="submit">
              {editingUser ? 'ذخیره تغییرات' : 'ایجاد کاربر'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserList;