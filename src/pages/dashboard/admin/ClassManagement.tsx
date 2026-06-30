import React, { useEffect, useState } from 'react';
import { Search, Plus, X, Edit2, Trash2, Calendar, MapPin, Users as UsersIcon, Clock } from 'lucide-react';
import { classService } from '../../../services/classService';
import { subjectService } from '../../../services/subjectService';
import { userService } from '../../../services/userService';
import { academicYearService } from '../../../services/academicYearService';
import { roomService } from '../../../services/roomService';
import { Class, ClassFilters, ScheduleInput } from '../../../types/class';
import { Subject } from '../../../types/subject';
import { UserProfile } from '../../../types/auth';
import { AcademicYear } from '../../../types/academicYear';
import { Room } from '../../../types/room';
import ErrorModal from '../../../components/ui/ErrorModal';

const ClassManagement: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<ClassFilters>({
    search_term: '',
    filter_academic_year_id: '',
    filter_semester: '',
    filter_department: ''
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  const [formData, setFormData] = useState({
    subject_id: '',
    teacher_id: '',
    co_teacher_id: '',
    department: 'College',
    semester: '1st Semester',
    academic_year_id: '',
    section_name: 'A',
    capacity: 40,
    schedules: [] as ScheduleInput[]
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchInitialData = async () => {
    try {
      const [subjectsRes, teachersRes, ayRes, roomsRes] = await Promise.all([
        subjectService.getSubjects(),
        userService.listSchoolUsers('teacher'),
        academicYearService.getAcademicYears(),
        roomService.getRooms()
      ]);

      if (subjectsRes.data) setSubjects(subjectsRes.data);
      if (teachersRes.data) setTeachers(teachersRes.data);
      if (roomsRes.data) setRooms(roomsRes.data);
      if (ayRes.data) {
        setAcademicYears(ayRes.data);
        const activeYear = ayRes.data.find(ay => ay.is_active);
        if (activeYear && !selectedClass) {
          setFormData(prev => ({ ...prev, academic_year_id: activeYear.id }));
        }
      }
    } catch (err) {
      console.error('Error fetching initial data:', err);
    }
  };

  const fetchClasses = async () => {
    setLoading(true);
    const { data, error } = await classService.getClasses(filters);
    if (error) {
      setError(error.message);
    } else if (data) {
      setClasses(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchClasses();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [filters]);

  const handleOpenModal = (cls?: Class) => {
    if (cls) {
      setSelectedClass(cls);
      setFormData({
        subject_id: cls.subject_id,
        teacher_id: cls.teacher_id,
        co_teacher_id: cls.co_teacher_id || '',
        department: cls.department,
        semester: cls.semester,
        academic_year_id: cls.academic_year_id,
        section_name: cls.section_name,
        capacity: cls.capacity,
        schedules: cls.schedules.map(s => ({
          room_id: s.room_id || '',
          days_of_week: s.days_of_week,
          start_time: s.start_time,
          end_time: s.end_time
        }))
      });
    } else {
      setSelectedClass(null);
      const activeYear = academicYears.find(ay => ay.is_active);
      setFormData({
        subject_id: '',
        teacher_id: '',
        co_teacher_id: '',
        department: filters.filter_department || 'College',
        semester: '1st Semester',
        academic_year_id: activeYear?.id || '',
        section_name: 'A',
        capacity: 40,
        schedules: [{ room_id: '', days_of_week: '', start_time: '', end_time: '' }]
      });
    }
    setIsModalOpen(true);
  };

  const handleScheduleChange = (index: number, field: keyof ScheduleInput, value: string) => {
    const newSchedules = [...formData.schedules];
    newSchedules[index] = { ...newSchedules[index], [field]: value };
    setFormData({ ...formData, schedules: newSchedules });
  };

  const addSchedule = () => {
    setFormData({
      ...formData,
      schedules: [...formData.schedules, { room_id: '', days_of_week: '', start_time: '', end_time: '' }]
    });
  };

  const removeSchedule = (index: number) => {
    const newSchedules = formData.schedules.filter((_, i) => i !== index);
    setFormData({ ...formData, schedules: newSchedules });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Ensure empty strings map to null for postgres UUID fields
      const formattedSchedules = formData.schedules.map(s => ({
        ...s,
        room_id: s.room_id || null
      }));

      if (selectedClass) {
        const { error } = await classService.updateClass({
          class_id: selectedClass.id,
          teacher_id: formData.teacher_id,
          department: formData.department,
          semester: formData.semester,
          academic_year_id: formData.academic_year_id,
          section_name: formData.section_name,
          capacity: formData.capacity,
          co_teacher_id: formData.co_teacher_id || null,
          schedules: formattedSchedules
        });
        if (error) throw error;
      } else {
        const { error } = await classService.createClass({
          subject_id: formData.subject_id,
          teacher_id: formData.teacher_id,
          department: formData.department,
          semester: formData.semester,
          academic_year_id: formData.academic_year_id,
          section_name: formData.section_name,
          capacity: formData.capacity,
          co_teacher_id: formData.co_teacher_id || null,
          schedules: formattedSchedules
        });
        if (error) throw error;
      }
      setIsModalOpen(false);
      fetchClasses();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this class?')) return;

    const { error } = await classService.deleteClass(id);
    if (error) {
      setError(error.message);
    } else {
      fetchClasses();
    }
  };

  return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Class Management</h1>
            <p className="text-gray-600">Schedule subjects, assign teachers, and manage class sections.</p>
          </div>
          <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            Create Class
          </button>
        </div>

        <ErrorModal
            isOpen={!!error}
            message={error}
            onClose={() => setError('')}
        />

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
                type="text"
                placeholder="Search by subject, teacher, or room..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.search_term || ''}
                onChange={(e) => setFilters({ ...filters, search_term: e.target.value })}
            />
          </div>
          <select
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={filters.filter_department || ''}
              onChange={(e) => setFilters({ ...filters, filter_department: e.target.value })}
          >
            <option value="">All Departments</option>
            <option value="College">College</option>
            <option value="Junior High School">Junior High School</option>
            <option value="Senior High School">Senior High School</option>
          </select>
          <select
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={filters.filter_academic_year_id || ''}
              onChange={(e) => setFilters({ ...filters, filter_academic_year_id: e.target.value })}
          >
            <option value="">All Academic Years</option>
            {academicYears.map(ay => (
                <option key={ay.id} value={ay.id}>{ay.name}</option>
            ))}
          </select>
          <select
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={filters.filter_semester || ''}
              onChange={(e) => setFilters({ ...filters, filter_semester: e.target.value })}
          >
            <option value="">All Semesters</option>
            <option value="1st Semester">1st Semester</option>
            <option value="2nd Semester">2nd Semester</option>
            <option value="Summer">Summer</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Subject</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Teacher</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Section</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Schedules</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Capacity</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
              </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
              {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="h-4 bg-gray-100 rounded w-full"></div>
                        </td>
                      </tr>
                  ))
              ) : classes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No classes found.
                    </td>
                  </tr>
              ) : (
                  classes.map((cls) => (
                      <tr key={cls.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 align-top">
                          <div className="font-semibold text-gray-900">{cls.subject_code}</div>
                          <div className="text-sm text-gray-500">{cls.subject_name}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 align-top">
                          <div>{cls.teacher_first_name} {cls.teacher_last_name}</div>
                          {cls.co_teacher_id && (
                              <div className="text-xs text-gray-400 mt-1">Co: {cls.co_teacher_first_name} {cls.co_teacher_last_name}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div className="flex flex-col">
                        <span className="inline-flex items-center w-fit px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Section {cls.section_name}
                        </span>
                            <div className="text-[10px] text-gray-600 mt-1 uppercase">
                              {cls.department} • {cls.semester}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 align-top">
                          {cls.schedules && cls.schedules.length > 0 ? (
                              <div className="space-y-3">
                                {cls.schedules.map((sched, idx) => (
                                    <div key={idx} className="flex flex-col gap-1 border-l-2 border-blue-200 pl-2">
                                      <div className="flex items-center gap-1.5 text-gray-700">
                                        <Calendar size={13} className="text-gray-400" />
                                        <span className="font-medium">{sched.days_of_week?.split(',').join('') || 'No days'}</span>
                                        <span className="text-gray-300">|</span>
                                        <Clock size={13} className="text-gray-400" />
                                        {sched.start_time?.slice(0, 5)} - {sched.end_time?.slice(0, 5)}
                                      </div>
                                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                        <MapPin size={13} className="text-gray-400" />
                                        {sched.room_name || 'TBA'} {sched.room_building ? `(${sched.room_building})` : ''}
                                      </div>
                                    </div>
                                ))}
                              </div>
                          ) : (
                              <span className="text-gray-400 italic text-xs">No schedule assigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 align-top">
                          <div className="flex items-center gap-1">
                            <UsersIcon size={14} className="text-gray-400" />
                            {cls.capacity} max
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right align-top">
                          <div className="flex justify-end gap-2">
                            <button
                                onClick={() => handleOpenModal(cls)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit Class"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                                onClick={() => handleDelete(cls.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Class"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                  ))
              )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedClass ? 'Edit Class' : 'Create New Class'}
                  </h3>
                  <button
                      onClick={() => setIsModalOpen(false)}
                      className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
                  {/* Class Details Section */}
                  <h4 className="font-semibold text-gray-900 mb-4 pb-2 border-b">Class Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-gray-700">Subject</label>
                      <select
                          required
                          disabled={!!selectedClass}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          value={formData.subject_id}
                          onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                      >
                        <option value="">Select Subject</option>
                        {subjects.map(s => (
                            <option key={s.id} value={s.id}>[{s.code}] {s.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-gray-700">Section Name</label>
                      <input
                          required
                          type="text"
                          placeholder="e.g. A, B, BSIT-1"
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.section_name}
                          onChange={(e) => setFormData({ ...formData, section_name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-gray-700">Primary Teacher</label>
                      <select
                          required
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.teacher_id}
                          onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                      >
                        <option value="">Select Teacher</option>
                        {teachers.map(t => (
                            <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-gray-700">Co-Teacher (Optional)</label>
                      <select
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.co_teacher_id}
                          onChange={(e) => setFormData({ ...formData, co_teacher_id: e.target.value })}
                      >
                        <option value="">None</option>
                        {teachers.map(t => (
                            <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-gray-700">Department</label>
                      <select
                          required
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.department}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      >
                        <option value="College">College</option>
                        <option value="Junior High School">Junior High School</option>
                        <option value="Senior High School">Senior High School</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-gray-700">Academic Year</label>
                      <select
                          required
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.academic_year_id}
                          onChange={(e) => setFormData({ ...formData, academic_year_id: e.target.value })}
                      >
                        <option value="">Select Academic Year</option>
                        {academicYears.map(ay => (
                            <option key={ay.id} value={ay.id}>{ay.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-gray-700">Semester</label>
                      <select
                          required
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.semester}
                          onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                      >
                        <option value="1st Semester">1st Semester</option>
                        <option value="2nd Semester">2nd Semester</option>
                        <option value="Summer">Summer</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-gray-700">Capacity</label>
                      <input
                          required
                          type="number"
                          min="1"
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.capacity}
                          onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>

                  {/* Schedules Section */}
                  <div className="flex justify-between items-center mb-4 pb-2 border-b">
                    <h4 className="font-semibold text-gray-900">Schedules & Rooms</h4>
                    <button
                        type="button"
                        onClick={addSchedule}
                        className="flex items-center gap-1 text-sm text-blue-600 font-medium hover:text-blue-700"
                    >
                      <Plus size={16} /> Add Schedule
                    </button>
                  </div>

                  <div className="space-y-4 mb-4">
                    {formData.schedules.map((schedule, index) => (
                        <div key={index} className="flex flex-col md:flex-row gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg relative group">
                          {/* Remove button */}
                          <button
                              type="button"
                              onClick={() => removeSchedule(index)}
                              className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1.5 rounded-full hover:bg-red-200 transition-colors shadow-sm opacity-0 group-hover:opacity-100"
                              title="Remove Schedule"
                          >
                            <X size={14} />
                          </button>

                          <div className="flex-1 space-y-1">
                            <label className="text-xs font-semibold text-gray-600">Days (e.g. M,W,F)</label>
                            <input
                                required
                                type="text"
                                placeholder="M,W"
                                className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={schedule.days_of_week}
                                onChange={(e) => handleScheduleChange(index, 'days_of_week', e.target.value)}
                            />
                          </div>

                          <div className="flex-1 space-y-1">
                            <label className="text-xs font-semibold text-gray-600">Start Time</label>
                            <input
                                required
                                type="time"
                                className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={schedule.start_time}
                                onChange={(e) => handleScheduleChange(index, 'start_time', e.target.value)}
                            />
                          </div>

                          <div className="flex-1 space-y-1">
                            <label className="text-xs font-semibold text-gray-600">End Time</label>
                            <input
                                required
                                type="time"
                                className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={schedule.end_time}
                                onChange={(e) => handleScheduleChange(index, 'end_time', e.target.value)}
                            />
                          </div>

                          <div className="flex-[1.5] space-y-1">
                            <label className="text-xs font-semibold text-gray-600">Room</label>
                            <select
                                className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                value={schedule.room_id || ''}
                                onChange={(e) => handleScheduleChange(index, 'room_id', e.target.value)}
                            >
                              <option value="">TBA / No Room</option>
                              {rooms.map(r => (
                                  <option key={r.id} value={r.id}>{r.name} {r.building ? `(${r.building})` : ''}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                    ))}

                    {formData.schedules.length === 0 && (
                        <div className="text-center py-6 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
                          <p className="text-sm text-gray-500">No schedules added. Click "Add Schedule" to assign times and rooms.</p>
                        </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-6 py-2 border border-gray-200 rounded-lg font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {submitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                      {selectedClass ? 'Update Class' : 'Create Class'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}
      </div>
  );
};

export default ClassManagement;