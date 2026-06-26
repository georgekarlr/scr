import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { studentService } from '../../../services/studentService';
import { academicYearService } from '../../../services/academicYearService';
import { StudentDashboardSummary } from '../../../types/student';
import { AcademicYear } from '../../../types/academicYear';
import { 
  GraduationCap, 
  BookOpen, 
  Wallet, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  User as UserIcon,
  Filter
} from 'lucide-react';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<StudentDashboardSummary | null>(null);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('1st Semester');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const semesters = ['1st Semester', '2nd Semester', 'Summer'];

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const { data: years, error: yearsError } = await academicYearService.getAcademicYears();
        if (yearsError) throw yearsError;
        
        if (years) {
          setAcademicYears(years);
          const active = years.find(y => y.is_active);
          if (active) {
            setSelectedYearId(active.id);
          } else if (years.length > 0) {
            setSelectedYearId(years[0].id);
          }
        }
      } catch (err: any) {
        console.error('Error fetching academic years:', err);
        setError(err.message || 'Failed to load academic years');
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchDashboardSummary = async () => {
      if (!user?.id || !selectedYearId || !selectedSemester) return;

      try {
        setLoading(true);
        const { data, error: summaryError } = await studentService.getStudentDashboardSummary(
          user.id,
          selectedYearId,
          selectedSemester
        );
        
        if (summaryError) throw summaryError;
        setSummary(data);
        setError(null);
      } catch (err: any) {
        console.error('Error loading student dashboard summary:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardSummary();
  }, [user?.id, selectedYearId, selectedSemester]);

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-600">Welcome back{summary ? `, ${summary.profile.full_name}` : ''}!</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 px-2 text-gray-500">
            <Filter size={16} />
            <span className="text-xs font-bold uppercase">Filter</span>
          </div>
          
          <select
            value={selectedYearId}
            onChange={(e) => setSelectedYearId(e.target.value)}
            className="text-sm border-none focus:ring-0 bg-gray-50 rounded-md py-1 px-2 font-medium text-gray-700"
          >
            {academicYears.map(year => (
              <option key={year.id} value={year.id}>
                {year.name} {year.is_active ? '(Active)' : ''}
              </option>
            ))}
          </select>

          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="text-sm border-none focus:ring-0 bg-gray-50 rounded-md py-1 px-2 font-medium text-gray-700"
          >
            {semesters.map(sem => (
              <option key={sem} value={sem}>{sem}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-3">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      {!loading && !summary && !error && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-lg flex items-center gap-3">
          <AlertCircle size={20} />
          <p>No dashboard data available for the selected period.</p>
        </div>
      )}

      {summary && (
        <>
          {/* Quick Stats */}
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${loading ? 'opacity-50 transition-opacity' : ''}`}>
            <StatCard 
              icon={<BookOpen className="text-blue-600" />} 
              label="Enrolled Units" 
              value={summary.academics.total_enrolled_units.toString()} 
            />
            <StatCard 
              icon={<TrendingUp className="text-green-600" />} 
              label="Current GWA" 
              value={summary.academics.current_gwa > 0 ? summary.academics.current_gwa.toFixed(2) : 'N/A'} 
            />
            <StatCard 
              icon={<Wallet className={summary.finance.is_cleared ? 'text-green-600' : 'text-red-600'} />} 
              label="Remaining Balance" 
              value={`₱${summary.finance.remaining_balance.toLocaleString()}`}
              subValue={summary.finance.is_cleared ? 'Account Cleared' : 'Payment Required'}
            />
          </div>

          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${loading ? 'opacity-50 transition-opacity' : ''}`}>
            {/* Profile Info */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <UserIcon size={20} className="text-blue-600" />
                Profile Information
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Student ID</p>
                  <p className="font-medium text-gray-900">{summary.profile.student_id_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Student Type</p>
                  <p className="font-medium text-gray-900">{summary.profile.student_type || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Course</p>
                  <p className="font-medium text-gray-900">{summary.profile.course_code || 'N/A'}</p>
                  <p className="text-xs text-gray-500">{summary.profile.course_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Year Level</p>
                  <p className="font-medium text-gray-900">{summary.profile.year_level || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Status Card */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <GraduationCap size={20} className="text-purple-600" />
                Academic Status
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={20} className="text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">Enrollment Status</p>
                      <p className="text-xs text-gray-500">
                        {summary.academics.total_enrolled_units > 0 
                          ? 'You are officially enrolled' 
                          : 'No enrollments found for this period'}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${
                    summary.academics.total_enrolled_units > 0 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {summary.academics.total_enrolled_units > 0 ? 'Enrolled' : 'Not Enrolled'}
                  </span>
                </div>

                <div className={`flex items-center justify-between p-3 rounded-lg ${summary.finance.is_cleared ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex items-center gap-3">
                    {summary.finance.is_cleared ? (
                      <CheckCircle2 size={20} className="text-green-600" />
                    ) : (
                      <AlertCircle size={20} className="text-red-600" />
                    )}
                    <div>
                      <p className={`font-medium ${summary.finance.is_cleared ? 'text-green-900' : 'text-red-900'}`}>Financial Status</p>
                      <p className={`text-xs ${summary.finance.is_cleared ? 'text-green-600' : 'text-red-600'}`}>
                        {summary.finance.is_cleared ? 'Your account is cleared' : 'Outstanding balance detected'}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${
                    summary.finance.is_cleared ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {summary.finance.is_cleared ? 'Cleared' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const StatCard: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  value: string;
  subValue?: string;
}> = ({ icon, label, value, subValue }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
    <div className="p-3 bg-gray-50 rounded-lg">
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      {subValue && <p className="text-xs text-gray-400 font-medium">{subValue}</p>}
    </div>
  </div>
);

export default StudentDashboard;
