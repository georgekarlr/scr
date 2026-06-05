import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Users, 
  BookOpen, 
  ClipboardList, 
  TrendingUp,
  Calendar
} from 'lucide-react';

const DashboardOverview: React.FC = () => {
  const { user } = useAuth();
  const role = user?.user_metadata?.role;

  const renderStats = () => {
    switch (role) {
      case 'super_admin':
      case 'registrar':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={<Users className="text-blue-600" />} label="Total Students" value="1,234" />
            <StatCard icon={<Users className="text-green-600" />} label="Total Teachers" value="56" />
            <StatCard icon={<BookOpen className="text-purple-600" />} label="Total Subjects" value="42" />
            <StatCard icon={<TrendingUp className="text-orange-600" />} label="Avg. Attendance" value="94%" />
          </div>
        );
      case 'cashier':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={<Users className="text-blue-600" />} label="Pending Fees" value="12" />
            <StatCard icon={<TrendingUp className="text-green-600" />} label="Collections Today" value="₱24,500" />
            <StatCard icon={<ClipboardList className="text-purple-600" />} label="Requests" value="8" />
            <StatCard icon={<TrendingUp className="text-orange-600" />} label="Growth" value="+12%" />
          </div>
        );
      case 'teacher':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={<Users className="text-blue-600" />} label="My Students" value="150" />
            <StatCard icon={<BookOpen className="text-green-600" />} label="My Classes" value="5" />
            <StatCard icon={<ClipboardList className="text-purple-600" />} label="Pending Grades" value="12" />
            <StatCard icon={<TrendingUp className="text-orange-600" />} label="Class Average" value="88%" />
          </div>
        );
      case 'student':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={<TrendingUp className="text-blue-600" />} label="GPA" value="3.8" />
            <StatCard icon={<ClipboardList className="text-green-600" />} label="Attendance" value="98%" />
            <StatCard icon={<BookOpen className="text-purple-600" />} label="My Subjects" value="8" />
            <StatCard icon={<Calendar className="text-orange-600" />} label="Next Exam" value="June 10" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome back, {user?.user_metadata?.first_name || 'User'}!</p>
      </div>

      {renderStats()}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-blue-600" />
            Upcoming Schedule
          </h2>
          <div className="space-y-4">
            <ScheduleItem time="08:00 AM" subject="Mathematics" room="Room 302" />
            <ScheduleItem time="10:00 AM" subject="Physics" room="Lab A" />
            <ScheduleItem time="01:00 PM" subject="English Literature" room="Room 105" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ClipboardList size={20} className="text-green-600" />
            Recent Announcements
          </h2>
          <div className="space-y-4">
            <AnnouncementItem 
              title="Final Examinations Schedule" 
              date="2 days ago" 
              excerpt="The schedule for the final examinations has been posted on the bulletin board..." 
            />
            <AnnouncementItem 
              title="School Holiday" 
              date="1 week ago" 
              excerpt="Please be informed that there will be no classes on June 12th in observance of..." 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
    <div className="p-3 bg-gray-50 rounded-lg">
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

const ScheduleItem: React.FC<{ time: string; subject: string; room: string }> = ({ time, subject, room }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
    <div>
      <p className="font-semibold text-gray-900">{subject}</p>
      <p className="text-sm text-gray-500">{room}</p>
    </div>
    <div className="text-right">
      <p className="text-sm font-medium text-blue-600">{time}</p>
    </div>
  </div>
);

const AnnouncementItem: React.FC<{ title: string; date: string; excerpt: string }> = ({ title, date, excerpt }) => (
  <div className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
    <div className="flex justify-between items-start mb-1">
      <h3 className="font-medium text-gray-900">{title}</h3>
      <span className="text-xs text-gray-400">{date}</span>
    </div>
    <p className="text-sm text-gray-600 line-clamp-1">{excerpt}</p>
  </div>
);

export default DashboardOverview;
