import React, { useEffect, useState, useCallback } from 'react';
import {
  Search,
  X,
  UserPlus,
  GraduationCap,
  Users,
  BookOpen,
  Calendar,
  ChevronRight,
  Trash2,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { enrollmentService } from '../../../services/enrollmentService';
import { studentService } from '../../../services/studentService';
import { academicYearService } from '../../../services/academicYearService';
import { Student, StudentFilters } from '../../../types/student';
import { Class, ClassFilters } from '../../../types/class';
import { ClassRosterItem } from '../../../types/enrollment';
import { AcademicYear } from '../../../types/academicYear';
import ErrorModal from '../../../components/ui/ErrorModal';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const formatSchedules = (cls: Class) => {
  if (!cls.schedules || cls.schedules.length === 0) return 'No schedule';
  return cls.schedules
    .map((s) => `${s.days_of_week} ${s.start_time}–${s.end_time}`)
    .join(', ');
};

// Extended roster item that carries display fields from StudentSchedule
interface EnrolledClassDisplay extends ClassRosterItem {
  _subject_code: string;
  _subject_name: string;
  _units: number;
  _section_name: string;
  _teacher: string;
  _schedule: string;
  _room: string | null;
}

const EnrollByStudent: React.FC = () => {
  // ── Students list state ──────────────────────────────────────────
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentFilters, setStudentFilters] = useState<StudentFilters>({
    filter_department: '',
    filter_year_level: '',
  });

  // ── Selected student state ───────────────────────────────────────
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // ── Enrolled classes state ───────────────────────────────────────
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClassDisplay[]>([]);
  const [enrolledLoading, setEnrolledLoading] = useState(false);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('1st Semester');

  // ── Enroll-in-class modal state ──────────────────────────────────
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [availableClasses, setAvailableClasses] = useState<Class[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [classSearch, setClassSearch] = useState('');
  const [classFilters, setClassFilters] = useState<ClassFilters>({
    filter_department: '',
    filter_semester: '',
  });
  const [enrollingClassId, setEnrollingClassId] = useState<string | null>(null);

  // ── Unenroll confirm state ───────────────────────────────────────
  const [unenrollTarget, setUnenrollTarget] = useState<EnrolledClassDisplay | null>(null);
  const [unenrollLoading, setUnenrollLoading] = useState(false);

  // ── Error state ──────────────────────────────────────────────────
  const [error, setError] = useState('');

  // ─────────────────────────────────────────────
  // Fetch: Students
  // ─────────────────────────────────────────────
  const fetchStudents = useCallback(async () => {
    setStudentsLoading(true);
    const { data, error } = await studentService.getStudentsList({
      search_term: studentSearch || null,
      filter_department: studentFilters.filter_department || null,
      filter_year_level: studentFilters.filter_year_level || null,
    });
    if (error) setError((error as any).message || 'Failed to load students');
    else if (data) setStudents(data);
    setStudentsLoading(false);
  }, [studentSearch, studentFilters]);

  useEffect(() => {
    const t = setTimeout(fetchStudents, 300);
    return () => clearTimeout(t);
  }, [fetchStudents]);

  // ─────────────────────────────────────────────
  // Fetch: Academic Years (once)
  // ─────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const { data } = await academicYearService.getAcademicYears();
      if (data) {
        setAcademicYears(data);
        const active = data.find((y) => y.is_active);
        if (active) setSelectedYearId(active.id);
        else if (data.length > 0) setSelectedYearId(data[0].id);
      }
    };
    load();
  }, []);

  // ─────────────────────────────────────────────
  // Fetch: Student's enrolled class roster
  // ─────────────────────────────────────────────
  const fetchEnrolledClasses = useCallback(
    async (student: Student) => {
      if (!student || !selectedYearId || !selectedSemester) {
        return;
      }
      setEnrolledLoading(true);
      // getStudentSchedule returns StudentSchedule[] which includes enrollment_id
      const { data, error } = await studentService.getStudentSchedule(
        student.student_id,
        selectedYearId,
        selectedSemester
      );
      if (error) {
        setError((error as any).message || 'Failed to load enrolled classes');
        setEnrolledLoading(false);
        return;
      }
      if (data) {
        const mapped: EnrolledClassDisplay[] = data.map((s) => ({
          enrollment_id: s.enrollment_id,
          student_id: student.student_id,
          student_id_number: student.student_id_number ?? '',
          first_name: student.first_name,
          last_name: student.last_name,
          course_code: student.course_code,
          year_level: student.year_level ?? '',
          enrolled_at: '',
          _subject_code: s.subject_code,
          _subject_name: s.subject_name,
          _units: s.units,
          _section_name: s.section_name,
          _teacher: `${s.teacher_last_name}, ${s.teacher_first_name}`,
          _schedule: s.days_of_week
            ? `${s.days_of_week} ${s.start_time ?? ''}–${s.end_time ?? ''}`
            : 'No schedule',
          _room: s.room_name
            ? `${s.room_name}${s.room_building ? ', ' + s.room_building : ''}`
            : null,
        }));
        setEnrolledClasses(mapped);
      }
      setEnrolledLoading(false);
    },
    [selectedYearId, selectedSemester]
  );

  useEffect(() => {
    if (selectedStudent) {
      fetchEnrolledClasses(selectedStudent);
    }
  }, [selectedStudent, selectedYearId, selectedSemester, fetchEnrolledClasses]);

  // ─────────────────────────────────────────────
  // Fetch: Available classes for enrollment modal
  // ─────────────────────────────────────────────
  const fetchAvailableClasses = useCallback(async () => {
    if (!isEnrollModalOpen || !selectedStudent) return;
    setClassesLoading(true);
    const { data, error } = await enrollmentService.getClasses({
      filter_academic_year_id: selectedYearId || undefined,
      filter_semester: classFilters.filter_semester || undefined,
      filter_department: classFilters.filter_department || undefined,
      search_term: classSearch || undefined,
    });
    if (error) setError((error as any).message || 'Failed to load classes');
    else if (data) setAvailableClasses(data);
    setClassesLoading(false);
  }, [isEnrollModalOpen, selectedStudent, selectedYearId, classSearch, classFilters]);

  useEffect(() => {
    const t = setTimeout(fetchAvailableClasses, 300);
    return () => clearTimeout(t);
  }, [fetchAvailableClasses]);

  // ─────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────
  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setEnrolledClasses([]);
  };

  const handleBack = () => {
    setSelectedStudent(null);
    setEnrolledClasses([]);
  };

  const handleEnrollInClass = async (cls: Class) => {
    if (!selectedStudent) return;
    setEnrollingClassId(cls.id);
    const { error } = await enrollmentService.enrollStudent({
      student_id: selectedStudent.student_id,
      class_id: cls.id,
    });
    if (error) {
      setError((error as any).message || 'Enrollment failed');
    } else {
      await fetchEnrolledClasses(selectedStudent);
      setIsEnrollModalOpen(false);
    }
    setEnrollingClassId(null);
  };

  const handleConfirmUnenroll = async () => {
    if (!unenrollTarget || !selectedStudent) return;
    setUnenrollLoading(true);
    const { error } = await enrollmentService.unenrollStudent(unenrollTarget.enrollment_id);
    if (error) {
      setError((error as any).message || 'Unenroll failed');
    } else {
      await fetchEnrolledClasses(selectedStudent);
    }
    setUnenrollTarget(null);
    setUnenrollLoading(false);
  };

  // ─────────────────────────────────────────────
  // Render: Student List Panel
  // ─────────────────────────────────────────────
  const renderStudentList = () => (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
          <Users className="w-7 h-7 text-blue-600" />
          Enroll by Student
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Search and select a student to manage their class enrollments.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name or student ID..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Filter className="w-3 h-3" />
            Filters:
          </div>
          <select
            className="flex-1 min-w-[140px] px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={studentFilters.filter_department || ''}
            onChange={(e) => setStudentFilters({ ...studentFilters, filter_department: e.target.value })}
          >
            <option value="">All Departments</option>
            <option value="College">College</option>
            <option value="Junior High School">Junior High School</option>
            <option value="Senior High School">Senior High School</option>
          </select>
          <select
            className="flex-1 min-w-[140px] px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={studentFilters.filter_year_level || ''}
            onChange={(e) => setStudentFilters({ ...studentFilters, filter_year_level: e.target.value })}
          >
            <option value="">All Year Levels</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
            <option value="Grade 7">Grade 7</option>
            <option value="Grade 8">Grade 8</option>
            <option value="Grade 9">Grade 9</option>
            <option value="Grade 10">Grade 10</option>
            <option value="Grade 11">Grade 11</option>
            <option value="Grade 12">Grade 12</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        {studentsLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm">Loading students...</p>
            </div>
          </div>
        ) : students.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <div className="text-center">
              <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No students found</p>
            </div>
          </div>
        ) : (
          students.map((student) => (
            <button
              key={student.student_id}
              onClick={() => handleSelectStudent(student)}
              className="w-full text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-md transition-all duration-150 flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {student.first_name?.[0]}{student.last_name?.[0]}
                </div>
                <div>
                  <div className="font-semibold text-gray-800">
                    {student.last_name}, {student.first_name}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                    <span className="font-mono">{student.student_id_number ?? 'No ID'}</span>
                    {student.year_level && (
                      <>
                        <span className="text-gray-300">•</span>
                        <span>{student.year_level}</span>
                      </>
                    )}
                    {student.course_code && (
                      <>
                        <span className="text-gray-300">•</span>
                        <span>{student.course_code}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
            </button>
          ))
        )}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────
  // Render: Student Detail Panel
  // ─────────────────────────────────────────────
  const renderStudentDetail = () => {
    if (!selectedStudent) return null;

    return (
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <button
            onClick={handleBack}
            className="mt-1 p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {selectedStudent.first_name?.[0]}{selectedStudent.last_name?.[0]}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {selectedStudent.last_name}, {selectedStudent.first_name}
                </h2>
                <div className="text-sm text-gray-500 flex flex-wrap items-center gap-2">
                  <span className="font-mono">{selectedStudent.student_id_number ?? 'No ID'}</span>
                  {selectedStudent.year_level && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span>{selectedStudent.year_level}</span>
                    </>
                  )}
                  {selectedStudent.course_code && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span>{selectedStudent.course_code}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Period Filters + Enroll Button */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 flex flex-wrap gap-2">
              <select
                className="flex-1 min-w-[160px] px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={selectedYearId}
                onChange={(e) => setSelectedYearId(e.target.value)}
              >
                {academicYears.map((ay) => (
                  <option key={ay.id} value={ay.id}>{ay.name}</option>
                ))}
              </select>
              <select
                className="flex-1 min-w-[140px] px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
              >
                <option value="1st Semester">1st Semester</option>
                <option value="2nd Semester">2nd Semester</option>
                <option value="Summer">Summer</option>
              </select>
            </div>
            <button
              onClick={() => {
                setClassSearch('');
                setClassFilters({ filter_department: '', filter_semester: selectedSemester });
                setIsEnrollModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              Enroll in Class
            </button>
          </div>
        </div>

        {/* Enrolled Classes */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold text-gray-700">Enrolled Classes</h3>
            {!enrolledLoading && (
              <span className="ml-auto text-xs bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                {enrolledClasses.length} class{enrolledClasses.length !== 1 ? 'es' : ''}
              </span>
            )}
          </div>

          {enrolledLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <div className="text-center">
                <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs">Loading classes...</p>
              </div>
            </div>
          ) : enrolledClasses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
              <BookOpen className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">No classes enrolled</p>
              <p className="text-xs mt-1">Click "Enroll in Class" to add classes for this student.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {enrolledClasses.map((item) => (
                <div
                  key={item.enrollment_id}
                  className="flex items-start justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800 text-sm">
                      {item._subject_code} – {item._subject_name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3 h-3" />
                        <span>{item._teacher}</span>
                        {item._section_name && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span>Section {item._section_name}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        <span>{item._schedule}</span>
                      </div>
                      {item._room && (
                        <div className="text-gray-400">{item._room}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    {item._units && (
                      <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                        {item._units} units
                      </span>
                    )}
                    <button
                      onClick={() => setUnenrollTarget(item)}
                      className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Unenroll student from this class"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────
  // Render: Enroll-in-Class Modal
  // ─────────────────────────────────────────────
  const renderEnrollModal = () => {
    if (!isEnrollModalOpen || !selectedStudent) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Enroll in Class</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {selectedStudent.last_name}, {selectedStudent.first_name}
              </p>
            </div>
            <button
              onClick={() => setIsEnrollModalOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-4 border-b border-gray-100 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by subject code, name, or teacher..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={classSearch}
                onChange={(e) => setClassSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <select
                className="flex-1 min-w-[140px] px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={classFilters.filter_department || ''}
                onChange={(e) => setClassFilters({ ...classFilters, filter_department: e.target.value })}
              >
                <option value="">All Departments</option>
                <option value="College">College</option>
                <option value="Junior High School">Junior High School</option>
                <option value="Senior High School">Senior High School</option>
              </select>
              <select
                className="flex-1 min-w-[140px] px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={classFilters.filter_semester || ''}
                onChange={(e) => setClassFilters({ ...classFilters, filter_semester: e.target.value })}
              >
                <option value="">All Semesters</option>
                <option value="1st Semester">1st Semester</option>
                <option value="2nd Semester">2nd Semester</option>
                <option value="Summer">Summer</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
            {classesLoading ? (
              <div className="flex items-center justify-center py-12 text-gray-400">
                <div className="text-center">
                  <div className="w-7 h-7 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm">Loading classes...</p>
                </div>
              </div>
            ) : availableClasses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <BookOpen className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">No classes found</p>
              </div>
            ) : (
              availableClasses.map((cls) => {
                const isFull = cls.enrolled_count >= cls.capacity;
                const isEnrolling = enrollingClassId === cls.id;
                const alreadyEnrolled = enrolledClasses.some(
                  (e) => e._subject_code === cls.subject_code
                );

                return (
                  <div
                    key={cls.id}
                    className="flex items-start justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800 text-sm">
                            {cls.subject_code} – {cls.subject_name}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                            <div>Teacher: {cls.teacher_last_name}, {cls.teacher_first_name}</div>
                            <div>Section: {cls.section_name}</div>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3" />
                              <span>{formatSchedules(cls)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <div
                            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              isFull
                                ? 'bg-red-50 text-red-600'
                                : 'bg-green-50 text-green-700'
                            }`}
                          >
                            {cls.enrolled_count}/{cls.capacity}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">seats</div>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0 self-center">
                      {alreadyEnrolled ? (
                        <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                          <CheckCircle2 className="w-4 h-4" />
                          Enrolled
                        </span>
                      ) : (
                        <button
                          onClick={() => handleEnrollInClass(cls)}
                          disabled={isFull || isEnrolling}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-semibold"
                        >
                          {isEnrolling ? (
                            <div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                          ) : (
                            <UserPlus className="w-3.5 h-3.5" />
                          )}
                          {isFull ? 'Full' : 'Enroll'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────
  // Render: Unenroll Confirmation Modal
  // ─────────────────────────────────────────────
  const renderUnenrollConfirm = () => {
    if (!unenrollTarget) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
          <div className="p-6">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-center text-gray-900 mb-2">Confirm Unenroll</h3>
            <p className="text-sm text-gray-500 text-center">
              Remove <strong>{selectedStudent?.last_name}, {selectedStudent?.first_name}</strong> from{' '}
              <strong>{unenrollTarget._subject_code} – {unenrollTarget._subject_name}</strong>?
            </p>
          </div>
          <div className="flex gap-3 px-6 pb-6">
            <button
              onClick={() => setUnenrollTarget(null)}
              disabled={unenrollLoading}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmUnenroll}
              disabled={unenrollLoading}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors text-sm font-semibold flex items-center justify-center gap-2"
            >
              {unenrollLoading ? (
                <div className="w-4 h-4 border border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Unenroll
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────
  // Main Render
  // ─────────────────────────────────────────────
  return (
    <div className="pb-8">
      {selectedStudent ? renderStudentDetail() : renderStudentList()}

      {renderEnrollModal()}
      {renderUnenrollConfirm()}

      {error && (
        <ErrorModal
          isOpen={true}
          message={error}
          onClose={() => setError('')}
        />
      )}
    </div>
  );
};

export default EnrollByStudent;
