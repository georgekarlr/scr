import React, { useEffect, useState } from 'react';
import { Search, X, Trash2, Calendar, UserPlus, BookOpen, GraduationCap, Users, Filter } from 'lucide-react';
import { enrollmentService } from '../../../services/enrollmentService';
import { academicYearService } from '../../../services/academicYearService';
import { Class, ClassFilters } from '../../../types/class';
import { Student } from '../../../types/student';
import { ClassRosterItem } from '../../../types/enrollment';
import { AcademicYear } from '../../../types/academicYear';
import ErrorModal from '../../../components/ui/ErrorModal';

const EnrollmentManagement: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [roster, setRoster] = useState<ClassRosterItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [loading, setLoading] = useState(true);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [error, setError] = useState('');
  const [classSearch, setClassSearch] = useState('');
  const [filters, setFilters] = useState<ClassFilters>({
    filter_academic_year_id: '',
    filter_semester: '',
    filter_department: ''
  });
  const [studentSearch, setStudentSearch] = useState('');
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [enrollSubmitting, setEnrollSubmitting] = useState(false);

  const fetchClasses = async () => {
    setLoading(true);
    const { data, error } = await enrollmentService.getClasses({ 
      ...filters,
      search_term: classSearch 
    });
    if (error) setError(error.message);
    else if (data) setClasses(data);
    setLoading(false);
  };

  const fetchAcademicYears = async () => {
    const { data, error } = await academicYearService.getAcademicYears();
    if (error) setError(error.message);
    else if (data) {
      setAcademicYears(data);
      const activeYear = data.find(ay => ay.is_active);
      if (activeYear) {
        setFilters(prev => ({ ...prev, filter_academic_year_id: activeYear.id }));
      }
    }
  };

  const fetchRoster = async (classId: string) => {
    setRosterLoading(true);
    const { data, error } = await enrollmentService.getClassRoster(classId);
    if (error) setError(error.message);
    else if (data) setRoster(data);
    setRosterLoading(false);
  };

  const fetchStudents = async () => {
    if (!selectedClass) return;
    const { data, error } = await enrollmentService.getUnenrolledStudents(selectedClass.id, studentSearch);
    if (error) setError(error.message);
    else if (data) setStudents(data);
  };

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchClasses, 300);
    return () => clearTimeout(timer);
  }, [classSearch, filters]);

  useEffect(() => {
    if (isEnrollModalOpen) {
      const timer = setTimeout(fetchStudents, 300);
      return () => clearTimeout(timer);
    }
  }, [studentSearch, isEnrollModalOpen]);

  const handleSelectClass = (cls: Class) => {
    setSelectedClass(cls);
    fetchRoster(cls.id);
  };

  const handleEnroll = async (studentId: string) => {
    if (!selectedClass) return;
    setEnrollSubmitting(true);
    const { error } = await enrollmentService.enrollStudent({
      student_id: studentId,
      class_id: selectedClass.id
    });
    if (error) {
      setError(error.message);
    } else {
      setIsEnrollModalOpen(false);
      fetchRoster(selectedClass.id);
      fetchClasses(); // Refresh counts
    }
    setEnrollSubmitting(false);
  };

  const handleUnenroll = async (enrollmentId: string) => {
    if (!window.confirm('Are you sure you want to unenroll this student?')) return;
    const { error } = await enrollmentService.unenrollStudent(enrollmentId);
    if (error) {
      setError(error.message);
    } else if (selectedClass) {
      fetchRoster(selectedClass.id);
      fetchClasses(); // Refresh counts
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GraduationCap className="w-8 h-8 text-blue-600" />
          Enrollment Management
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold">Select Class</h2>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by subject code, name, or teacher..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={classSearch}
              onChange={(e) => setClassSearch(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
            <select
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={filters.filter_department || ''}
              onChange={(e) => setFilters({ ...filters, filter_department: e.target.value })}
            >
              <option value="">All Departments</option>
              <option value="College">College</option>
              <option value="Junior High School">Junior High School</option>
              <option value="Senior High School">Senior High School</option>
            </select>
            <select
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={filters.filter_academic_year_id || ''}
              onChange={(e) => setFilters({ ...filters, filter_academic_year_id: e.target.value })}
            >
              <option value="">All Years</option>
              {academicYears.map(ay => (
                <option key={ay.id} value={ay.id}>{ay.name}</option>
              ))}
            </select>
            <select
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={filters.filter_semester || ''}
              onChange={(e) => setFilters({ ...filters, filter_semester: e.target.value })}
            >
              <option value="">All Semesters</option>
              <option value="1st Semester">1st Semester</option>
              <option value="2nd Semester">2nd Semester</option>
              <option value="Summer">Summer</option>
            </select>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="text-center py-4">Loading classes...</div>
            ) : classes.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No classes found</div>
            ) : (
              classes.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => handleSelectClass(cls)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedClass?.id === cls.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-blue-800">{cls.subject_code} - {cls.subject_name}</div>
                      <div className="text-sm text-gray-600">Section: {cls.section_name}</div>
                      <div className="text-sm text-gray-600">Teacher: {cls.teacher_last_name}, {cls.teacher_first_name}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" /> {cls.days_of_week} {cls.start_time}-{cls.end_time}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${cls.enrolled_count >= cls.capacity ? 'text-red-600' : 'text-green-600'}`}>
                        {cls.enrolled_count} / {cls.capacity}
                      </div>
                      <div className="text-xs text-gray-500">enrolled</div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Roster / Enrollment */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          {selectedClass ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-500" />
                  <h2 className="text-lg font-semibold">Class Roster</h2>
                </div>
                <button
                  onClick={() => setIsEnrollModalOpen(true)}
                  disabled={selectedClass.enrolled_count >= selectedClass.capacity}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  Enroll Student
                </button>
              </div>

              <div className="space-y-3">
                {rosterLoading ? (
                  <div className="text-center py-4 text-gray-500">Loading roster...</div>
                ) : roster.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg text-gray-500">
                    No students enrolled yet
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-gray-200 text-sm text-gray-600">
                          <th className="pb-2 font-semibold">ID Number</th>
                          <th className="pb-2 font-semibold">Name</th>
                          <th className="pb-2 font-semibold text-center">Year</th>
                          <th className="pb-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {roster.map((item) => (
                          <tr key={item.enrollment_id} className="text-sm">
                            <td className="py-2">{item.student_id_number}</td>
                            <td className="py-2">{item.last_name}, {item.first_name}</td>
                            <td className="py-2 text-center">{item.year_level}</td>
                            <td className="py-2 text-right">
                              <button
                                onClick={() => handleUnenroll(item.enrollment_id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="Unenroll student"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 py-20">
              <GraduationCap className="w-16 h-16 mb-4 opacity-20" />
              <p>Select a class to view its roster and manage enrollment</p>
            </div>
          )}
        </div>
      </div>

      {/* Enrollment Modal */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold">Enroll Student in {selectedClass?.subject_code}</h3>
              <button onClick={() => setIsEnrollModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search student by name or ID number..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
              </div>

              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {students.map((student) => (
                  <div key={student.student_id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                    <div>
                      <div className="font-semibold text-gray-800">{student.last_name}, {student.first_name}</div>
                      <div className="text-sm text-gray-500">{student.student_id_number} • {student.year_level} Year</div>
                    </div>
                    <button
                      onClick={() => handleEnroll(student.student_id)}
                      disabled={enrollSubmitting}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      Enroll
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {error && <ErrorModal message={error} onClose={() => setError('')} isOpen={false} />}
    </div>
  );
};

export default EnrollmentManagement;
