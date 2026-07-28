// frontend/src/App.tsx
import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp, Spin } from 'antd';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import ProfileComplete from './components/Profile/ProfileComplete';
import Profile from './components/Profile/Profile';
import MyRequests from './components/Users/MyRequests';

// ===== کامپوننت‌های اصلی (غیر Lazy) =====
import Layout from './components/Layout/Layout';
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard';
import ProjectsList from './components/Projects/ProjectsList';
import ProjectDetail from './components/Projects/ProjectDetail';
import TasksList from './components/Tasks/TasksList';
import UsersList from './components/Users/UsersList';
import NotFound from './components/NotFound/NotFound';

// ===== فاز ۴: صفحات سرپرست واحد =====
import UnitSupervisorDashboard from './components/UnitSupervisor/Dashboard';
import RequestsList from './components/UnitSupervisor/RequestsList';

// ===== فاز ۵: صفحات مدیر اداره =====
import DeptManagerDashboard from './components/DeptManager/Dashboard';

// ===== فاز ۶: صفحات مدیر سازمان =====
import OrgManagerDashboard from './components/OrgManager/Dashboard';

// ===== فاز ۷: صفحات مدیر منابع انسانی =====
import HrManagerDashboard from './components/HrManager/Dashboard';

// ===== فاز ۹: صفحات تیکت‌ها و پیام‌ها =====
import TicketsList from './components/Tickets/TicketsList';
import WorkMessagesList from './components/Tickets/WorkMessagesList';

// ===== فاز ثبت درخواست جدید =====
import RequestTypeSelector from './components/Requests/RequestTypeSelector';
import RequestNewPage from './pages/RequestNewPage';
import RequestEditPage from './pages/RequestEditPage';

// ===== فاز ۸: صفحات ادمین (با Lazy Loading) =====
const AdminDashboard = lazy(() => import('./components/Admin/Dashboard'));
const AdminUsersList = lazy(() => import('./components/Admin/UsersList'));
const AdminDepartmentsList = lazy(() => import('./components/Admin/DepartmentsList'));
const AdminUnitsList = lazy(() => import('./components/Admin/UnitsList'));
const AdminPersonnelList = lazy(() => import('./components/Admin/PersonnelList'));
const AdminFieldsList = lazy(() => import('./components/Admin/FieldsList'));
const AdminPeriodsList = lazy(() => import('./components/Admin/PeriodsList'));
const AdminApprovalsList = lazy(() => import('./components/Admin/ApprovalsList'));
const AdminSettings = lazy(() => import('./components/Admin/Settings'));
const AdminInbox = lazy(() => import('./components/Admin/Inbox'));
const AdminExcelTemplate = lazy(() => import('./components/Admin/ExcelTemplate'));

// ===== ایجاد Query Client =====
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

// ===== Fallback برای Lazy Loading =====
const PageLoader: React.FC = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="در حال بارگذاری..." />
    </div>
);

// ===== کامپوننت محافظت شده =====
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuthStore();
    
    if (isLoading) {
        return <PageLoader />;
    }
    
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    return <>{children}</>;
};

