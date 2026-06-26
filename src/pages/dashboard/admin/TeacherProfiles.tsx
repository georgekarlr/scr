import React, { useEffect, useState } from 'react';
import { Search, UserCircle, Calendar, BookOpen, Clock, MapPin, Users, ChevronLeft, Plus, X, Edit2 } from 'lucide-react';
import { teacherService } from '../../../services/teacherService';
import { academicYearService } from '../../../services/academicYearService';
import { subjectService } from '../../../services/subjectService';
import { roomService } from '../../../services/roomService';
import { classService } from '../../../services/classService';
import { TeacherListItem, TeacherProfileData } from '../../../types/teacher';
import { AcademicYear } from '../../../types/academicYear';
import { Subject } from '../../../types/subject';
import { Room } from '../../../types/room';
import StatusMessage from '../../../components/ui/StatusMessage';
import ErrorModal from '../../../components/ui/ErrorModal';

const TeacherProfiles: React.FC = () => {
  const [teachers, setTeachers] = useState<TeacherListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    subject_id: '',
    department: 'College',
    semester: '1st Semester',
    section_name: 'A',
    room_id: '',
    days_of_week: '',
    start_time: '',
    end_time: '',
    capacity: 40
  });

  const fetchTeachers = async () => {
    setLoading(true);
    const { data, error } = await teacherService.getTeachersList(searchTerm);
    if (error) {
      setError(error.message);
    } else if (data) {
      setTeachers(data);
    }
    setLoading(false);
  };

  const fetchAcademicYears = async () => {
    const { data } = await academicYearService.getAcademicYears();
    if (data) {
      setAcademicYears(data);
      const activeYear = data.find(y => y.is_active);
      if (activeYear) {
        setSelectedYearId(activeYear.id);
      } else if (data.length > 0) {
        setSelectedYearId(data[0].id);
      }
    }
  };

  const fetchClassFormData = async () => {
    const [subjectsRes, roomsRes] = await Promise.all([
      subjectService.getSubjects(),
      roomService.getRooms()
    ]);
    if (subjectsRes.data) setSubjects(subjectsRes.data);
    if (roomsRes.data) setRooms(roomsRes.data);
  };

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!selectedTeacherId) {
        fetchTeachers();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedTeacherId]);

  useEffect(() => {
    if (selectedTeacherId && selectedYearId) {
      fetchTeacherProfile(selectedTeacherId, selectedYearId, selectedDepartment);
    }
  }, [selectedTeacherId, selectedYearId, selectedDepartment]);

  const fetchTeacherProfile = async (teacherId: string, yearId: string, department?: string) => {
    setProfileLoading(true);
    const { data, error } = await teacherService.getTeacherProfile(teacherId, yearId, department);
    console.log("Teacher Profile Data:", data);
    if (error) {
      setError(error.message);
    } else if (data) {
      setTeacherProfile(data);
    }
    setProfileLoading(false);
  };

  const handleViewProfile = (teacherId: string) => {
    setSelectedTeacherId(teacherId);
  };

  const handleBack = () => {
    setSelectedTeacherId(null);
    setTeacherProfile(null);
  };

  const handleOpenAddClassModal = (cls?: any) => {
    fetchClassFormData();
    if (cls) {
      setSelectedClassId(cls.class_id);
      // We need to find the subject_id by subject_code since the schedule only has code/name
      // But wait, creating/updating class needs subject_id. 
      // Actually, if we are editing, we should probably have the subject_id.
      // Let's check how ClassManagement does it.
      // In ClassManagement, the class object has subject_id.
      // Here, TeacherScheduleItem does NOT have subject_id. 
      // This is a problem. I might need to fetch the class details or update the RPC.
      // However, for now, let's see if I can find it in the subjects list.
      const subject = subjects.find(s => s.code === cls.subject_code);
      const room = rooms.find(r => r.name === cls.room_name);

      setFormData({
        subject_id: subject?.id || '',
        department: cls.department,
        semester: cls.semester,
        section_name: cls.section_name,
        room_id: room?.id || '',
        days_of_week: cls.days_of_week || '',
        start_time: cls.start_time || '',
        end_time: cls.end_time || '',
        capacity: cls.capacity
      });
    } else {
      setSelectedClassId(null);
      setFormData({
        subject_id: '',
        department: 'College',
        semester: '1st Semester',
        section_name: 'A',
        room_id: '',
        days_of_week: '',
        start_time: '',
        end_time: '',
        capacity: 40
      });
    }
    setIsAddClassModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId || !selectedYearId) return;

    setSubmitting(true);
    
    let result;
    if (selectedClassId) {
      result = await classService.updateClass({
        class_id: selectedClassId,
        ...formData,
        teacher_id: selectedTeacherId,
        academic_year_id: selectedYearId
      });
    } else {
      result = await classService.createClass({
        ...formData,
        teacher_id: selectedTeacherId,
        academic_year_id: selectedYearId
      });
    }

    if (result.error) {
      setError(result.error.message);
    } else {
      setIsAddClassModalOpen(false);
      setSelectedClassId(null);
      setFormData({
        subject_id: '',
        department: 'College',
        semester: '1st Semester',
        section_name: 'A',
        room_id: '',
        days_of_week: '',
        start_time: '',
        end_time: '',
        capacity: 40
      });
      fetchTeacherProfile(selectedTeacherId, selectedYearId, selectedDepartment);
    }
    setSubmitting(false);
  };

  if (selectedTeacherId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ChevronLeft size={20} />
            <span className="font-medium">Back to Teachers List</span>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
              <BookOpen size={18} className="text-gray-400" />
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="text-sm border-none focus:ring-0 bg-transparent font-medium text-gray-700"
              >
                <option value="">All Departments</option>
                <option value="College">College</option>
                <option value="Junior High School">Junior High School</option>
                <option value="Senior High School">Senior High School</option>
              </select>
            </div>

            <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
              <Calendar size={18} className="text-gray-400" />
              <select
                value={selectedYearId}
                onChange={(e) => setSelectedYearId(e.target.value)}
                className="text-sm border-none focus:ring-0 bg-transparent font-medium text-gray-700"
              >
                {academicYears.map(year => (
                  <option key={year.id} value={year.id}>
                    {year.name} {year.is_active ? '(Active)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {profileLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : teacherProfile ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Basic Info Card */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-blue-600 h-24"></div>
                <div className="px-6 pb-6 -mt-12 text-center">
                  <div className="inline-block p-1 bg-white rounded-full mb-4">
                    <div className="bg-gray-100 rounded-full h-24 w-24 flex items-center justify-center">
                      <UserCircle size={48} className="text-gray-400" />
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{teacherProfile.profile.full_name}</h2>
                  <p className="text-sm text-blue-600 font-semibold uppercase tracking-wider mt-1">
                    {teacherProfile.profile.role.replace('_', ' ')}
                  </p>
                  <div className="mt-6 pt-6 border-t border-gray-100 text-left space-y-4">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Calendar size={18} className="text-gray-400" />
                      <span>Joined: {new Date(teacherProfile.profile.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule Section */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <BookOpen size={18} className="text-blue-600" />
                    Teaching Schedule
                  </h3>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleOpenAddClassModal}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      <Plus size={14} />
                      Add Class
                    </button>
                    <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
                      {teacherProfile.schedule.length} Classes
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Subject</th>
                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Section/Sem</th>
                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Schedule</th>
                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Room</th>
                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Enrollment</th>
                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {teacherProfile.schedule.length > 0 ? (
                        teacherProfile.schedule.map((cls) => (
                          <tr key={cls.class_id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-gray-900">{cls.subject_name}</span>
                                <span className="text-xs text-gray-500 font-medium">{cls.subject_code}</span>
                                {cls.is_co_teacher && (
                                  <span className="mt-1 w-fit text-[10px] font-bold bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded uppercase">
                                    Co-Teacher
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col text-sm">
                                <span className="text-gray-900 font-medium">{cls.section_name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500">Sem {cls.semester}</span>
                                  <span className="text-gray-300">•</span>
                                  <span className="text-blue-600 font-medium text-[10px] uppercase">{cls.department}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col text-sm text-gray-600">
                                <div className="flex items-center gap-1.5">
                                  <Clock size={14} className="text-gray-400" />
                                  <span>{cls.days_of_week || 'TBA'}</span>
                                </div>
                                <div className="text-xs ml-5">
                                  {cls.start_time || 'TBA'} - {cls.end_time || 'TBA'}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1.5">
                                <MapPin size={14} className="text-gray-400" />
                                <span>{cls.room_name || 'TBA'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1.5 text-sm">
                                  <Users size={14} className="text-gray-400" />
                                  <span className="font-medium">{cls.enrolled_count}/{cls.capacity}</span>
                                </div>
                                <div className="w-16 h-1 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                                  <div 
                                    className="h-full bg-blue-500 rounded-full" 
                                    style={{ width: `${Math.min(100, (cls.enrolled_count / cls.capacity) * 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleOpenAddClassModal(cls)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit Class"
                              >
                                <Edit2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">
                            No classes assigned for this academic year.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Could not load teacher profile.</p>
          </div>
        )}
        {error && <ErrorModal message={error} onClose={() => setError('')} isOpen={error !== ''} />}

        {isAddClassModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-gray-900">{selectedClassId ? 'Edit Class' : 'Add New Class'}</h3>
              <button
                onClick={() => setIsAddClassModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-gray-700">Subject</label>
                    <select
                      required
                      value={formData.subject_id}
                      onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    >
                      <option value="">Select a subject</option>
                      {subjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.code} - {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Department</label>
                    <select
                      required
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    >
                      <option value="College">College</option>
                      <option value="Junior High School">Junior High School</option>
                      <option value="Senior High School">Senior High School</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Section Name</label>
                    <input
                      type="text"
                      required
                      value={formData.section_name}
                      onChange={(e) => setFormData({ ...formData, section_name: e.target.value })}
                      placeholder="e.g. A, B, Section 1"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Semester</label>
                    <select
                      required
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    >
                      <option value="1st Semester">1st Semester</option>
                      <option value="2nd Semester">2nd Semester</option>
                      <option value="Summer">Summer</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Room</label>
                    <select
                      value={formData.room_id}
                      onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    >
                      <option value="">Select a room (Optional)</option>
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name} {room.building ? `(${room.building})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Capacity</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-gray-700">Schedule (Days of Week)</label>
                    <input
                      type="text"
                      value={formData.days_of_week}
                      onChange={(e) => setFormData({ ...formData, days_of_week: e.target.value })}
                      placeholder="e.g. MWF, TTh, Monday-Friday"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Start Time</label>
                    <input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">End Time</label>
                    <input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-6 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsAddClassModalOpen(false)}
                    className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-200"
                  >
                    {submitting ? (selectedClassId ? 'Updating...' : 'Creating...') : (selectedClassId ? 'Update Class' : 'Create Class')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teacher Directory</h1>
          <p className="text-gray-500">Manage and view teacher profiles and workloads</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {error && <StatusMessage message={error} type="error" onClose={() => setError('')} />}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Teacher</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Active Workload</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Joined Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {teachers.length > 0 ? (
                  teachers.map((teacher) => (
                    <tr key={teacher.teacher_id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-gray-100 rounded-full p-2 group-hover:bg-blue-50 transition-colors">
                            <UserCircle size={24} className="text-gray-400 group-hover:text-blue-600" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{teacher.last_name}, {teacher.first_name}</p>
                            <p className="text-xs text-gray-500 uppercase font-medium tracking-wider">Teacher</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            teacher.active_classes_count > 5 
                              ? 'bg-red-100 text-red-700' 
                              : teacher.active_classes_count === 0
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {teacher.active_classes_count} Classes
                          </span>
                          <span className="text-xs text-gray-400">
                            {teacher.active_classes_count > 5 ? 'High workload' : teacher.active_classes_count === 0 ? 'No active classes' : 'Normal workload'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 font-medium">
                          {new Date(teacher.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleViewProfile(teacher.teacher_id)}
                          className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50 hover:border-blue-600 hover:text-blue-600 transition-all shadow-sm"
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">
                      {searchTerm ? 'No teachers found matching your search.' : 'No teachers registered in the directory.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherProfiles;
