import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { studentService } from '../../../services/studentService';
import { academicYearService } from '../../../services/academicYearService';
import { StudentReportCard } from '../../../types/student';
import { AcademicYear } from '../../../types/academicYear';
import { 
  BookOpen,
  Search,
  Filter,
  AlertCircle,
  FileText,
} from 'lucide-react';

const MyGrades: React.FC = () => {
  const { user } = useAuth();
  const [reportCard, setReportCard] = useState<StudentReportCard[]>([]);
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
    const fetchReportCard = async () => {
      if (!user?.id || !selectedYearId || !selectedSemester) return;

      try {
        setLoading(true);
        const { data, error: reportError } = await studentService.getStudentReportCard(
          user.id,
          selectedYearId,
          selectedSemester
        );
        
        if (reportError) throw reportError;
        setReportCard(data || []);
        setError(null);
      } catch (err: any) {
        console.error('Error loading student report card:', err);
        setError(err.message || 'Failed to load grades');
      } finally {
        setLoading(false);
      }
    };

    fetchReportCard();
  }, [user?.id, selectedYearId, selectedSemester]);

  const filteredReportCard = reportCard.filter(item => 
    item.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.subject_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get all unique grading periods across all subjects
  const allPeriods = Array.from(new Set(reportCard.flatMap(item => item.grades_list.map(g => g.period_name))));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Grades</h1>
          <p className="text-gray-600">View your academic performance for the selected semester</p>
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
              placeholder="Search subjects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
            <BookOpen className="w-4 h-4" />
            <span>{filteredReportCard.length} Subjects Enrolled</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Units</th>
                {allPeriods.map(period => (
                  <th key={period} className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
                    {period}
                  </th>
                ))}
                <th className="px-6 py-4 text-xs font-bold text-gray-900 uppercase tracking-wider text-center bg-blue-50/50">
                  Final Grade
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={allPeriods.length + 3} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="text-sm text-gray-500">Loading your grades...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredReportCard.length > 0 ? (
                filteredReportCard.map((item) => (
                  <tr key={item.class_id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">{item.subject_name}</span>
                        <span className="text-xs text-gray-500 font-medium">{item.subject_code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-gray-700">{item.units}</span>
                    </td>
                    {allPeriods.map(period => {
                      const gradeEntry = item.grades_list.find(g => g.period_name === period);
                      return (
                        <td key={period} className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className={`text-sm font-bold ${gradeEntry ? 'text-gray-900' : 'text-gray-300'}`}>
                              {gradeEntry ? gradeEntry.grade : '--'}
                            </span>
                            {gradeEntry?.remarks && (
                              <span className="text-[10px] text-gray-400 font-medium uppercase">{gradeEntry.remarks}</span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-6 py-4 text-center bg-blue-50/30">
                      <span className={`text-sm font-bold  text-blue-600`}>
                        {item.final_average ?? '--'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={allPeriods.length + 3} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="w-10 h-10 text-gray-300" />
                      <p className="font-medium">No grades found for this period.</p>
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

export default MyGrades;
