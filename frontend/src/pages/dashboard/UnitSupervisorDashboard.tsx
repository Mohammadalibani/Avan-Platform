import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import apiClient from '../../api/client';

interface UnitStats {
  unit_name: string;
  department_name: string;
  total_personnel: number;
  completion_percent: number;
  pending_requests: number;
  personnel: Array<{
    id: number;
    full_name: string;
    national_code: string;
    is_complete: boolean;
  }>;
}

const UnitSupervisorDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<UnitStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.get('/unit-supervisor/api/all-data');
        const data = response.data;
        
        setStats({
          unit_name: data.unit_name || 'واحد',
          department_name: data.department_name || 'اداره',
          total_personnel: data.stats?.total || 0,
          completion_percent: data.stats?.completion_percent || 0,
          pending_requests: 0,
          personnel: data.personnel?.map((p: any) => ({
            id: p.id,
            full_name: p.full_name || '',
            national_code: p.national_code || '',
            is_complete: p.is_complete || false
          })) || []
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">در حال بارگذاری...</div>
      </div>
    );
  }

  const completedCount = stats?.personnel?.filter(p => p.is_complete).length || 0;
  const totalCount = stats?.personnel?.length || 0;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">داشبورد سرپرست واحد</h2>
        <p className="text-slate-500">
          خوش آمدید {user?.full_name} عزیز - واحد {stats?.unit_name}
        </p>
        <p className="text-sm text-slate-400">اداره {stats?.department_name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">کل پرسنل</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{totalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">تکمیل شده</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">درصد تکمیل</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.completion_percent || 0}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">درخواست‌های در انتظار</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats?.pending_requests || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>لیست پرسنل</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">نام و نام خانوادگی</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-500">کد ملی</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-500">وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {stats?.personnel?.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">{p.full_name || '-'}</td>
                    <td className="text-center py-3 px-4">{p.national_code}</td>
                    <td className="text-center py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        p.is_complete 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {p.is_complete ? '✅ تکمیل شده' : '❌ ناقص'}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!stats?.personnel || stats.personnel.length === 0) && (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-slate-500">
                      هیچ پرسنلی ثبت نشده است
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnitSupervisorDashboard;