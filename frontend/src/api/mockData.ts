// frontend/src/api/mockData.ts
export const mockUsers = [
    { id: 1, username: 'admin', full_name: 'مدیر سیستم', email: 'admin@avan.com', role: 'admin', is_active: true },
    { id: 2, username: 'ahmadi', full_name: 'رضا احمدی', email: 'ahmadi@avan.com', role: 'user', is_active: true },
    { id: 3, username: 'karimi', full_name: 'سارا کریمی', email: 'karimi@avan.com', role: 'user', is_active: false },
];

export const mockProjects = [
    { id: 1, name: 'پروژه آلفا', description: 'توضیح پروژه آلفا', status: 'active', created_at: '2026-07-01' },
    { id: 2, name: 'پروژه بتا', description: 'توضیح پروژه بتا', status: 'completed', created_at: '2026-06-15' },
    { id: 3, name: 'پروژه گاما', description: 'توضیح پروژه گاما', status: 'pending', created_at: '2026-07-10' },
];

export const mockTasks = [
    { id: 1, title: 'تسک ۱', project_id: 1, status: 'completed', assigned_to: 'احمدی', due_date: '2026-07-20' },
    { id: 2, title: 'تسک ۲', project_id: 1, status: 'pending', assigned_to: 'کریمی', due_date: '2026-07-30' },
    { id: 3, title: 'تسک ۳', project_id: 2, status: 'in_progress', assigned_to: 'محمدی', due_date: '2026-07-25' },
];