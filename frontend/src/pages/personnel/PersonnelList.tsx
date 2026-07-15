import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import apiClient from '../../api/client';
import { Plus, Edit, Trash2, RefreshCw, Download, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

interface Personnel {
  id: number;
  national_code: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  position: string;
  department_id: number;
  department_name: string;
  unit_id: number;
  unit_name: string;
  period_id: number | null;
  period_title: string;
  values: Record<string, any>;
  is_complete: boolean;
}

interface DynamicField {
  id: number;
  title: string;
  field_type: string;
  is_required: boolean;
  is_key: boolean;
}

interface Department {
  id: number;
  name: string;
}

interface Unit {
  id: number;
  name: string;
  department_id: number;
}

interface Period {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface ApiResponse<T> {
  data?: T[];
  total?: number;
  page?: number;
  per_page?: number;
  pages?: number;
}

const PersonnelList: React.FC = () => {
  const { user } = useAuthStore();
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [fields, setFields] = useState<DynamicField[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPersonnel, setEditingPersonnel] = useState<Personnel | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [filters, setFilters] = useState({
    search: '',
    department_id: '',
    unit_id: '',
    period_id: '',
  });

  // ✅ بارگذاری همه داده‌ها با Promise.all
  const fetchData = async () => {
    setLoading(true);
    try {
      const [personnelRes, fieldsRes, deptsRes, unitsRes, periodsRes] = await Promise.all([
        apiClient.get('/personnel'),
        apiClient.get('/fields'),
        apiClient.get('/departments'),
        apiClient.get('/units-all'),
        apiClient.get('/periods'),
      ]);

      setPersonnel(personnelRes.data.data || personnelRes.data || []);
      setFields(fieldsRes.data.fields || fieldsRes.data || []);
      setDepartments(deptsRes.data.departments || deptsRes.data || []);
      setUnits(unitsRes.data.units || unitsRes.data || []);
      setPeriods(periodsRes.data.periods || periodsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('خطا در دریافت اطلاعات');
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
  console.log('🔍 BaseURL:', apiClient.defaults.baseURL);
  console.log('🔍 Test request:', '/v1/personnel');
  apiClient.interceptors.request.use((config) => {
    console.log('🚀 Final URL:', config.baseURL + config.url);
    return config;
  });
}, []);

  const handleCreate = async () => {
    try {
      const payload = {
        national_code: formData.national_code,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone || '',
        position: formData.position || '',
        department_id: parseInt(formData.department_id),
        unit_id: parseInt(formData.unit_id),
        period_id: formData.period_id ? parseInt(formData.period_id) : null,
        dynamic_values: formData.dynamic_values || {},
      };
      
      await apiClient.post('/v1/personnel', payload);
      toast.success('پرسنل با موفقیت ایجاد شد');
      setModalOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'خطا در ایجاد پرسنل');
    }
  };

  const handleEdit = async () => {
    if (!editingPersonnel) return;
    try {
      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone || '',
        position: formData.position || '',
        department_id: parseInt(formData.department_id),
        unit_id: parseInt(formData.unit_id),
        period_id: formData.period_id ? parseInt(formData.period_id) : null,
        dynamic_values: formData.dynamic_values || {},
      };
      
      await apiClient.put(`/v1/personnel/${editingPersonnel.id}`, payload);
      toast.success('اطلاعات پرسنل با موفقیت به‌روزرسانی شد');
      setModalOpen(false);
      setEditingPersonnel(null);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'خطا در ویرایش پرسنل');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('آیا از حذف این پرسنل مطمئن هستید؟')) return;
    try {
      await apiClient.delete(`/v1/personnel/${id}`);
      toast.success('پرسنل با موفقیت حذف شد');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'خطا در حذف پرسنل');
    }
  };

  const resetForm = () => {
    const initialValues: Record<string, any> = {
      national_code: '',
      first_name: '',
      last_name: '',
      phone: '',
      position: '',
      department_id: '',
      unit_id: '',
      period_id: '',
      dynamic_values: {},
    };
    fields.forEach(f => {
      if (!f.is_key && f.title !== 'نام' && f.title !== 'نام خانوادگی') {
        initialValues.dynamic_values[f.id] = '';
      }
    });
    setFormData(initialValues);
  };

  const openCreateModal = () => {
    resetForm();
    setEditingPersonnel(null);
    setModalOpen(true);
  };

  const openEditModal = (p: Personnel) => {
    setEditingPersonnel(p);
    const dynamicValues: Record<string, any> = {};
    fields.forEach(f => {
      if (!f.is_key && f.title !== 'نام' && f.title !== 'نام خانوادگی') {
        dynamicValues[f.id] = p.values?.[f.title] || '';
      }
    });
    setFormData({
      national_code: p.national_code,
      first_name: p.first_name,
      last_name: p.last_name,
      phone: p.phone || '',
      position: p.position || '',
      department_id: String(p.department_id || ''),
      unit_id: String(p.unit_id || ''),
      period_id: String(p.period_id || ''),
      dynamic_values: dynamicValues,
    });
    setModalOpen(true);
  };

  const columns = [
    { key: 'full_name', title: 'نام و نام خانوادگی', sortable: true },
    { key: 'national_code', title: 'کد ملی', sortable: true },
    { key: 'department_name', title: 'اداره' },
    { key: 'unit_name', title: 'واحد' },
    { key: 'position', title: 'سمت' },
    {
      key: 'is_complete',
      title: 'وضعیت',
      render: (item: Personnel) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.is_complete ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
          {item.is_complete ? '✅ تکمیل شده' : '⏳ ناقص'}
        </span>
      ),
    },
    {
      key: 'period_title',
      title: 'دوره',
      render: (item: Personnel) => item.period_title || '-',
    },
  ];

  const displayFields = fields.filter(f => !f.is_key && f.title !== 'نام' && f.title !== 'نام خانوادگی');
  const dynamicColumns = displayFields.map(f => ({
    key: `values.${f.title}`,
    title: f.title,
    render: (item: Personnel) => item.values?.[f.title] || '-',
  }));

  const allColumns = [...columns, ...dynamicColumns];

  const actions = (item: Personnel) => (
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={() => openEditModal(item)}
        className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
        title="ویرایش"
      >
        <Edit size={16} />
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
          <h2 className="text-2xl font-bold text-slate-800">مدیریت پرسنل</h2>
          <p className="text-slate-500 text-sm">مدیریت اطلاعات پرسنل سازمان</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw size={16} className="ml-1" />
            رفرش
          </Button>
          <Button variant="outline" size="sm">
            <Upload size={16} className="ml-1" />
            آپلود اکسل
          </Button>
          <Button variant="outline" size="sm">
            <Download size={16} className="ml-1" />
            خروجی اکسل
          </Button>
          <Button onClick={openCreateModal}>
            <Plus size={16} className="ml-1" />
            پرسنل جدید
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm mb-4 flex flex-wrap gap-3 items-center">
        <Input
          placeholder="جستجوی پرسنل..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="max-w-xs"
        />
        <select
          value={filters.department_id}
          onChange={(e) => setFilters({ ...filters, department_id: e.target.value, unit_id: '' })}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">همه ادارات</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <select
          value={filters.unit_id}
          onChange={(e) => setFilters({ ...filters, unit_id: e.target.value })}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">همه واحدها</option>
          {units
            .filter(u => !filters.department_id || u.department_id === parseInt(filters.department_id))
            .map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
        </select>
        <select
          value={filters.period_id}
          onChange={(e) => setFilters({ ...filters, period_id: e.target.value })}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">همه دوره‌ها</option>
          {periods.map((p) => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
        <Button variant="outline" size="sm" onClick={fetchData}>
          اعمال فیلتر
        </Button>
      </div>

      <DataTable
        data={personnel}
        columns={allColumns}
        keyExtractor={(item) => item.id}
        loading={loading}
        searchPlaceholder="جستجوی پرسنل..."
        actions={actions}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingPersonnel(null);
          resetForm();
        }}
        title={editingPersonnel ? 'ویرایش پرسنل' : 'ایجاد پرسنل جدید'}
        size="xl"
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          editingPersonnel ? handleEdit() : handleCreate();
        }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">کد ملی *</label>
              <Input
                value={formData.national_code || ''}
                onChange={(e) => setFormData({ ...formData, national_code: e.target.value })}
                disabled={!!editingPersonnel}
                required
                maxLength={10}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">نام *</label>
              <Input
                value={formData.first_name || ''}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">نام خانوادگی *</label>
              <Input
                value={formData.last_name || ''}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">شماره تماس</label>
              <Input
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">سمت</label>
              <Input
                value={formData.position || ''}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">اداره *</label>
              <select
                value={formData.department_id || ''}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value, unit_id: '' })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">انتخاب کنید...</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">واحد *</label>
              <select
                value={formData.unit_id || ''}
                onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">انتخاب کنید...</option>
                {units
                  .filter(u => !formData.department_id || u.department_id === parseInt(formData.department_id))
                  .map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">دوره کارکرد</label>
              <select
                value={formData.period_id || ''}
                onChange={(e) => setFormData({ ...formData, period_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">بدون دوره</option>
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
          </div>

          {displayFields.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">اطلاعات تکمیلی</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {displayFields.map((f) => (
                  <div key={f.id}>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {f.title} {f.is_required && <span className="text-red-500">*</span>}
                    </label>
                    {f.field_type === 'text' && (
                      <Input
                        value={formData.dynamic_values?.[f.id] || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          dynamic_values: { ...formData.dynamic_values, [f.id]: e.target.value }
                        })}
                        required={f.is_required}
                      />
                    )}
                    {f.field_type === 'number' && (
                      <Input
                        type="number"
                        value={formData.dynamic_values?.[f.id] || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          dynamic_values: { ...formData.dynamic_values, [f.id]: e.target.value }
                        })}
                        required={f.is_required}
                      />
                    )}
                    {f.field_type === 'date' && (
                      <Input
                        type="text"
                        placeholder="۱۴۰۳/۰۱/۰۱"
                        value={formData.dynamic_values?.[f.id] || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          dynamic_values: { ...formData.dynamic_values, [f.id]: e.target.value }
                        })}
                        required={f.is_required}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setModalOpen(false);
                setEditingPersonnel(null);
                resetForm();
              }}
            >
              انصراف
            </Button>
            <Button type="submit">
              {editingPersonnel ? 'ذخیره تغییرات' : 'ایجاد پرسنل'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PersonnelList;