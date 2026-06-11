import React, { useEffect, useState } from 'react';
import { X, Calendar, Clock, MapPin, Search, AlertCircle } from 'lucide-react';
import { studentService } from '../../services/studentService';
import { academicYearService } from '../../services/academicYearService';
import { Student, StudentSchedule } from '../../types/student';
import { AcademicYear } from '../../types/academicYear';

interface StudentScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
}

const StudentScheduleModal: React.FC<StudentScheduleModalProps> = ({ isOpen, onClose, student }) => {
  const [schedule, setSchedule] = useState<StudentSchedule[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('1st Semester');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const semesters = ['1st Semester', '2nd Semester', 'Summer'];

  useEffect(() => {
    if (isOpen) {
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
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!student?.student_id || !selectedYearId || !selectedSemester || !isOpen) return;

      try {
        setLoading(true);
        const { data, error: scheduleError } = await studentService.getStudentSchedule(
          student.student_id,
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
  }, [student?.student_id, selectedYearId, selectedSemester, isOpen]);

  const formatTime = (time: string) => {
    if (!time) return '';
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 || 12;
      return `${formattedHour}:${minutes} ${ampm}`;
    } catch (e) {
      return time;
    }
  };

  if (!isOpen) return null;

  const filteredSchedule = schedule.filter(item => 
    item.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.subject_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${item.teacher_first_name} ${item.teacher_last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-blue-600 text-white shrink-0">
          <div className="flex items-center gap-2">
            <Calendar size={24} />
            <div>
              <h3 className="text-xl font-bold">Student Schedule</h3>
              {student && (
                <p className="text-xs text-blue-100 font-medium">
                  {student.first_name} {student.last_name} | {student.student_id_number}
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-4 bg-gray-50 shrink-0">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Year:</label>
            <select
              value={selectedYearId}
              onChange={(e) => setSelectedYearId(e.target.value)}
              className="text-sm border-gray-200 rounded-lg py-1.5 px-3 font-medium text-gray-700 focus:ring-blue-500 focus:border-blue-500"
            >
              {academicYears.map(year => (
                <option key={year.id} value={year.id}>
                  {year.name} {year.is_active ? '(Active)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Semester:</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="text-sm border-gray-200 rounded-lg py-1.5 px-3 font-medium text-gray-700 focus:ring-blue-500 focus:border-blue-500"
            >
              {semesters.map(sem => (
                <option key={sem} value={sem}>{sem}</option>
              ))}
            </select>
          </div>

          <div className="relative flex-1 max-w-xs ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search subjects or teachers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-3">
              <AlertCircle size={20} />
              <p>{error}</p>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
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
                          <p className="text-sm text-gray-500">Loading schedule...</p>
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
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end shrink-0 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentScheduleModal;
