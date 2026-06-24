import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  AlertCircle, 
  CheckCircle2, 
  Search,
  Users,
  BookOpen,
  Calendar
} from 'lucide-react';
import { teacherService } from '../../../services/teacherService';
import { gradingPeriodService } from '../../../services/gradingPeriodService';
import { academicYearService } from '../../../services/academicYearService';
import { ClassGrade } from '../../../types/grade';
import { GradingPeriod } from '../../../types/gradingPeriod';

const Gradebook: React.FC = () => {
  const { classId: classIdParam } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>(classIdParam || '');
  const [grades, setGrades] = useState<ClassGrade[]>([]);
  const [gradingPeriods, setGradingPeriods] = useState<GradingPeriod[]>([]);
  const [selectedGP, setSelectedGP] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchMyClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      const currentClass = classes.find(c => c.class_id === selectedClass);
      if (currentClass) {
        fetchGradingPeriods(currentClass.department);
      } else {
        fetchGradingPeriods();
      }
    }
  }, [selectedClass, classes]);

  useEffect(() => {
    if (selectedClass && selectedGP) {
      fetchGrades();
    }
  }, [selectedClass, selectedGP]);

  const fetchMyClasses = async () => {
    try {
      // We need academic year and semester for this. 
      // For simplicity, let's just use what's in the schedule service if we can.
      // Or we might need to fetch academic years first.
      const { data: ayData } = await academicYearService.getAcademicYears();
      const activeAY = ayData?.find(ay => ay.is_active) || ayData?.[0];
      if (activeAY) {
        const { data, error } = await teacherService.getMyTeachingSchedule(activeAY.id, '1st Semester'); // Default to 1st sem
        if (data) {
          setClasses(data);
          if (!selectedClass && data.length > 0) {
            setSelectedClass(data[0].class_id);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch classes', err);
    }
  };

  const fetchGradingPeriods = async (department?: string) => {
    try {
      const { data, error } = await gradingPeriodService.getGradingPeriods({ filter_department: department });
      if (error) throw error;
      if (data) {
        setGradingPeriods(data);
        const active = data.find(gp => gp.is_active) || data[0];
        if (active) {
          setSelectedGP(active.id);
        }
      }
    } catch (err: any) {
      setError('Failed to load grading periods');
      console.error(err);
    }
  };

  const fetchGrades = async () => {
    if (!selectedClass || !selectedGP) return;
    setLoading(true);
    setError('');
    try {
      const { data, error } = await teacherService.getClassGrades(selectedClass, selectedGP);
      if (error) throw error;
      setGrades(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load grades');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (enrollmentId: string, value: string) => {
    setGrades(prev => prev.map(g => 
      g.enrollment_id === enrollmentId ? { ...g, grade_value: value === '' ? null : parseFloat(value) } : g
    ));
  };

  const handleRemarksChange = (enrollmentId: string, value: string) => {
    setGrades(prev => prev.map(g => 
      g.enrollment_id === enrollmentId ? { ...g, remarks: value } : g
    ));
  };

  const saveGrade = async (grade: ClassGrade) => {
    if (!selectedGP) return;
    setSaving(grade.enrollment_id);
    setSuccessMsg('');
    setError('');
    
    try {
      const { error } = await teacherService.upsertStudentGrade(
        grade.enrollment_id,
        selectedGP,
        grade.grade_value || 0,
        grade.remarks
      );
      if (error) throw error;
      setSuccessMsg(`Grade saved for ${grade.first_name} ${grade.last_name}`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save grade');
      console.error(err);
    } finally {
      setSaving(null);
    }
  };

  const filteredGrades = grades.filter(g => 
    `${g.first_name} ${g.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.student_id_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isGPLocked = gradingPeriods.find(gp => gp.id === selectedGP)?.is_active === false;

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gradebook</h1>
            <p className="text-gray-500">Input and manage student grades</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200">
            <BookOpen className="w-4 h-4 text-gray-400" />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm"
            >
              <option value="" disabled>Select Class</option>
              {classes.map(c => (
                <option key={c.class_id} value={c.class_id}>
                  {c.subject_code} - {c.section_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select
              value={selectedGP}
              onChange={(e) => setSelectedGP(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm"
            >
              {gradingPeriods.map(gp => (
                <option key={gp.id} value={gp.id}>
                  {gp.name} {!gp.is_active && '(Locked)'}
                </option>
              ))}
            </select>
          </div>
          
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none w-64"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-700 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5" />
          <p>{successMsg}</p>
        </div>
      )}

      {isGPLocked && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3 text-amber-700">
          <AlertCircle className="w-5 h-5" />
          <p>This grading period is locked. Grades cannot be modified.</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID Number</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Grade</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Remarks</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredGrades.length > 0 ? (
                filteredGrades.map((grade) => (
                  <tr key={grade.enrollment_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{grade.last_name}, {grade.first_name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {grade.student_id_number}
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        step="0.01"
                        value={grade.grade_value ?? ''}
                        onChange={(e) => handleGradeChange(grade.enrollment_id, e.target.value)}
                        disabled={isGPLocked || saving === grade.enrollment_id}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none disabled:bg-gray-100"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={grade.remarks ?? ''}
                        onChange={(e) => handleRemarksChange(grade.enrollment_id, e.target.value)}
                        disabled={isGPLocked || saving === grade.enrollment_id}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none disabled:bg-gray-100"
                        placeholder="Add remarks..."
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => saveGrade(grade)}
                        disabled={isGPLocked || saving === grade.enrollment_id}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {saving === grade.enrollment_id ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Save
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-lg font-medium">No students found</p>
                    <p className="text-sm">There are no students enrolled in this class.</p>
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

export default Gradebook;
