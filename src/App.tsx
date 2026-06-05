import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SidebarProvider, useSidebar } from './contexts/SidebarContext';
import { Menu } from 'lucide-react';

// Components
import LoginForm from './components/auth/LoginForm';
import ForgotPasswordForm from './components/auth/ForgotPasswordForm';
import UpdatePasswordForm from './components/auth/UpdatePasswordForm';
import ConfirmAuth from './components/auth/ConfirmAuth';

// Layout
import Sidebar from './components/layout/Sidebar';
import DashboardOverview from './pages/dashboard/DashboardOverview';
import StaffManagement from './pages/dashboard/admin/StaffManagement';
import StudentRoster from './pages/dashboard/student/StudentRoster';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toggle } = useSidebar();
  
  return (
    <div className="flex h-screen bg-gray-50 flex-col">
      {/* Navigation Bar (Mobile Toggle) */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:hidden justify-between">
        <h1 className="text-xl font-bold text-blue-600">SMS</h1>
        <button 
          onClick={toggle}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
        >
          <Menu size={24} />
        </button>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto p-4 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <SidebarProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginForm />} />
            <Route path="/forgot-password" element={<ForgotPasswordForm />} />
            <Route path="/update-password" element={<UpdatePasswordForm />} />
            <Route path="/confirm" element={<ConfirmAuth />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard/*"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Routes>
                      <Route index element={<DashboardOverview />} />
                      <Route path="account" element={<div>Account Settings (Coming Soon)</div>} />
                      <Route path="staff" element={<StaffManagement />} />
                      <Route path="roster" element={<StudentRoster />} />
                      
                      {/* Generic Placeholders for other routes */}
                      <Route path="departments" element={<div>Departments Management (Coming Soon)</div>} />
                      <Route path="subjects" element={<div>Subjects Management (Coming Soon)</div>} />
                      <Route path="settings" element={<div>System Settings (Coming Soon)</div>} />
                      <Route path="approvals" element={<div>User Approvals (Coming Soon)</div>} />
                      <Route path="directory" element={<div>Staff Directory (Coming Soon)</div>} />
                      <Route path="classes" element={<div>Classes Management (Coming Soon)</div>} />
                      <Route path="enrollment" element={<div>Enrollment Management (Coming Soon)</div>} />
                      <Route path="requests" element={<div>Requests Inbox (Coming Soon)</div>} />
                      <Route path="my-classes" element={<div>My Classes (Coming Soon)</div>} />
                      <Route path="student-request" element={<div>Add Student Request (Coming Soon)</div>} />
                      <Route path="gradebook" element={<div>Gradebook (Coming Soon)</div>} />
                      <Route path="attendance-history" element={<div>Attendance Records (Coming Soon)</div>} />
                      <Route path="my-grades" element={<div>My Grades (Coming Soon)</div>} />
                      <Route path="my-attendance" element={<div>My Attendance (Coming Soon)</div>} />
                      
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Default Route */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </SidebarProvider>
    </AuthProvider>
  );
};

export default App;