// ===== کامپوننت اصلی App =====
function App() {
    const { checkAuth } = useAuthStore();
    
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const handleSelectRequestType = (type: string) => {
        window.location.href = `/requests/${type}/new`;
    };

    return (
        <QueryClientProvider client={queryClient}>
            <ConfigProvider
                theme={{
                    token: {
                        colorPrimary: '#1890ff',
                        borderRadius: 8,
                        fontFamily: 'IRANSans, Vazirmatn, Tahoma, sans-serif',
                    },
                }}
            >
                <AntApp>
                    <Router
                        future={{
                            v7_startTransition: true,
                            v7_relativeSplatPath: true,
                        }}
                    >
                        <Toaster
                            position="top-right"
                            toastOptions={{
                                duration: 4000,
                                style: {
                                    fontFamily: 'IRANSans, Vazirmatn, Tahoma, sans-serif',
                                },
                            }}
                        />
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route path="/profile/complete" element={<ProfileComplete />} />
                            
                            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                                {/* ===== صفحات عمومی ===== */}
                                <Route index element={<Dashboard />} />
                                <Route path="projects" element={<ProjectsList />} />
                                <Route path="projects/:id" element={<ProjectDetail />} />
                                <Route path="tasks" element={<TasksList />} />
                                <Route path="users" element={<UsersList />} />
                                
                                {/* ===== پروفایل ===== */}
                                <Route path="profile" element={<Profile />} />
                                
                                {/* ===== فاز ۴: سرپرست واحد ===== */}
                                <Route path="unit-supervisor/dashboard" element={<UnitSupervisorDashboard />} />
                                <Route path="unit-supervisor/requests" element={<RequestsList />} />
                                
                                {/* ===== فاز ۵: مدیر اداره ===== */}
                                <Route path="dept-manager/dashboard" element={<DeptManagerDashboard />} />
                                
                                {/* ===== فاز ۶: مدیر سازمان ===== */}
                                <Route path="org-manager/dashboard" element={<OrgManagerDashboard />} />
                                
                                {/* ===== فاز ۷: مدیر منابع انسانی ===== */}
                                <Route path="hr-manager/dashboard" element={<HrManagerDashboard />} />
                                
                                {/* ===== درخواست‌ها ===== */}
                                <Route
                                    path="requests/new"
                                    element={
                                        <RequestTypeSelector
                                            visible={true}
                                            onClose={() => window.location.href = '/requests'}
                                            onSelect={handleSelectRequestType}
                                        />
                                    }
                                />
                                <Route path="requests/:type/new" element={<RequestNewPage />} />
                                <Route path="requests/:id/edit" element={<RequestEditPage />} />
                                
                                {/* ===== فاز ۸: ادمین (Lazy Loading) ===== */}
                                <Route
                                    path="admin/dashboard"
                                    element={
                                        <Suspense fallback={<PageLoader />}>
                                            <AdminDashboard />
                                        </Suspense>
                                    }
                                />
                                <Route
                                    path="admin/users"
                                    element={
                                        <Suspense fallback={<PageLoader />}>
                                            <AdminUsersList />
                                        </Suspense>
                                    }
                                />
                                <Route
                                    path="admin/departments"
                                    element={
                                        <Suspense fallback={<PageLoader />}>
                                            <AdminDepartmentsList />
                                        </Suspense>
                                    }
                                />
                                <Route
                                    path="admin/units"
                                    element={
                                        <Suspense fallback={<PageLoader />}>
                                            <AdminUnitsList />
                                        </Suspense>
                                    }
                                />
                                <Route
                                    path="admin/personnel"
                                    element={
                                        <Suspense fallback={<PageLoader />}>
                                            <AdminPersonnelList />
                                        </Suspense>
                                    }
                                />
                                <Route
                                    path="admin/fields"
                                    element={
                                        <Suspense fallback={<PageLoader />}>
                                            <AdminFieldsList />
                                        </Suspense>
                                    }
                                />
                                <Route
                                    path="admin/periods"
                                    element={
                                        <Suspense fallback={<PageLoader />}>
                                            <AdminPeriodsList />
                                        </Suspense>
                                    }
                                />
                                <Route
                                    path="admin/approvals"
                                    element={
                                        <Suspense fallback={<PageLoader />}>
                                            <AdminApprovalsList />
                                        </Suspense>
                                    }
                                />
                                <Route
                                    path="admin/settings"
                                    element={
                                        <Suspense fallback={<PageLoader />}>
                                            <AdminSettings />
                                        </Suspense>
                                    }
                                />
                                <Route
                                    path="admin/inbox"
                                    element={
                                        <Suspense fallback={<PageLoader />}>
                                            <AdminInbox />
                                        </Suspense>
                                    }
                                />
                                <Route
                                    path="admin/excel-template"
                                    element={
                                        <Suspense fallback={<PageLoader />}>
                                            <AdminExcelTemplate />
                                        </Suspense>
                                    }
                                />
                                
                                {/* ===== فاز ۹: تیکت‌ها و پیام‌ها ===== */}
                                <Route path="tickets" element={<TicketsList />} />
                                <Route path="work-messages" element={<WorkMessagesList />} />
                                <Route path="requests" element={<MyRequests />} />
                                <Route path="requests" element={<MyRequests />} />
                                <Route path="requests/:type/new" element={<RequestNewPage />} />
                                <Route path="requests/:id/edit" element={<RequestEditPage />} />
                                {/* ===== صفحه ۴۰۴ ===== */}
                                <Route path="*" element={<NotFound />} />
                            </Route>
                        </Routes>
                    </Router>
                </AntApp>
            </ConfigProvider>
        </QueryClientProvider>
    );
}

export default App;