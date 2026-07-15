import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import StatCard from '../../components/dashboard/StatCard';
import TreeStructure from '../../components/dashboard/TreeStructure';
import LogList from '../../components/dashboard/LogList';
import { 
  Users, 
  UserCheck, 
  Clock, 
  Briefcase, 
  Building2, 
  Layers,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import apiClient from '../../api/client';

interface DashboardStats {
  total_users: number;
  active_users: number;
  pending_users: number;
  total_personnel: number;
  total_departments: number;
  total_units: number;
  pending_requests: number;
  online_users: number;
}

interface DepartmentTree {
  id: number;
  name: string;
  color: string;
  units: {
    id: number;
    name: string;
    personnel: {
      id: number;
      name: string;
      national_code: string;
      is_complete: boolean;
    }[];
  }[];
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [treeData, setTreeData] = useState<DepartmentTree[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // داده‌های نمونه برای ساختار درختی
  const getSampleTreeData = (): DepartmentTree[] => {
    return [
      {
        id: 1,
        name: 'اداره فناوری اطلاعات',
        color: '#4f46e5',
        units: [
          {
            id: 1,
            name: 'واحد نرم‌افزار',
            personnel: [
              { id: 1, name: 'علی احمدی', national_code: '0012345678', is_complete: false },
              { id: 2, name: 'محمد رضایی', national_code: '0023456789', is_complete: true },
            ]
          },
          {
            id: 2,
            name: 'واحد سخت‌افزار',
            personnel: [
              { id: 3, name: 'سارا محمدی', national_code: '0034567890', is_complete: false },
            ]
          }
        ]
      },
      {
        id: 2,
        name: 'اداره منابع انسانی',
        color: '#10b981',
        units: [
          {
            id: 3,
            name: 'واحد جذب و استخدام',
            personnel: [
              { id: 4, name: 'رضا کریمی', national_code: '0045678901', is_complete: false },
              { id: 5, name: 'زهرا حسینی', national_code: '0056789012', is_complete: false },
            ]
          }
        ]
      }
    ];
  };

  // داده‌های نمونه برای لاگ‌ها
  const getSampleLogs = () => {
    return [
      { id: 1, time: '۱۴۰۳/۰۴/۱۵ ۱۰:۳۰', message: 'کاربر علی احمدی وارد سیستم شد', badge: 'success' },
      { id: 2, time: '۱۴۰۳/۰۴/۱۵ ۰۹:۱۵', message: 'درخواست مرخصی کاربر مهدی رضایی تایید شد', badge: 'success' },
      { id: 3, time: '۱۴۰۳/۰۴/۱۴ ۱۶:۴۵', message: 'خطا در اتصال به دیتابیس', badge: 'danger' },
      { id: 4, time: '۱۴۰۳/۰۴/۱۴ ۱۴:۲۰', message: 'پرسنل جدید با کد ملی ۰۰۱۸۲۳۳۵۵۵ اضافه شد', badge: 'info' },
      { id: 5, time: '۱۴۰۳/۰۴/۱۴ ۱۱:۰۰', message: 'کاربر سارا محمدی خارج شد', badge: 'warning' },
    ];
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // دریافت آمار از API
        const statsRes = await apiClient.get('/dashboard/kpi');
        setStats(statsRes.data);

        // ✅ استفاده از fetch به جای apiClient برای درخواست‌های admin
        const token = localStorage.getItem('access_token');
        
        // دریافت ساختار درختی
        try {
          const treeResponse = await fetch('http://localhost:5000/admin/api/dashboard-data', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (treeResponse.ok) {
            const treeData = await treeResponse.json();
            if (treeData && treeData.personnel) {
              const departmentsMap: Record<number, DepartmentTree> = {};
              
              treeData.personnel.forEach((p: any) => {
                if (!p.is_complete) {
                  const deptId = p.department_id || 0;
                  const unitId = p.unit_id || 0;
                  
                  if (!departmentsMap[deptId]) {
                    const dept = treeData.departments?.find((d: any) => d.id === deptId);
                    departmentsMap[deptId] = {
                      id: deptId,
                      name: dept?.name || 'بدون اداره',
                      color: dept?.color || '#667eea',
                      units: {}
                    };
                  }
                  
                  if (!departmentsMap[deptId].units[unitId]) {
                    const unit = treeData.units?.find((u: any) => u.id === unitId);
                    departmentsMap[deptId].units[unitId] = {
                      id: unitId,
                      name: unit?.name || 'بدون واحد',
                      personnel: []
                    };
                  }
                  
                  departmentsMap[deptId].units[unitId].personnel.push({
                    id: p.id,
                    name: p.full_name || `${p.first_name || ''} ${p.last_name || ''}`,
                    national_code: p.national_code,
                    is_complete: p.is_complete
                  });
                }
              });
              
              const treeArray = Object.values(departmentsMap).map(dept => ({
                ...dept,
                units: Object.values(dept.units)
              }));
              
              setTreeData(treeArray);
            }
          } else {
            console.log('ℹ️ خطا در دریافت ساختار درختی، از داده‌های نمونه استفاده می‌شود');
            setTreeData(getSampleTreeData());
          }
        } catch (treeError) {
          console.log('ℹ️ خطا در دریافت ساختار درختی، از داده‌های نمونه استفاده می‌شود');
          setTreeData(getSampleTreeData());
        }

        // دریافت لاگ‌ها
        try {
const logsResponse = await fetch('http://localhost:5000/admin/api/logs?limit=10', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json'
  }
});
          
          if (logsResponse.ok) {
            const logsData = await logsResponse.json();
            if (logsData && logsData.logs) {
              setLogs(logsData.logs);
            }
          } else {
            setLogs(getSampleLogs());
          }
        } catch (logError) {
          console.log('ℹ️ خطا در دریافت لاگ‌ها، از داده‌های نمونه استفاده می‌شود');
          setLogs(getSampleLogs());
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // در صورت خطا، از داده‌های نمونه استفاده می‌کنیم
        setStats({
          total_users: 45,
          active_users: 32,
          pending_users: 5,
          total_personnel: 120,
          total_departments: 8,
          total_units: 24,
          pending_requests: 12,
          online_users: 8
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">در حال بارگذاری داشبورد...</div>
      </div>
    );
  }

  const statCards = [
    { title: 'کل کاربران', value: stats?.total_users || 0, icon: <Users size={48} />, color: 'from-blue-500 to-indigo-600' },
    { title: 'کاربران فعال', value: stats?.active_users || 0, icon: <UserCheck size={48} />, color: 'from-green-500 to-emerald-600' },
    { title: 'در انتظار تایید', value: stats?.pending_users || 0, icon: <Clock size={48} />, color: 'from-amber-500 to-orange-600' },
    { title: 'کاربران آنلاین', value: stats?.online_users || 0, icon: <TrendingUp size={48} />, color: 'from-cyan-500 to-blue-600' },
    { title: 'کل پرسنل', value: stats?.total_personnel || 0, icon: <Briefcase size={48} />, color: 'from-purple-500 to-pink-600' },
    { title: 'ادارات', value: stats?.total_departments || 0, icon: <Building2 size={48} />, color: 'from-indigo-500 to-purple-600' },
    { title: 'واحدها', value: stats?.total_units || 0, icon: <Layers size={48} />, color: 'from-teal-500 to-cyan-600' },
    { title: 'درخواست‌های در انتظار', value: stats?.pending_requests || 0, icon: <AlertCircle size={48} />, color: 'from-red-500 to-rose-600' },
  ];

  const totalIncomplete = treeData.reduce((acc, dept) => 
    acc + dept.units.reduce((uAcc, unit) => 
      uAcc + unit.personnel.filter(p => !p.is_complete).length, 0
    ), 0
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">داشبورد مدیریت</h2>
        <p className="text-slate-500">خوش آمدید {user?.full_name} عزیز</p>
      </div>

      {/* کارت‌های آماری */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {statCards.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      {/* بخش اصلی */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* ستون چپ - ساختار درختی */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-5 shadow-md">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <AlertCircle size={20} className="text-red-500" />
              اطلاعات ناقص پرسنل
              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full mr-auto">
                {totalIncomplete} ناقص
              </span>
            </h3>
            <TreeStructure departments={treeData} />
          </div>
        </div>

        {/* ستون راست - لاگ‌ها */}
        <div className="lg:col-span-1">
          <LogList logs={logs} />
        </div>
      </div>

      {/* دکمه‌های میانبر */}
      <div className="flex flex-wrap gap-3">
        <button 
          className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm hover:bg-indigo-200 transition-all" 
          onClick={() => window.location.href = '/admin/users'}
        >
          👥 مدیریت کاربران
        </button>
        <button 
          className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm hover:bg-green-200 transition-all"
          onClick={() => window.location.href = '/admin/personnel'}
        >
          👨‍💼 مدیریت پرسنل
        </button>
        <button 
          className="bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-sm hover:bg-amber-200 transition-all"
          onClick={() => window.location.href = '/admin/departments'}
        >
          🏢 مدیریت ادارات
        </button>
        <button 
          className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm hover:bg-purple-200 transition-all"
          onClick={() => window.location.href = '/admin/units'}
        >
          📁 مدیریت واحدها
        </button>
        <button 
          className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm hover:bg-blue-200 transition-all"
          onClick={() => window.location.href = '/admin/approvals'}
        >
          ✅ درخواست‌های تایید
        </button>
        <button 
          className="bg-rose-100 text-rose-700 px-4 py-2 rounded-full text-sm hover:bg-rose-200 transition-all"
          onClick={() => window.location.href = '/admin/settings'}
        >
          ⚙️ تنظیمات
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;