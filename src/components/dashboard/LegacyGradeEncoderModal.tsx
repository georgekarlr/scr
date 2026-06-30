import React, { useEffect, useState } from 'react';
import { X, BookOpen, AlertTriangle, CheckCircle, ChevronDown, Search } from 'lucide-react';
import { enrollmentService } from '../../services/enrollmentService';
import { subjectService } from '../../services/subjectService';
import { courseService } from '../../services/courseService';
import { academicYearService } from '../../services/academicYearService';
import { Student } from '../../types/student';
import { Subject } from '../../types/subject';
import { Course } from '../../types/course';
import { AcademicYear } from '../../types/academicYear';
import { YEAR_LEVELS } from '../../constants/academic';

interface LegacyGradeEncoderModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onSaveSuccess?: () => void;
}

const SEMESTERS = ['1st Semester', '2nd Semester', 'Summer'];
const ALL_YEAR_LEVELS = Object.values(YEAR_LEVELS).flat();

const initialForm = {
  subjectId: '',
  academicYearId: '',
  semester: '1st Semester',
  studentYearLevel: '1st Year',
  studentCourseId: '',
  finalGradeValue: '',
  finalGradeCode: '',
  remarks: '',
};

const LegacyGradeEncoderModal: React.FC<LegacyGradeEncoderModalProps> = ({
  isOpen,
  onClose,
  student,
  onSaveSuccess,
}) => {
  const [form, setForm] = useState(initialForm);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [subjectSearch, setSubjectSearch] = useState('');
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    subjectService.getSubjects().then(({ data }) => { if (data) setSubjects(data); });
    courseService.getCourses().then(({ data }) => { if (data) setCourses(data); });
    academicYearService.getAcademicYears().then(({ data }) => { if (data) setAcademicYears(data); });
  }, [isOpen]);

  // Debounced subject search
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      subjectService.getSubjects(subjectSearch || undefined).then(({ data }) => {
        if (data) setSubjects(data);
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [subjectSearch, isOpen]);

  const handleClose = () => {
    setForm(initialForm);
    setSelectedSubject(null);
    setSubjectSearch('');
    setSuccess(false);
    setError('');
    onClose();
  };

  const handleSelectSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    setForm(f => ({ ...f, subjectId: subject.id }));
    setSubjectDropdownOpen(false);
  };

  const validate = () => {
    if (!form.subjectId) return 'Please select a subject.';
    if (!form.academicYearId) return 'Please select the academic year.';
    if (!form.studentCourseId) return 'Please select the course the student was in.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    if (!student) return;

    setSubmitting(true);
    setError('');

    const { error: rpcError } = await enrollmentService.encodeLegacyGrade({
      p_student_id: student.student_id,
      p_subject_id: form.subjectId,
      p_academic_year_id: form.academicYearId,
      p_semester: form.semester,
      p_student_year_level: form.studentYearLevel,
      p_student_course_id: form.studentCourseId,
      p_final_grade_value: form.finalGradeValue ? parseFloat(form.finalGradeValue) : null,
      p_final_grade_code: form.finalGradeCode.trim() || null,
      p_remarks: form.remarks.trim() || null,
    });

    if (rpcError) {
      setError((rpcError as any).message || 'Failed to encode legacy grade. Please try again.');
    } else {
      setSuccess(true);
      setForm(initialForm);
      setSelectedSubject(null);
      setSubjectSearch('');
      if (onSaveSuccess) {
        onSaveSuccess();
      }
    }
    setSubmitting(false);
  };

  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div
          className="px-6 py-5 flex items-center justify-between flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)' }}
        >
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-xl p-2">
              <BookOpen size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Encode Legacy Grade</h3>
              <p className="text-blue-200 text-xs mt-0.5">
                {student.last_name}, {student.first_name} &nbsp;·&nbsp; {student.student_id_number || 'No ID'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-white/60 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>

        {/* Banner */}
        <div className="mx-6 mt-4 mb-0 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex-shrink-0">
          <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-800 leading-relaxed">
            This creates a <strong>ghost enrollment</strong> for a past subject and stores a final grade in the system. Use this only for historical records that weren't previously digitized.
          </p>
        </div>

        {/* Success State */}
        {success ? (
          <div className="flex flex-col items-center justify-center p-10 gap-4 flex-1">
            <div className="bg-green-100 rounded-full p-4">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">Grade Encoded Successfully</p>
              <p className="text-sm text-gray-500 mt-1">The legacy record has been saved to the student's transcript.</p>
            </div>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setSuccess(false)}
                className="px-5 py-2 border border-blue-200 text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition-colors text-sm"
              >
                Encode Another
              </button>
              <button
                onClick={handleClose}
                className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors text-sm"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
            <div className="p-6 space-y-5">

              {/* Subject Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Subject *</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setSubjectDropdownOpen(o => !o)}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-left focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors hover:bg-gray-100"
                  >
                    <span className={selectedSubject ? 'text-gray-900 font-medium text-sm' : 'text-gray-400 text-sm'}>
                      {selectedSubject ? `${selectedSubject.code} – ${selectedSubject.name}` : 'Select a subject…'}
                    </span>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${subjectDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {subjectDropdownOpen && (
                    <div className="absolute z-10 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                      <div className="p-2 border-b border-gray-100">
                        <div className="relative">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            autoFocus
                            placeholder="Search subjects..."
                            value={subjectSearch}
                            onChange={e => setSubjectSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="max-h-44 overflow-y-auto">
                        {subjects.length === 0 ? (
                          <p className="px-4 py-3 text-sm text-gray-400 text-center">No subjects found</p>
                        ) : (
                          subjects.map(s => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => handleSelectSubject(s)}
                              className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors"
                            >
                              <span className="font-semibold text-sm text-blue-800">{s.code}</span>
                              <span className="text-sm text-gray-600"> – {s.name}</span>
                              <span className="text-xs text-gray-400 ml-1">({s.units} units)</span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Academic Year + Semester */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Academic Year *</label>
                  <select
                    value={form.academicYearId}
                    onChange={e => setForm(f => ({ ...f, academicYearId: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-700"
                  >
                    <option value="">Select academic year…</option>
                    {academicYears.map(year => (
                      <option key={year.id} value={year.id}>
                        {year.name} {year.is_active ? '(Active)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Semester *</label>
                  <select
                    value={form.semester}
                    onChange={e => setForm(f => ({ ...f, semester: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Year Level + Course (at the time) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Year Level (Then) *</label>
                  <select
                    value={form.studentYearLevel}
                    onChange={e => setForm(f => ({ ...f, studentYearLevel: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {ALL_YEAR_LEVELS.map(yl => <option key={yl} value={yl}>{yl}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Course (Then) *</label>
                  <select
                    value={form.studentCourseId}
                    onChange={e => setForm(f => ({ ...f, studentCourseId: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select course…</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.code} – {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Grade Value + Grade Code */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Final Grade</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="Numeric grade (e.g. 1.5)"
                      value={form.finalGradeValue}
                      onChange={e => setForm(f => ({ ...f, finalGradeValue: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-400 mt-1 pl-1">Numeric value (optional)</p>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="e.g. INC, W, P, F"
                      value={form.finalGradeCode}
                      onChange={e => setForm(f => ({ ...f, finalGradeCode: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-400 mt-1 pl-1">Grade code (optional)</p>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Optional remarks or notes..."
                  value={form.remarks}
                  onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <AlertTriangle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 bg-gray-50/50 flex-shrink-0">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
              >
                {submitting ? 'Saving…' : 'Save Legacy Grade'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default LegacyGradeEncoderModal;
