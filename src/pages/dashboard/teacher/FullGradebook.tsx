import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search,
  Users,
  Calendar,
  Download,
  Filter,
  AlertCircle,
  GraduationCap
} from 'lucide-react';
import { useGradebook } from '../../../hooks/useGradebook';
import { teacherService } from '../../../services/teacherService';
import { academicYearService } from '../../../services/academicYearService';
import * as XLSX from 'xlsx';

const FullGradebook: React.FC = () => {
  const { classId: classIdParam } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { gradebook, loading, error, fetchGradebook, clearGradebook } = useGradebook();
  
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>(classIdParam || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<string>('1st Semester');
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [selectedAY, setSelectedAY] = useState<string>('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedAY) {
      fetchMyClasses();
    }
  }, [selectedAY, selectedSemester]);

  useEffect(() => {
    if (selectedClass) {
      fetchGradebook(selectedClass);
    } else {
      clearGradebook();
    }
  }, [selectedClass, fetchGradebook, clearGradebook]);

  const fetchInitialData = async () => {
    try {
      const { data: ayData } = await academicYearService.getAcademicYears();
      if (ayData) {
        setAcademicYears(ayData);
        const activeAY = ayData.find(ay => ay.is_active) || ayData[0];
        if (activeAY) {
          setSelectedAY(activeAY.id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch initial data', err);
    }
  };

  const fetchMyClasses = async () => {
    try {
      const { data } = await teacherService.getMyTeachingSchedule({
        academicYearId: selectedAY,
        semester: selectedSemester
      });
      if (data) {
        setClasses(data);
        if (data.length > 0) {
          const classExists = data.some(c => c.class_id === selectedClass);
          if (!classExists) {
            setSelectedClass(data[0].class_id);
          }
        } else {
          setSelectedClass('');
        }
      }
    } catch (err) {
      console.error('Failed to fetch classes', err);
    }
  };

  const exportToExcel = () => {
    if (gradebook.length === 0) return;

    const exportData = gradebook.map(student => {
      const row: any = {
        'ID Number': student.student_id_number,
        'Last Name': student.last_name,
        'First Name': student.first_name,
      };

      student.grades_list.forEach(g => {
        row[g.period_name] = g.grade ?? '';
      });

      row['Running Average'] = student.running_average;
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Gradebook');
    XLSX.writeFile(workbook, `Gradebook_${selectedClass}.xlsx`);
  };

  const filteredGradebook = gradebook.filter(student => 
    `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_id_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get all unique period names for columns
  const allPeriods = Array.from(new Set(gradebook.flatMap(s => s.grades_list.map(g => g.period_name))));

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard/my-classes')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Master Class Gradebook</h1>
            <p className="text-gray-500">View comprehensive student performance across all grading periods</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select
              value={selectedAY}
              onChange={(e) => setSelectedAY(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm font-medium"
            >
              {academicYears.map(ay => (
                <option key={ay.id} value={ay.id}>
                  {ay.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm font-medium"
            >
              <option value="1st Semester">1st Semester</option>
              <option value="2nd Semester">2nd Semester</option>
              <option value="Summer">Summer</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
            <GraduationCap className="w-4 h-4 text-gray-400" />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm font-medium"
            >
              {classes.length > 0 ? (
                classes.map(c => (
                  <option key={c.class_id} value={c.class_id}>
                    {c.subject_code} - {c.section_name}
                  </option>
                ))
              ) : (
                <option value="">No classes found</option>
              )}
            </select>
          </div>

          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-semibold">Export</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users className="w-4 h-4" />
            <span>{filteredGradebook.length} Students Enrolled</span>
          </div>
        </div>

        {error && (
          <div className="m-4 p-4 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Student Information</th>
                {allPeriods.map(period => (
                  <th key={period} className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
                    {period}
                  </th>
                ))}
                <th className="px-6 py-4 text-xs font-bold text-gray-900 uppercase tracking-wider text-center bg-indigo-50/50">
                  Running Average
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={allPeriods.length + 2} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                      <p className="text-sm text-gray-500">Loading gradebook data...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredGradebook.length > 0 ? (
                filteredGradebook.map((student) => (
                  <tr key={student.enrollment_id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                          {student.first_name[0]}{student.last_name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{student.last_name}, {student.first_name}</p>
                          <p className="text-xs text-gray-500 font-medium">{student.student_id_number}</p>
                        </div>
                      </div>
                    </td>
                    {allPeriods.map(period => {
                      const gradeEntry = student.grades_list.find(g => g.period_name === period);
                      return (
                        <td key={period} className="px-6 py-4 text-center">
                          <span className={`text-sm font-semibold ${gradeEntry && gradeEntry.grade !== null ? 'text-gray-900' : 'text-gray-300'}`}>
                            {gradeEntry?.grade ?? 'N/A'}
                          </span>
                        </td>
                      );
                    })}
                    <td className="px-6 py-4 text-center bg-indigo-50/30">
                      <span className={`text-sm font-bold text-blue-600`}>
                        {student.running_average ? student.running_average.toFixed(2) : '--'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={allPeriods.length + 2} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Filter className="w-8 h-8 text-gray-300" />
                      <p>No students found matching your criteria</p>
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

export default FullGradebook;
