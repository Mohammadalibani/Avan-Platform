// frontend/src/pages/departments/DepartmentList.tsx
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { Plus, Edit, Trash2, RefreshCw, FolderTree, UserCog } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../../utils/helpers';
import axios from 'axios';

// ✅ خط ۱۱ - با دقت وارد کنید (هیچ کاراکتر اضافی قبل از interface نباشد)
interface Department {
  id: number;
  name: string;
  color: string;
  description: string;
  created_at: string;
  is_active: boolean;
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  role: string;
  role_persian: string;
  department_id?: number;
}

interface Unit {
  id: number;
  name: string;
  department_id: number;
  supervisors?: User[];
}

const DepartmentList: React.FC = () => {
  const { user } = useAuthStore();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3498db',
    description: '',
    manager_ids: [] as number[],
  });
  const [managerSearch, setManagerSearch] = useState('');

  const API_BASE = 'http://localhost:5000';

  // ========== دریافت توکن ==========
  const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.warn('⚠️ No token found!');
      return {};
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  // ========== دریافت داده‌ها ==========
  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      
      if (!headers.Authorization) {
        toast.error('لطفاً مجدداً وارد شوید');
        if (!localStorage.getItem('_redirecting')) {
          localStorage.setItem('_redirecting', 'true');
          window.location.href = '/login';
        }
        setLoading(false);
        return;
      }
      
      const [deptsRes, usersRes, unitsRes] = await Promise.all([
        axios.get(`${API_BASE}/admin/api/departments`, { headers }),
        axios.get(`${API_BASE}/api/v1/users`, { headers }),
        axios.get(`${API_BASE}/admin/api/units-all`, { headers }),
      ]);

      if (typeof deptsRes.data === 'string' && deptsRes.data.includes('<!DOCTYPE html>')) {
        throw new Error('SESSION_EXPIRED');
      }

      console.log('✅ Departments:', deptsRes.data);
      console.log('✅ Users:', usersRes.data);
      console.log('✅ Units:', unitsRes.data);

      setDepartments(deptsRes.data || []);
      setUsers(usersRes.data.users || []);
      setUnits(unitsRes.data.units || unitsRes.data || []);
    } catch (error: any) {
      console.error('❌ Error fetching data:', error);
      if (error.message === 'SESSION_EXPIRED' || error.response?.status === 401) {
        localStorage.removeItem('accessToken');
        if (!localStorage.getItem('_redirecting')) {
          localStorage.setItem('_redirecting', 'true');
          toast.error('نشست شما منقضی شده است. لطفاً مجدداً وارد شوید.');
          setTimeout(() => window.location.href = '/login', 1500);
        }
      } else {
        toast.error('خطا در دریافت اطلاعات');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ========== توابع CRUD ==========
  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('لطفاً نام اداره را وارد کنید');
      return;
    }

    try {
      const headers = getAuthHeaders();
      const payload = {
        name: formData.name.trim(),
        color: formData.color,
        description: formData.description.trim(),
        manager_ids: formData.manager_ids,
      };
      
      const res = await axios.post(`${API_BASE}/admin/departments/create`, payload, { headers });
      
      if (res.data.success) {
        toast.success('اداره با موفقیت ایجاد شد');
        resetForm();
        setModalOpen(false);
        fetchData();
      } else {
        toast.error(res.data.error || 'خطا در ایجاد اداره');
      }
    } catch (error: any) {
      console.error('Error creating department:', error);
      toast.error(error.response?.data?.error || 'خطا در ایجاد اداره');
    }
  };

  const handleEdit = async () => {
    if (!editingId) return;
    if (!formData.name.trim()) {
      toast.error('لطفاً نام اداره را وارد کنید');
      return;
    }

    try {
      const headers = getAuthHeaders();
      const payload = {
        name: formData.name.trim(),
        color: formData.color,
        description: formData.description.trim(),
        manager_ids: formData.manager_ids,
      };
      
      const res = await axios.post(`${API_BASE}/admin/departments/${editingId}/edit`, payload, { headers });
      
      if (res.data.success) {
        toast.success('اداره با موفقیت ویرایش شد');
        resetForm();
        setModalOpen(false);
        setEditingId(null);
        fetchData();
      } else {
        toast.error(res.data.error || 'خطا در ویرایش اداره');
      }
    } catch (error: any) {
      console.error('Error editing department:', error);
      toast.error(error.response?.data?.error || 'خطا در ویرایش اداره');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('آیا از حذف این اداره مطمئن هستید؟\nتوجه: با حذف اداره، تمام واحدها و پرسنل مرتبط نیز حذف خواهند شد!')) {
      return;
    }
    
    try {
      const headers = getAuthHeaders();
      const res = await axios.post(`${API_BASE}/admin/departments/${id}/delete`, {}, { headers });
      
      if (res.data.success) {
        toast.success('اداره با موفقیت حذف شد');
        fetchData();
      } else {
        toast.error(res.data.error || 'خطا در حذف اداره');
      }
    } catch (error: any) {
      console.error('Error deleting department:', error);
      toast.error(error.response?.data?.error || 'خطا در حذف اداره');
    }
  };

  // ========== توابع کمکی ==========
  const resetForm = () => {
    setFormData({
      name: '',
      color: '#3498db',
      description: '',
      manager_ids: [],
    });
    setManagerSearch('');
  };

  const openCreateModal = () => {
    resetForm();
    setEditingId(null);
    setModalOpen(true);
  };

  const openEditModal = (dept: Department) => {
    const deptManagers = users
      .filter(u => u.role === 'dept_manager' && u.department_id === dept.id)
      .map(u => u.id);
    
    setEditingId(dept.id);
    setFormData({
      name: dept.name,
      color: dept.color || '#3498db',
      description: dept.description || '',
      manager_ids: deptManagers,
    });
    setManagerSearch('');
    setModalOpen(true);
  };

  const toggleManager = (userId: number) => {
    setFormData(prev => ({
      ...prev,
      manager_ids: prev.manager_ids.includes(userId)
        ? prev.manager_ids.filter(id => id !== userId)
        : [...prev.manager_ids, userId],
    }));
  };

  const filteredUsers = users.filter(u => {
    const search = managerSearch.toLowerCase().trim();
    if (!search) return true;
    const fullName = (u.full_name || u.first_name + ' ' + u.last_name || '').toLowerCase();
    const role = (u.role_persian || u.role || '').toLowerCase();
    return fullName.includes(search) || role.includes(search);
  });

  // ========== رندر ==========
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div>
      {/* هدر */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">🏢 مدیریت ادارات</h2>
          <p className="text-slate-500 text-sm">مدیریت ادارات، واحدها و سرپرستان</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw size={16} className="ml-1" />
            رفرش
          </Button>
          <Button onClick={openCreateModal}>
            <Plus size={16} className="ml-1" />
            اداره جدید
          </Button>
        </div>
      </div>

      {/* لیست ادارات */}
      {departments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-slate-500">هیچ اداره‌ای تعریف نشده است</p>
          <Button onClick={openCreateModal} className="mt-4">
            <Plus size={16} className="ml-1" />
            افزودن اداره جدید
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {departments.map((dept) => {
            const deptUnits = units.filter(u => u.department_id === dept.id);
            const deptManagers = users.filter(u => 
              u.role === 'dept_manager' && u.department_id === dept.id
            );

            return (
              <div
                key={dept.id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-slate-100"
              >
                {/* هدر کارت */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: dept.color || '#3498db' }}
                    />
                    <h3 className="font-bold text-slate-800">{dept.name}</h3>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditModal(dept)}
                      className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                      title="ویرایش"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(dept.id)}
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                      title="حذف"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* بدنه کارت */}
                <div className="p-4">
                  <p className="text-sm text-slate-500 mb-4 border-b border-slate-100 pb-3">
                    {dept.description || 'بدون توضیحات'}
                  </p>

                  {/* واحدها */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 mb-2">
                      <FolderTree size={16} />
                      <span>واحدها و سرپرستان</span>
                    </div>
                    {deptUnits.length === 0 ? (
                      <span className="text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
                        هیچ واحدی تعریف نشده
                      </span>
                    ) : (
                      <div className="space-y-2">
                        {deptUnits.map((unit) => (
                          <div
                            key={unit.id}
                            className="bg-slate-50 rounded-xl p-3 border-r-4"
                            style={{ borderRightColor: dept.color || '#3498db' }}
                          >
                            <div className="font-medium text-sm text-slate-700 mb-1">
                              📁 {unit.name}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {unit.supervisors && unit.supervisors.length > 0 ? (
                                unit.supervisors.map((sup) => (
                                  <span
                                    key={sup.id}
                                    className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full"
                                  >
                                    👤 {sup.full_name}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                  بدون سرپرست
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* مدیران */}
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 mb-2">
                      <UserCog size={16} />
                      <span>مدیران اداره</span>
                    </div>
                    {deptManagers.length === 0 ? (
                      <span className="text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
                        هیچ مدیری انتخاب نشده
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {deptManagers.map((m) => (
                          <span
                            key={m.id}
                            className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full"
                          >
                            👤 {m.full_name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* فوتر */}
                <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-xs text-slate-400">
                  📅 تاریخ ایجاد: {dept.created_at || '-'}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* مودال ایجاد/ویرایش */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingId(null);
          resetForm();
        }}
        title={editingId ? 'ویرایش اداره' : 'افزودن اداره جدید'}
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            editingId ? handleEdit() : handleCreate();
          }}
        >
          <div className="space-y-4">
            {/* نام اداره */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                نام اداره *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="مثال: اداره مالی"
              />
            </div>

            {/* رنگ */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                رنگ اداره
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-12 h-12 rounded-lg border border-slate-200 cursor-pointer p-1"
                />
                <div
                  className="w-12 h-12 rounded-lg border border-slate-200"
                  style={{ backgroundColor: formData.color }}
                />
              </div>
            </div>

            {/* توضیحات */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                توضیحات
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="توضیحات اختیاری..."
              />
            </div>

            {/* مدیران */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                مدیران اداره
                <span className="mr-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                  {formData.manager_ids.length} انتخاب شده
                </span>
              </label>
              <Input
                placeholder="🔍 جستجو در نام، نقش..."
                value={managerSearch}
                onChange={(e) => setManagerSearch(e.target.value)}
                className="mb-2"
              />
              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-2">
                {filteredUsers.length === 0 ? (
                  <p className="text-center text-slate-400 text-sm py-4">
                    کاربری یافت نشد
                  </p>
                ) : (
                  filteredUsers.map((u) => (
                    <label
                      key={u.id}
                      className={cn(
                        'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors',
                        formData.manager_ids.includes(u.id)
                          ? 'bg-indigo-50'
                          : 'hover:bg-slate-50'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={formData.manager_ids.includes(u.id)}
                        onChange={() => toggleManager(u.id)}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="flex-1 flex justify-between items-center">
                        <span className="font-medium text-sm">{u.full_name || u.first_name + ' ' + u.last_name}</span>
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                          {u.role_persian || u.role}
                        </span>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setModalOpen(false);
                setEditingId(null);
                resetForm();
              }}
            >
              انصراف
            </Button>
            <Button type="submit">
              {editingId ? 'ذخیره تغییرات' : 'ایجاد اداره'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DepartmentList;