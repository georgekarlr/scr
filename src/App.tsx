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
import UserManagement from './pages/dashboard/admin/UserManagement.tsx';
import SubjectManagement from './pages/dashboard/admin/SubjectManagement';
import CourseManagement from './pages/dashboard/admin/CourseManagement';
import SectionManagement from './pages/dashboard/admin/SectionManagement';
import StudentProfiles from './pages/dashboard/admin/StudentProfiles';
import TeacherProfiles from './pages/dashboard/admin/TeacherProfiles';
import ClassManagement from './pages/dashboard/admin/ClassManagement';
import AcademicYearManagement from './pages/dashboard/admin/AcademicYearManagement';
import GradingPeriodManagement from './pages/dashboard/admin/GradingPeriodManagement';
import RoomManagement from './pages/dashboard/admin/RoomManagement';
import EnrollmentManagement from './pages/dashboard/admin/EnrollmentManagement';
import TeachingSchedule from './pages/dashboard/teacher/TeachingSchedule';
import Gradebook from './pages/dashboard/teacher/Gradebook';
import FullGradebook from './pages/dashboard/teacher/FullGradebook';
import FeeItems from './pages/dashboard/finance/FeeItems';
import Ledger from './pages/dashboard/finance/Ledger';
import MyLedger from './pages/dashboard/finance/MyLedger';
import StudentDashboard from './pages/dashboard/student/StudentDashboard';
import MyGrades from './pages/dashboard/student/MyGrades';
import MySchedule from './pages/dashboard/student/MySchedule';

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

const   StudentDashboardRedirect: React.FC = () => {
  const { user } = useAuth();
  const role = user?.user_metadata?.role;
  
  if (role === 'student') {
    return <StudentDashboard />;
  }
  
  return <DashboardOverview />;
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
                      <Route index element={<StudentDashboardRedirect />} />
                      <Route path="account" element={<div>Account Settings (Coming Soon)</div>} />
                      <Route path="staff" element={<UserManagement />} />
                      <Route path="student-profiles" element={<StudentProfiles />} />
                      <Route path="teacher-profiles" element={<TeacherProfiles />} />
                      
                      {/* Generic Placeholders for other routes */}
                      <Route path="departments" element={<div>Departments Management (Coming Soon)</div>} />
                      <Route path="subjects" element={<SubjectManagement />} />
                      <Route path="courses" element={<CourseManagement />} />
                      <Route path="sections" element={<SectionManagement />} />
                      <Route path="academic-years" element={<AcademicYearManagement />} />
                      <Route path="grading-periods" element={<GradingPeriodManagement />} />
                      <Route path="rooms" element={<RoomManagement />} />
                      <Route path="settings" element={<div>System Settings (Coming Soon)</div>} />
                      <Route path="approvals" element={<div>User Approvals (Coming Soon)</div>} />
                      <Route path="directory" element={<div>Staff Directory (Coming Soon)</div>} />
                      <Route path="classes" element={<ClassManagement />} />
                      <Route path="enrollment" element={<EnrollmentManagement />} />
                      <Route path="fee-items" element={<FeeItems />} />
                      <Route path="ledger" element={<Ledger />} />
                      {/*<Route path="payments" element={<Ledger />} />*/}
                      <Route path="my-ledger" element={<MyLedger />} />
                      <Route path="requests" element={<div>Requests Inbox (Coming Soon)</div>} />
                      <Route path="my-classes" element={<TeachingSchedule />} />
                      <Route path="teacher/gradebook/:classId" element={<Gradebook />} />
                      <Route path="student-request" element={<div>Add Student Request (Coming Soon)</div>} />
                      <Route path="gradebook" element={<Gradebook />} />
                      <Route path="full-gradebook" element={<FullGradebook />} />
                      <Route path="full-gradebook/:classId" element={<FullGradebook />} />
                      <Route path="attendance-history" element={<div>Attendance Records (Coming Soon)</div>} />
                      <Route path="my-grades" element={<MyGrades />} />
                      <Route path="my-schedule" element={<MySchedule />} />
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
