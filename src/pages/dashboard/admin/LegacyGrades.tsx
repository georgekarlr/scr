import React, { useEffect, useState, useCallback } from 'react';
import {
  GraduationCap, Search, BookOpen, Archive,
  Edit2, Trash2, Loader2, X, Check, AlertTriangle,
  Plus, Shield,
} from 'lucide-react';
import { enrollmentService } from '../../../services/enrollmentService';
import { studentService } from '../../../services/studentService';
import { academicYearService } from '../../../services/academicYearService';
import { courseService } from '../../../services/courseService';
import { subjectService } from '../../../services/subjectService';
import { SchoolGradeItem } from '../../../types/enrollment';
import { Student } from '../../../types/student';
import { AcademicYear } from '../../../types/academicYear';
import { Course } from '../../../types/course';
import { Subject } from '../../../types/subject';
import { YEAR_LEVELS } from '../../../constants/academic';
import ErrorModal from '../../../components/ui/ErrorModal';
import LegacyGradeEncoderModal from '../../../components/dashboard/LegacyGradeEncoderModal';

const ALL_YEAR_LEVELS = Object.values(YEAR_LEVELS).flat();
const SEMESTERS = ['1st Semester', '2nd Semester', 'Summer'];

const GradeBadge: React.FC<{ value: number | null; code: string | null }> = ({ value, code }) => {
  const display = value !== null ? value.toFixed(2) : (code || '--');
  const isPass = (value !== null && value >= 75) || code === 'P' || code === 'PASSED';
  const hasMark = value !== null || !!code;
  const cls = isPass
    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
    : hasMark
    ? 'bg-red-50 text-red-700 ring-1 ring-red-200'
    : 'bg-gray-100 text-gray-400';
  return (
    <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-black ${cls}`}>
      {display}
    </span>
  );
};

type Tab = 'normal' | 'legacy';

const MasterGradeViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('legacy');
  const [grades, setGrades] = useState<SchoolGradeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [editingGrade, setEditingGrade] = useState<SchoolGradeItem | null>(null);
  const [modalError, setModalError] = useState('');
  const [editForm, setEditForm] = useState({
    subjectId: '',
    academicYearId: '',
    semester: '1st Semester',
    yearLevel: '1st Year',
    courseId: '',
    gradeValue: '',
    gradeCode: '',
    remarks: '',
  });
  const [saving, setSaving] = useState(false);

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [dropdownsLoaded, setDropdownsLoaded] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [studentPickerOpen, setStudentPickerOpen] = useState(false);
  const [encodeStudent, setEncodeStudent] = useState<Student | null>(null);
  const [encodeModalOpen, setEncodeModalOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  const fetchGrades = useCallback(async (search: string) => {
    setLoading(true);
    setPageError('');
    const { data, error } = await enrollmentService.getAllSchoolGrades(activeTab === 'legacy', search || null);
    if (error) setPageError((error as any).message || 'Failed to fetch grades.');
    else setGrades(data || []);
    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    const t = setTimeout(() => fetchGrades(searchTerm), 350);
    return () => clearTimeout(t);
  }, [searchTerm, fetchGrades]);

  const loadDropdowns = useCallback(async () => {
    if (dropdownsLoaded) return;
    const [ay, cr, su] = await Promise.all([
      academicYearService.getAcademicYears(),
      courseService.getCourses(),
      subjectService.getSubjects(),
    ]);
    if (ay.data) setAcademicYears(ay.data);
    if (cr.data) setCourses(cr.data);
    if (su.data) setSubjects(su.data);
    setDropdownsLoaded(true);
  }, [dropdownsLoaded]);

  const handleOpenEdit = async (grade: SchoolGradeItem) => {
    await loadDropdowns();
    setModalError('');
    setEditingGrade(grade);
    setEditForm({
      subjectId: grade.subject_id || '',
      academicYearId: grade.academic_year_id || '',
      semester: grade.semester || '1st Semester',
      yearLevel: grade.year_level_taken || '1st Year',
      courseId: grade.course_id || '',
      gradeValue: grade.grade_value !== null ? String(grade.grade_value) : '',
      gradeCode: grade.grade_code || '',
      remarks: grade.remarks || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingGrade) return;
    setModalError('');

    const numVal = parseFloat(editForm.gradeValue);
    const gradeValue = !isNaN(numVal) ? numVal : null;
    const gradeCode = (!gradeValue && editForm.gradeCode.trim())
      ? editForm.gradeCode.trim().toUpperCase()
      : null;

    if (gradeValue === null && !gradeCode) {
      setModalError('Enter a numeric grade or a grade code (e.g. INC, P, F).');
      return;
    }

    setSaving(true);
    const { error } = await enrollmentService.editMasterGrade({
      gradeId: editingGrade.grade_id,
      enrollmentId: editingGrade.enrollment_id,
      isLegacy: editingGrade.is_legacy,
      gradeValue,
      gradeCode,
      remarks: editForm.remarks.trim() || null,
      yearLevel: editForm.yearLevel || null,
      courseId: editForm.courseId || null,
      subjectId: editingGrade.is_legacy ? (editForm.subjectId || null) : null,
      academicYearId: editingGrade.is_legacy ? (editForm.academicYearId || null) : null,
      semester: editingGrade.is_legacy ? (editForm.semester || null) : null,
    });

    if (error) {
      setModalError((error as any).message || 'Failed to save changes.');
      setSaving(false);
      return;
    }

    setEditingGrade(null);
    setSaving(false);
    fetchGrades(searchTerm);
  };

  const handleDelete = async (grade: SchoolGradeItem) => {
    if (!window.confirm('Delete this legacy grade record? This permanently removes the ghost enrollment and its grade.')) return;
    setDeletingId(grade.grade_id);
    setPageError('');
    const { error } = await enrollmentService.unenrollStudent(grade.enrollment_id);
    if (error) setPageError((error as any).message || 'Failed to delete record.');
    else fetchGrades(searchTerm);
    setDeletingId(null);
  };

  useEffect(() => {
    if (!studentPickerOpen) return;
    const t = setTimeout(async () => {
      setStudentsLoading(true);
      const { data } = await studentService.getStudentsList({ search_term: studentSearch || null });
      if (data) setStudents(data);
      setStudentsLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [studentSearch, studentPickerOpen]);

  const handleSelectEncodeStudent = (student: Student) => {
    setEncodeStudent(student);
    setStudentPickerOpen(false);
    setEncodeModalOpen(true);
  };

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    setGrades([]);
    setSearchTerm('');
    setPageError('');
  };

  const renderTable = () => {
    if (loading && grades.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 size={36} className="animate-spin text-blue-400" />
          <p className="text-sm text-gray-400 font-medium">Loading grades…</p>
        </div>
      );
    }

    if (!loading && grades.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-6">
          <div className={`rounded-2xl p-5 ${activeTab === 'legacy' ? 'bg-amber-50' : 'bg-blue-50'}`}>
            {activeTab === 'legacy'
              ? <Archive size={38} className="text-amber-400" />
              : <BookOpen size={38} className="text-blue-400" />}
          </div>
          <div>
            <p className="font-bold text-gray-800">No {activeTab === 'legacy' ? 'legacy' : 'normal'} grades found</p>
            <p className="text-sm text-gray-400 mt-1">
              {searchTerm
                ? 'Try a different search term.'
                : activeTab === 'legacy'
                ? 'Use "Encode Legacy Grade" to add historical records.'
                : 'Grades are entered by teachers in the Teacher Gradebook.'}
            </p>
          </div>
        </div>
      );
    }

    const isLegacyTab = activeTab === 'legacy';

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse" style={{ minWidth: 980 }}>
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-5 py-3.5 text-[10px] font-black text-gray-500 uppercase tracking-wider">Student</th>
              <th className="px-5 py-3.5 text-[10px] font-black text-gray-500 uppercase tracking-wider">Subject</th>
              <th className="px-5 py-3.5 text-[10px] font-black text-gray-500 uppercase tracking-wider">Academic Year</th>
              <th className="px-5 py-3.5 text-[10px] font-black text-gray-500 uppercase tracking-wider">Semester</th>
              <th className="px-5 py-3.5 text-[10px] font-black text-gray-500 uppercase tracking-wider">Year Level</th>
              <th className="px-5 py-3.5 text-[10px] font-black text-gray-500 uppercase tracking-wider">Grading Period</th>
              <th className="px-5 py-3.5 text-[10px] font-black text-gray-500 uppercase tracking-wider text-center">Grade</th>
              <th className="px-5 py-3.5 text-[10px] font-black text-gray-500 uppercase tracking-wider">Remarks</th>
              <th className="px-5 py-3.5 text-[10px] font-black text-gray-500 uppercase tracking-wider text-center w-28">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {grades.map(grade => {
              const isDeleting = deletingId === grade.grade_id;
              return (
                <tr key={grade.grade_id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="text-xs font-bold text-gray-900 truncate max-w-[150px]">{grade.student_name}</p>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">{grade.student_id_number || '—'}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-xs font-bold text-blue-700">{grade.subject_code}</p>
                    <p className="text-[10px] text-gray-400 truncate max-w-[130px]" title={grade.subject_name}>{grade.subject_name}</p>
                  </td>
                  <td className="px-5 py-3.5 text-xs font-semibold text-gray-700 whitespace-nowrap">{grade.academic_year_name || '—'}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-600 whitespace-nowrap">{grade.semester || '—'}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-600 whitespace-nowrap">{grade.year_level_taken || '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      isLegacyTab
                        ? 'bg-amber-50 text-amber-700 border border-amber-100'
                        : 'bg-purple-50 text-purple-700 border border-purple-100'
                    }`}>
                      {grade.grading_period_name}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <GradeBadge value={grade.grade_value} code={grade.grade_code} />
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-500 max-w-[110px] truncate italic">
                    {grade.remarks || '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(grade)}
                        disabled={isDeleting}
                        title="Edit Grade"
                        className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100 cursor-pointer disabled:opacity-40"
                      >
                        <Edit2 size={11} />
                        Edit
                      </button>
                      {isLegacyTab && (
                        <button
                          onClick={() => handleDelete(grade)}
                          disabled={isDeleting}
                          title="Delete Record"
                          className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 cursor-pointer disabled:opacity-40"
                        >
                          {isDeleting
                            ? <Loader2 size={11} className="animate-spin" />
                            : <Trash2 size={11} />}
                          Del
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderEditModal = () => {
    if (!editingGrade) return null;
    const isLegacy = editingGrade.is_legacy;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
          <div
            className="px-6 py-5 flex items-center justify-between flex-shrink-0"
            style={{ background: isLegacy ? 'linear-gradient(135deg,#78350f,#d97706)' : 'linear-gradient(135deg,#1e3a5f,#2563eb)' }}
          >
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                {isLegacy
                  ? <Archive size={15} className="text-amber-200" />
                  : <BookOpen size={15} className="text-blue-200" />}
                <h3 className="text-base font-bold text-white">
                  Edit {isLegacy ? 'Legacy' : 'Normal'} Grade
                </h3>
              </div>
              <p className="text-xs mt-0.5 truncate max-w-[340px]"
                style={{ color: isLegacy ? '#fde68a' : '#bfdbfe' }}>
                {editingGrade.student_name} · {editingGrade.student_id_number || 'No ID'} · {editingGrade.subject_code}
              </p>
            </div>
            <button
              onClick={() => !saving && setEditingGrade(null)}
              className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className={`mx-6 mt-5 mb-1 flex items-start gap-2.5 rounded-xl px-4 py-3 flex-shrink-0 ${
            isLegacy ? 'bg-amber-50 border border-amber-100' : 'bg-blue-50 border border-blue-100'
          }`}>
            <Shield size={13} className={`mt-0.5 flex-shrink-0 ${isLegacy ? 'text-amber-600' : 'text-blue-500'}`} />
            <p className={`text-[11px] leading-relaxed ${isLegacy ? 'text-amber-900' : 'text-blue-800'}`}>
              {isLegacy
                ? 'Legacy grade — all fields are editable including subject, academic year, and semester.'
                : 'Normal grade — you can edit the grade, year level, and course. Subject/academic year/semester are tied to the class.'}
            </p>
          </div>

          <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
            {isLegacy && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Subject *</label>
                <select
                  value={editForm.subjectId}
                  onChange={e => setEditForm(f => ({ ...f, subjectId: e.target.value }))}
                  disabled={saving}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50"
                >
                  <option value="">Select subject…</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.code} – {s.name}</option>
                  ))}
                </select>
              </div>
            )}

            {isLegacy && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Academic Year *</label>
                  <select
                    value={editForm.academicYearId}
                    onChange={e => setEditForm(f => ({ ...f, academicYearId: e.target.value }))}
                    disabled={saving}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50"
                  >
                    <option value="">Select year…</option>
                    {academicYears.map(ay => (
                      <option key={ay.id} value={ay.id}>{ay.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Semester *</label>
                  <select
                    value={editForm.semester}
                    onChange={e => setEditForm(f => ({ ...f, semester: e.target.value }))}
                    disabled={saving}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50"
                  >
                    {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Year Level</label>
                <select
                  value={editForm.yearLevel}
                  onChange={e => setEditForm(f => ({ ...f, yearLevel: e.target.value }))}
                  disabled={saving}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {ALL_YEAR_LEVELS.map(yl => <option key={yl} value={yl}>{yl}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Course</label>
                <select
                  value={editForm.courseId}
                  onChange={e => setEditForm(f => ({ ...f, courseId: e.target.value }))}
                  disabled={saving}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="">Select course…</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.code} – {c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Final Grade *</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="number" step="0.01" min="0" max="100"
                    placeholder="Numeric (e.g. 85, 1.5)"
                    value={editForm.gradeValue}
                    onChange={e => setEditForm(f => ({ ...f, gradeValue: e.target.value }))}
                    disabled={saving}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <p className="text-[10px] text-gray-400 mt-1 pl-1">Numeric value</p>
                </div>
                <div>
                  <input
                    type="text" placeholder="e.g. INC, W, P, F"
                    value={editForm.gradeCode}
                    onChange={e => setEditForm(f => ({ ...f, gradeCode: e.target.value }))}
                    disabled={saving}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <p className="text-[10px] text-gray-400 mt-1 pl-1">Grade code</p>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Remarks</label>
              <textarea
                rows={2}
                placeholder="Optional remarks…"
                value={editForm.remarks}
                onChange={e => setEditForm(f => ({ ...f, remarks: e.target.value }))}
                disabled={saving}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:opacity-50"
              />
            </div>

            {modalError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertTriangle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{modalError}</p>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-100 flex gap-3 bg-gray-50/50 flex-shrink-0">
            <button
              onClick={() => { setEditingGrade(null); setModalError(''); }}
              disabled={saving}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-colors text-sm cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={saving}
              className={`flex-1 px-4 py-2.5 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 text-sm flex items-center justify-center gap-2 cursor-pointer ${
                isLegacy ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderStudentPicker = () => {
    if (!studentPickerOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh]">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
            <div>
              <h3 className="font-bold text-gray-900">Select Student</h3>
              <p className="text-xs text-gray-400 mt-0.5">Search for the student to encode a legacy grade</p>
            </div>
            <button
              onClick={() => { setStudentPickerOpen(false); setStudentSearch(''); setStudents([]); }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          <div className="px-5 py-3 border-b border-gray-100 flex-shrink-0">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                type="text"
                placeholder="Search by name or student ID…"
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1 px-4 py-2">
            {studentsLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 size={24} className="animate-spin text-amber-500" />
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">
                {studentSearch ? 'No students found.' : 'Type a name or ID to search…'}
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {students.map(s => (
                  <li key={s.student_id}>
                    <button
                      onClick={() => handleSelectEncodeStudent(s)}
                      className="w-full text-left px-3 py-3 rounded-xl hover:bg-amber-50 transition-colors flex items-center gap-3 cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                        {s.first_name?.[0]}{s.last_name?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{s.last_name}, {s.first_name}</p>
                        <p className="text-xs text-gray-400 truncate">
                          {s.student_id_number || 'No ID'} · {s.course_code || 'N/A'} · {s.year_level || 'N/A'}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-10">
      <ErrorModal isOpen={!!pageError} message={pageError} onClose={() => setPageError('')} />

      {/* Page Header */}
      <div
        className="rounded-2xl p-6 text-white shadow-lg overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 55%, #1e40af 100%)' }}
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, #60a5fa 0%, transparent 60%)' }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 flex-shrink-0">
              <GraduationCap size={26} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Master Grade Viewer</h1>
              <p className="text-blue-200 text-sm mt-0.5">
                View and manage all student grades — normal enrollments &amp; legacy records
              </p>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl px-5 py-3 border border-white/10 text-center flex-shrink-0">
            <p className="text-blue-200 text-[10px] uppercase font-bold tracking-wider">Records Shown</p>
            <p className="text-white font-black text-2xl">{grades.length}</p>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

        {/* Tab Bar */}
        <div className="flex items-stretch border-b border-gray-200">
          <button
            onClick={() => switchTab('normal')}
            className={`flex items-center gap-2.5 px-6 py-4 text-sm font-bold border-b-2 transition-all duration-150 cursor-pointer ${
              activeTab === 'normal'
                ? 'border-blue-600 text-blue-700 bg-blue-50/40'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <BookOpen size={16} />
            Normal Grades
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
              activeTab === 'normal' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
            }`}>
              Grade + Year + Course
            </span>
          </button>

          <button
            onClick={() => switchTab('legacy')}
            className={`flex items-center gap-2.5 px-6 py-4 text-sm font-bold border-b-2 transition-all duration-150 cursor-pointer ${
              activeTab === 'legacy'
                ? 'border-amber-500 text-amber-700 bg-amber-50/40'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <Archive size={16} />
            Legacy Grades
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
              activeTab === 'legacy' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
            }`}>
              Full Edit
            </span>
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-4 flex flex-wrap items-center gap-3 border-b border-gray-100 bg-gray-50/30">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search student name, ID, or subject code…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-shadow"
            />
          </div>
          {loading && <Loader2 size={17} className="animate-spin text-blue-400 flex-shrink-0" />}
          {activeTab === 'legacy' && (
            <button
              onClick={() => { setStudentSearch(''); setStudents([]); setStudentPickerOpen(true); }}
              className="ml-auto flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm shadow-sm transition-colors cursor-pointer flex-shrink-0"
            >
              <Plus size={16} />
              Encode Legacy Grade
            </button>
          )}
        </div>

        {/* Info banner */}
        {activeTab === 'normal' ? (
          <div className="mx-6 mt-4 flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <BookOpen size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-blue-900 leading-relaxed">
              <strong>Normal grades</strong> — editable fields: <em>grade value, year level, course</em>.
              Subject, academic year, and semester are tied to the class enrollment and cannot be changed here.
            </p>
          </div>
        ) : (
          <div className="mx-6 mt-4 flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            <Archive size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-amber-900 leading-relaxed">
              <strong>Legacy grades</strong> are historical ghost enrollments. <em>All fields</em> are editable
              including subject, academic year, semester, year level, course, and grade value.
            </p>
          </div>
        )}

        {/* Table */}
        <div className="mt-4 mb-2">
          {renderTable()}
        </div>
      </div>

      {renderEditModal()}
      {renderStudentPicker()}

      {encodeStudent && (
        <LegacyGradeEncoderModal
          isOpen={encodeModalOpen}
          onClose={() => { setEncodeModalOpen(false); setEncodeStudent(null); }}
          student={encodeStudent}
          onSaveSuccess={() => fetchGrades(searchTerm)}
        />
      )}
    </div>
  );
};

export default MasterGradeViewer;
