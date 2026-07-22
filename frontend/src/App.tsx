import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import UserList from './pages/users/UserList';
import PersonnelList from './pages/personnel/PersonnelList';
import DepartmentList from './pages/departments/DepartmentList';
import Header from './components/layout/Header';

// ✅ ProtectedRoute با بررسی توکن
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  // اگر در حال بارگذاری است، صبر کن
  if (isLoading) {
    return <div>در حال بارگذاری...</div>;
  }
  
  // اگر احراز هویت نشده، به لاگین هدایت کن
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>
    <Header />
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 pt-[90px]">
      {children}
    </main>
  </>
);

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <Layout>
                <UserList />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/personnel"
          element={
            <ProtectedRoute>
              <Layout>
                <PersonnelList />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/departments"
          element={
            <ProtectedRoute>
              <Layout>
                <DepartmentList />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;