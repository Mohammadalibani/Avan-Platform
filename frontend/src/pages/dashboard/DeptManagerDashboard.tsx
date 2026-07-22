import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import apiClient from '../../api/client';

interface DeptStats {
  department_name: string;
  total_personnel: number;
  total_units: number;
  completion_percent: number;
  pending_requests: number;
  units: Array<{
    id: number;
    name: string;
    personnel_count: number;
    completion_percent: number;
  }>;
}

const DeptManagerDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DeptStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // دریافت آمار اداره
        const response = await apiClient.get('/dept-manager/api/all-data');
        const data = response.data;
        
        setStats({
          department_name: data.department_name || 'اداره',
          total_personnel: data.stats?.total || 0,
          total_units: data.units?.length || 0,
          completion_percent: data.stats?.completion_percent || 0,
          pending_requests: 0,
          units: data.units?.map((u: any) => ({
            id: u.id,
            name: u.name,
            personnel_count: 0,
            completion_percent: 0
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

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">داشبورد مدیر اداره</h2>
        <p className="text-slate-500">
          خوش آمدید {user?.full_name} عزیز - {stats?.department_name}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">کل پرسنل</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats?.total_personnel || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">کل واحدها</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.total_units || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">تکمیل اطلاعات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.completion_percent || 0}%</div>
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
          <CardTitle>واحدهای اداره</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">نام واحد</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-500">تعداد پرسنل</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-500">درصد تکمیل</th>
                </tr>
              </thead>
              <tbody>
                {stats?.units?.map((unit) => (
                  <tr key={unit.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">{unit.name}</td>
                    <td className="text-center py-3 px-4">{unit.personnel_count || 0}</td>
                    <td className="text-center py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        (unit.completion_percent || 0) >= 80 
                          ? 'bg-green-100 text-green-700' 
                          : (unit.completion_percent || 0) >= 50 
                          ? 'bg-amber-100 text-amber-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {unit.completion_percent || 0}%
                      </span>
                    </td>
                  </tr>
                ))}
                {(!stats?.units || stats.units.length === 0) && (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-slate-500">
                      هیچ واحدی ثبت نشده است
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

export default DeptManagerDashboard;