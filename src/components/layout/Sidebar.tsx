import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from '../../contexts/SidebarContext';

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
  const { user, profile } = useAuth();
  const { isOpen, close } = useSidebar();
  const location = useLocation();
  const role = profile?.role || user?.user_metadata?.role;

  // Close sidebar on navigation (mobile)
  React.useEffect(() => {
    close();
  }, [location.pathname, close]);

  const renderNavLinks = () => {
    switch (role) {
      case 'school_admin':
        return (
          <>
            <NavItem to="/dashboard/settings" label="Settings" />
            <NavItem to="/dashboard/departments" label="Departments" />
            <NavItem to="/dashboard/subjects" label="Subjects" />
            <NavItem to="/dashboard/staff" label="Staff" />
          </>
        );
      case 'registrar':
        return (
          <>
            <NavItem to="/dashboard/approvals" label="User Approvals" />
            <NavItem to="/dashboard/roster" label="Master Roster" />
            <NavItem to="/dashboard/subjects" label="Subjects" />
            <NavItem to="/dashboard/directory" label="Staff Directory" />
          </>
        );
      case 'moderator':
        return (
          <>
            <NavItem to="/dashboard/classes" label="Classes" />
            <NavItem to="/dashboard/enrollment" label="Enrollment" />
            <NavItem to="/dashboard/requests" label="Requests Inbox" />
          </>
        );
      case 'teacher':
        return (
          <>
            <NavItem to="/dashboard/my-classes" label="My Classes" />
            <NavItem to="/dashboard/student-request" label="Add Student Request" />
            <NavItem to="/dashboard/gradebook" label="Gradebook" />
            <NavItem to="/dashboard/attendance-history" label="Attendance Records" />
          </>
        );
      case 'student':
        return (
          <>
            <NavItem to="/dashboard/my-grades" label="My Grades" />
            <NavItem to="/dashboard/my-attendance" label="My Attendance" />
          </>
        );
      default:
        return <p className="px-4 text-xs text-gray-400 italic">No role assigned</p>;
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
        <div className="mb-4">
          <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Navigation
          </h3>
        </div>
        <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
          <NavItem to="/dashboard" label="Overview" />
          <hr className="my-2 border-gray-100" />
          {renderNavLinks()}
        </nav>
        <div className="mt-auto pt-4 border-t border-gray-100">
          <div className="px-4 py-2">
            <span className="text-[10px] font-bold text-blue-600 uppercase bg-blue-50 px-2 py-1 rounded">
              Role: {role?.replace('_', ' ') || 'Guest'}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
