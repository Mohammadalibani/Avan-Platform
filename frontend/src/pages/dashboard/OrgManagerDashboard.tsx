import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import apiClient from '../../api/client';

interface OrgStats {
  total_departments: number;
  total_units: number;
  total_personnel: number;
  completion_percent: number;
  pending_requests: number;
  departments: Array<{
    id: number;
    name: string;
    color: string;
    personnel_count: number;
    units_count: number;
  }>;
}

const OrgManagerDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<OrgStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.get('/dashboard/kpi');
        const deptsResponse = await apiClient.get('/dashboard/departments');
        setStats({
          ...response.data,
          departments: deptsResponse.data.departments || []
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
        <h2 className="text-2xl font-bold text-slate-800">داشبورد مدیر سازمان</h2>
        <p className="text-slate-500">خوش آمدید {user?.full_name} عزیز</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">کل ادارات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.total_departments || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">کل واحدها</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{stats?.total_units || 0}</div>
          </CardContent>
        </Card>
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
            <CardTitle className="text-sm font-medium text-slate-500">درخواست‌های در انتظار</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats?.pending_requests || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>لیست ادارات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">نام اداره</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-500">تعداد واحدها</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-500">تعداد پرسنل</th>
                </tr>
              </thead>
              <tbody>
                {stats?.departments?.map((dept) => (
                  <tr key={dept.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: dept.color || '#667eea' }}
                        />
                        <span>{dept.name}</span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4">{dept.units_count || 0}</td>
                    <td className="text-center py-3 px-4">{dept.personnel_count || 0}</td>
                  </tr>
                ))}
                {(!stats?.departments || stats.departments.length === 0) && (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-slate-500">
                      هیچ اداره‌ای ثبت نشده است
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

export default OrgManagerDashboard;