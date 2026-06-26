import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { studentService } from '../../../services/studentService';
import { academicYearService } from '../../../services/academicYearService';
import { StudentSchedule } from '../../../types/student';
import { AcademicYear } from '../../../types/academicYear';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Filter,
  AlertCircle,
  Search
} from 'lucide-react';

const MySchedule: React.FC = () => {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<StudentSchedule[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('1st Semester');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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
    const fetchSchedule = async () => {
      if (!user?.id || !selectedYearId || !selectedSemester) return;

      try {
        setLoading(true);
        const { data, error: scheduleError } = await studentService.getStudentSchedule(
          user.id,
          selectedYearId,
          selectedSemester
        );
        
        if (scheduleError) throw scheduleError;
        setSchedule(data || []);
        setError(null);
      } catch (err: any) {
        console.error('Error loading student schedule:', err);
        setError(err.message || 'Failed to load schedule');
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [user?.id, selectedYearId, selectedSemester]);

  const filteredSchedule = schedule.filter(item => 
    item.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.subject_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${item.teacher_first_name} ${item.teacher_last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (time: string) => {
    if (!time) return '';
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 || 12;
      return `${formattedHour}:${minutes} ${ampm}`;
    } catch {
      return time;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
          <p className="text-gray-600">View your class schedule for the selected semester</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 px-2 text-gray-500 border-r border-gray-100 mr-1">
            <Filter size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Period</span>
          </div>
          
          <select
            value={selectedYearId}
            onChange={(e) => setSelectedYearId(e.target.value)}
            className="text-sm border-none focus:ring-0 bg-gray-50 rounded-md py-1.5 px-3 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
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
            className="text-sm border-none focus:ring-0 bg-gray-50 rounded-md py-1.5 px-3 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
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

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by subject or teacher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
            <Calendar className="w-4 h-4" />
            <span>{filteredSchedule.length} Classes Scheduled</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Subject & Section</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Schedule</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Room</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Instructor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="text-sm text-gray-500">Loading your schedule...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredSchedule.length > 0 ? (
                filteredSchedule.map((item) => (
                  <tr key={item.enrollment_id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">{item.subject_name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-blue-600 font-bold uppercase">{item.subject_code}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500 font-medium">{item.section_name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                          <Calendar size={14} className="text-gray-400" />
                          {item.days_of_week}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Clock size={14} className="text-gray-400" />
                          {formatTime(item.start_time)} - {formatTime(item.end_time)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {item.room_name ? (
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                            <MapPin size={14} className="text-gray-400" />
                            {item.room_name}
                          </div>
                          <span className="text-xs text-gray-500 ml-5">{item.room_building}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">No room assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-[10px]">
                          {item.teacher_first_name[0]}{item.teacher_last_name[0]}
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {item.teacher_first_name} {item.teacher_last_name}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Calendar className="w-10 h-10 text-gray-300" />
                      <p className="font-medium">No classes found for this period.</p>
                      <p className="text-sm">If you believe this is an error, please contact the registrar.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MySchedule;
