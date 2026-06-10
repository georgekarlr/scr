import React, { useEffect, useState } from 'react';
import { Users, Search, Filter, Plus, GraduationCap, School, X, BookOpen, Hash, UserCircle, Eye } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { UserProfile } from '../../../types/auth';
import { Student } from '../../../types/student';
import { Course } from '../../../types/course';
import { courseService } from '../../../services/courseService';
import { studentService } from '../../../services/studentService';
import { sectionService, Section } from '../../../services/sectionService';
import ErrorModal from '../../../components/ui/ErrorModal';
import StatusMessage from '../../../components/ui/StatusMessage';

const StudentProfiles: React.FC = () => {
  const { listSchoolUsers, listUsers, createUser, updateUser, profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYearLevel, setFilterYearLevel] = useState('');
  const [filterCourseId, setFilterCourseId] = useState('');
  const [filterSectionId, setFilterSectionId] = useState('');
  const [filterStudentType, setFilterStudentType] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    studentIdNumber: '',
    studentType: '',
    yearLevel: '',
    sectionId: '',
    courseId: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await studentService.getStudentsList({
      search_term: searchTerm || null,
      filter_year_level: filterYearLevel || null,
      filter_course_id: filterCourseId || null,
      filter_section_id: filterSectionId || null,
      filter_student_type: filterStudentType || null
    });
    if (error) {
      setError(error.message);
    } else if (data) {
      setStudents(data);
    }
    setLoading(false);
  };

  const fetchCourses = async () => {
    const { data } = await courseService.getCourses();
    if (data) setCourses(data);
  };

  const fetchSections = async (courseId?: string | null) => {
    const { data } = await sectionService.getSections({ search_term: courseId });
    if (data) setSections(data);
  };

  useEffect(() => {
    fetchCourses();
    fetchSections();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, filterYearLevel, filterCourseId, filterSectionId, filterStudentType]);

  const handleOpenModal = (student?: Student) => {
    if (student) {
      // Create a temporary UserProfile-like object for editing if needed, 
      // but the form data should be enough.
      setEditingUser({ id: student.student_id } as UserProfile); 
      setFormData({
        email: '', 
        password: '',
        firstName: student.first_name || '',
        lastName: student.last_name || '',
        studentIdNumber: student.student_id_number || '',
        studentType: student.student_type || '',
        yearLevel: student.year_level || '',
        sectionId: student.section_id || '',
        courseId: student.course_id || ''
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        studentIdNumber: '',
        studentType: '',
        yearLevel: '',
        sectionId: '',
        courseId: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleViewStudent = async (studentId: string) => {
    setLoading(true);
    const { data, error } = await studentService.getStudentProfile(studentId);
    if (error) {
      setError(error.message);
    } else if (data) {
      setSelectedStudent(data);
      setIsViewModalOpen(true);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    let result;
    if (editingUser) {
      result = await studentService.updateStudentProfile({
        studentId: editingUser.id,
        firstName: formData.firstName,
        lastName: formData.lastName,
        studentIdNumber: formData.studentIdNumber,
        studentType: formData.studentType,
        yearLevel: formData.yearLevel,
        courseId: formData.courseId,
        sectionId: formData.sectionId
      });
    } else {
      const metadata = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: 'student',
        school_id: profile?.school_id || '',
        student_type: formData.studentType,
        student_id_number: formData.studentIdNumber,
        year_level: formData.yearLevel,
        section_id: formData.sectionId,
        course_id: formData.courseId
      };
      result = await createUser(formData.email, formData.password, metadata);
    }

    if (result.error) {
      setError(result.error.message);
    } else {
      setIsModalOpen(false);
      fetchUsers();
    }
    setSubmitting(false);
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Profiles</h1>
          <p className="text-gray-600">View and manage student information and academic records.</p>
        </div>
      </div>

      <ErrorModal 
        isOpen={!!error} 
        message={error} 
        onClose={() => setError('')} 
      />

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search students by name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <select 
            value={filterStudentType}
            onChange={(e) => setFilterStudentType(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">All Types</option>
            <option value="regular">Regular</option>
            <option value="irregular">Irregular</option>
          </select>
          <select 
            value={filterYearLevel}
            onChange={(e) => setFilterYearLevel(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">All Years</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
          </select>
          <select 
            value={filterCourseId}
            onChange={(e) => {
              setFilterCourseId(e.target.value);
              setFilterSectionId(''); // Reset section when course changes
              fetchSections(e.target.value || null);
            }}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">All Courses</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.code}</option>
            ))}
          </select>
          <select 
            value={filterSectionId}
            onChange={(e) => setFilterSectionId(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">All Sections</option>
            {sections.map(section => (
              <option key={section.id} value={section.id}>{section.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Student</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Course</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Year Level</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                    <p className="mt-2">Loading students...</p>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                    No students found.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <StudentRow 
                    key={student.student_id} 
                    student={student} 
                    onEdit={() => handleOpenModal(student)} 
                    onView={() => handleViewStudent(student.student_id)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                {editingUser ? 'Edit Student' : 'Enroll New Student'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">First Name</label>
                  <input
                    required
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Last Name</label>
                  <input
                    required
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Student ID Number</label>
                <input
                  required
                  type="text"
                  value={formData.studentIdNumber}
                  onChange={(e) => setFormData({...formData, studentIdNumber: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {!editingUser && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Email Address</label>
                    <input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Password</label>
                    <input
                      required
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Student Type</label>
                  <select
                    value={formData.studentType}
                    onChange={(e) => setFormData({...formData, studentType: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select Type</option>
                    <option value="regular">Regular</option>
                    <option value="irregular">Irregular</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Year Level</label>
                  <select
                    value={formData.yearLevel}
                    onChange={(e) => setFormData({...formData, yearLevel: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select Year</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Course</label>
                  <select
                    value={formData.courseId}
                    onChange={(e) => {
                      setFormData({...formData, courseId: e.target.value, sectionId: ''});
                      fetchSections(e.target.value || null);
                    }}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select Course</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>{course.name} ({course.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Section</label>
                <select
                  value={formData.sectionId}
                  onChange={(e) => setFormData({...formData, sectionId: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Select Section</option>
                  {sections.map(section => (
                    <option key={section.id} value={section.id}>{section.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingUser ? 'Update Student' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* View Modal */}
      {isViewModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-blue-600 text-white">
              <h3 className="text-xl font-bold">Student Profile</h3>
              <button onClick={() => setIsViewModalOpen(false)} className="text-white/80 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-start gap-6 mb-8">
                <div className="h-24 w-24 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
                  <UserCircle size={48} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedStudent.first_name} {selectedStudent.last_name}
                      </h2>
                      <p className="text-gray-500 font-medium">Student ID: {selectedStudent.student_id_number || 'N/A'}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      selectedStudent.student_type === 'regular' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {selectedStudent.student_type || 'Regular'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Course</label>
                    <p className="text-gray-900 font-semibold">{selectedStudent.course_name || 'N/A'}</p>
                    <p className="text-sm text-gray-500">{selectedStudent.course_code}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Year Level</label>
                    <p className="text-gray-900 font-semibold">{selectedStudent.year_level || 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Section</label>
                    <p className="text-gray-900 font-semibold">{selectedStudent.section_name || 'Not Assigned'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Enrollment Date</label>
                    <p className="text-gray-900 font-semibold">
                      {selectedStudent.created_at ? new Date(selectedStudent.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-6 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StudentRow: React.FC<{ student: Student; onEdit: () => void; onView: () => void }> = ({ student, onEdit, onView }) => (
  <tr className="hover:bg-gray-50 transition-colors">
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
          <UserCircle size={20} />
        </div>
        <div>
          <p className="font-medium text-gray-900">
            {student.first_name} {student.last_name}
          </p>
          <p className="text-sm text-gray-500">
            ID: {student.student_id_number || 'No ID Number'}
          </p>
        </div>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="flex flex-col">
        <span className="font-semibold text-sm text-gray-900">{student.course_code || 'N/A'}</span>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="flex flex-col">
        <span className="text-sm text-gray-900">{student.year_level || 'N/A'}</span>
        <span className="text-xs text-gray-500">{student.section_name || 'No Section'}</span>
      </div>
    </td>
    <td className="px-6 py-4 text-right">
      <div className="flex justify-end gap-3">
        <button 
          onClick={onView}
          className="text-gray-600 hover:text-blue-600 transition-colors"
          title="View Details"
        >
          <Eye size={18} />
        </button>
        <button 
          onClick={onEdit}
          className="text-blue-600 hover:text-blue-800 text-sm font-bold uppercase tracking-wider"
        >
          Edit
        </button>
      </div>
    </td>
  </tr>
);

export default StudentProfiles;
