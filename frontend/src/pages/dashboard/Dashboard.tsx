import React from 'react';
import { useAuthStore } from '../../stores/authStore';
import Header from '../../components/layout/Header';
import AdminDashboard from './AdminDashboard';
import OrgManagerDashboard from './OrgManagerDashboard';
import DeptManagerDashboard from './DeptManagerDashboard';
import UnitSupervisorDashboard from './UnitSupervisorDashboard';

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();

  console.log('✅ Dashboard.tsx بارگذاری شد!', user?.role);

  const renderDashboard = () => {
    console.log('🎯 نقش کاربر:', user?.role);
    
    switch (user?.role) {
      case 'admin':
        console.log('📊 نمایش داشبورد ادمین');
        return <AdminDashboard />;
      case 'org_manager':
        console.log('📊 نمایش داشبورد مدیر سازمان');
        return <OrgManagerDashboard />;
      case 'dept_manager':
        console.log('📊 نمایش داشبورد مدیر اداره');
        return <DeptManagerDashboard />;
      case 'unit_supervisor':
        console.log('📊 نمایش داشبورد سرپرست واحد');
        return <UnitSupervisorDashboard />;
      default:
        console.log('📊 نمایش داشبورد پیش‌فرض');
        return (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <div className="text-4xl mb-4">🚀</div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">
              داشبورد {user?.role_persian || 'کاربر'}
            </h2>
            <p className="text-slate-500">به زودی تکمیل می‌شود</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Header />
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {renderDashboard()}
      </main>
    </div>
  );
};

export default Dashboard;