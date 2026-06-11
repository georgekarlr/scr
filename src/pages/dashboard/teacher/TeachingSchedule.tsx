import React, { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, Users, BookOpen, AlertCircle, Search, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { teacherService } from '../../../services/teacherService';
import { academicYearService } from '../../../services/academicYearService';
import { AcademicYear } from '../../../types/academicYear';
import { TeachingSchedule } from '../../../types/teacher';

const TeachingSchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<TeachingSchedule[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedAY, setSelectedAY] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('1st Semester');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (selectedAY && selectedSemester) {
      fetchSchedule();
    }
  }, [selectedAY, selectedSemester]);

  const fetchAcademicYears = async () => {
    try {
      const { data, error } = await academicYearService.getAcademicYears();
      if (error) throw error;
      if (data) {
        setAcademicYears(data);
        const activeAY = data.find(ay => ay.is_active) || data[0];
        if (activeAY) {
          setSelectedAY(activeAY.id);
        }
      }
    } catch (err: any) {
      setError('Failed to load academic years');
      console.error(err);
    }
  };

  const fetchSchedule = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await teacherService.getMyTeachingSchedule(selectedAY, selectedSemester);
      if (error) throw error;
      setSchedules(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load teaching schedule');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teaching Schedule</h1>
          <p className="text-gray-500">View and manage your assigned classes</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select
              value={selectedAY}
              onChange={(e) => setSelectedAY(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm"
            >
              {academicYears.map(ay => (
                <option key={ay.id} value={ay.id}>{ay.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200">
            <BookOpen className="w-4 h-4 text-gray-400" />
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm"
            >
              <option value="1st Semester">1st Semester</option>
              <option value="2nd Semester">2nd Semester</option>
              <option value="Summer">Summer</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : schedules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedules.map((item) => (
            <div key={item.class_id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mb-2">
                      {item.subject_code}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 leading-tight">{item.subject_name}</h3>
                  </div>
                  {item.is_co_teacher && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      Co-Teacher
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-2 text-gray-400" />
                    <span>Section: <strong>{item.section_name}</strong></span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{item.days_of_week || 'TBA'} | {item.start_time || '--:--'} - {item.end_time || '--:--'}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{item.room_name ? `${item.room_name} (${item.room_building})` : 'Room TBA'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex justify-between items-center">
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">
                    Enrolled: <span className="font-semibold text-gray-900">{item.enrolled_students} / {item.max_capacity}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Units: <span className="font-semibold text-gray-900">{item.subject_units}</span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => navigate(`/dashboard/teacher/gradebook/${item.class_id}`)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-indigo-600 text-xs font-semibold rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-colors shadow-sm"
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    Grade Entry
                  </button>
                  <button
                    onClick={() => navigate(`/dashboard/full-gradebook/${item.class_id}`)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Full Gradebook
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No classes found</h3>
          <p className="text-gray-500">You don't have any classes assigned for this semester.</p>
        </div>
      )}
    </div>
  );
};

export default TeachingSchedulePage;
