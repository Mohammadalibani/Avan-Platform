// frontend/src/App.tsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp, Spin } from 'antd';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';

import Layout from './components/Layout/Layout';
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard';
import ProjectsList from './components/Projects/ProjectsList';
import ProjectDetail from './components/Projects/ProjectDetail';
import TasksList from './components/Tasks/TasksList';
import UsersList from './components/Users/UsersList';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuthStore();
    
    if (isLoading) {
        return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 50 }} />;
    }
    
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    return <>{children}</>;
};

function App() {
    const { checkAuth } = useAuthStore();
    
    useEffect(() => {
        checkAuth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    return (
        <ConfigProvider theme={{ token: { colorPrimary: '#1890ff' } }}>
            <AntApp>
                {/* اضافه کردن future flags برای React Router v7 */}
                <Router
                    future={{
                        v7_startTransition: true,
                        v7_relativeSplatPath: true,
                    }}
                >
                    <Toaster position="top-right" />
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                            <Route index element={<Dashboard />} />
                            <Route path="projects" element={<ProjectsList />} />
                            <Route path="projects/:id" element={<ProjectDetail />} />
                            <Route path="tasks" element={<TasksList />} />
                            <Route path="users" element={<UsersList />} />
                        </Route>
                    </Routes>
                </Router>
            </AntApp>
        </ConfigProvider>
    );
}

export default App;