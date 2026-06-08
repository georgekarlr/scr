import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { User, LogOut, LayoutDashboard, Settings, Users, BookOpen, ClipboardList, CheckSquare, ListTodo, Inbox, GraduationCap, RefreshCw } from 'lucide-react';

interface NavItemProps {
  to: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ to, label, icon, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
        isActive
          ? 'bg-blue-50 text-blue-700 font-semibold'
          : 'text-gray-600 hover:bg-gray-100'
      }`
    }
  >
    {icon}
    <span>{label}</span>
  </NavLink>
);

const Sidebar: React.FC = () => {
  const { user, profile, signOut, refreshProfile, loading: authLoading } = useAuth();
  const { isOpen, close } = useSidebar();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const role = profile?.role || user?.user_metadata?.role;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshProfile();
    setIsRefreshing(false);
  };

  // Close sidebar on navigation (mobile)
  React.useEffect(() => {
    close();
  }, [location.pathname, close]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const renderNavLinks = () => {
    switch (role) {
      case 'super_admin':
        return (
          <>
            <NavItem to="/dashboard/settings" label="Settings" icon={<Settings size={18} />} />
            <NavItem to="/dashboard/departments" label="Departments" icon={<Users size={18} />} />
            <NavItem to="/dashboard/student-profiles" label="Student Profiles" icon={<GraduationCap size={18} />} />
            <NavItem to="/dashboard/courses" label="Courses" icon={<GraduationCap size={18} />} />
            <NavItem to="/dashboard/subjects" label="Subjects" icon={<BookOpen size={18} />} />
            <NavItem to="/dashboard/staff" label="Users" icon={<Users size={18} />} />
          </>
        );
      case 'registrar':
        return (
          <>
            <NavItem to="/dashboard/approvals" label="User Approvals" icon={<CheckSquare size={18} />} />
            <NavItem to="/dashboard/student-profiles" label="Student Profiles" icon={<ClipboardList size={18} />} />
            <NavItem to="/dashboard/courses" label="Courses" icon={<GraduationCap size={18} />} />
            <NavItem to="/dashboard/subjects" label="Subjects" icon={<BookOpen size={18} />} />
            <NavItem to="/dashboard/directory" label="Staff Directory" icon={<Users size={18} />} />
          </>
        );
      case 'cashier':
        return (
          <>
            <NavItem to="/dashboard/payments" label="Payments" icon={<ClipboardList size={18} />} />
            <NavItem to="/dashboard/enrollment" label="Enrollment" icon={<Users size={18} />} />
            <NavItem to="/dashboard/requests" label="Requests Inbox" icon={<Inbox size={18} />} />
          </>
        );
      case 'teacher':
        return (
          <>
            <NavItem to="/dashboard/my-classes" label="My Classes" icon={<ListTodo size={18} />} />
            <NavItem to="/dashboard/student-request" label="Add Student Request" icon={<GraduationCap size={18} />} />
            <NavItem to="/dashboard/gradebook" label="Gradebook" icon={<BookOpen size={18} />} />
            <NavItem to="/dashboard/attendance-history" label="Attendance Records" icon={<ClipboardList size={18} />} />
          </>
        );
      case 'student':
        return (
          <>
            <NavItem to="/dashboard/my-grades" label="My Grades" icon={<GraduationCap size={18} />} />
            <NavItem to="/dashboard/my-attendance" label="My Attendance" icon={<ClipboardList size={18} />} />
          </>
        );
      default:
        if (authLoading || isRefreshing) {
          return <p className="px-4 text-xs text-gray-400 italic animate-pulse">Loading profile...</p>;
        }
        return (
          <div className="px-4 flex flex-col gap-2">
            <p className="text-xs text-gray-400 italic">No role assigned</p>
            <button 
              onClick={handleRefresh}
              className="flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase hover:bg-blue-50 w-fit px-2 py-1 rounded transition-colors"
            >
              <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
              Refresh Role
            </button>
          </div>
        );
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={close}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white border-r border-gray-200 
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col p-4 gap-2 h-full lg:h-[calc(100vh-65px)]
        `}
      >
        <div className="mb-6 px-4 hidden lg:block">
          <h1 className="text-2xl font-black text-blue-600 tracking-tight">SMS</h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase">School Management</p>
        </div>
        <div className="mb-4">
          <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Navigation
          </h3>
        </div>
        <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
          <NavItem to="/dashboard" label="Overview" icon={<LayoutDashboard size={18} />} />
          <NavItem to="/dashboard/account" label="Account" icon={<User size={18} />} />
          <hr className="my-2 border-gray-100" />
          {renderNavLinks()}
        </nav>
        <div className="mt-auto pt-4 border-t border-gray-100 flex flex-col gap-2">
          <div className="px-4 flex items-center justify-between">
            <span className="text-[10px] font-bold text-blue-600 uppercase bg-blue-50 px-2 py-1 rounded block w-fit">
              Role: {role?.replace('_', ' ') || (authLoading || isRefreshing ? 'Loading...' : 'None')}
            </span>
            {(!role || isRefreshing) && (
              <button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-1 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                title="Refresh Profile"
              >
                <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
            )}
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
            <span className="font-semibold">Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
