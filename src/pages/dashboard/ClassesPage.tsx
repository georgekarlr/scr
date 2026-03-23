import React, { useState, useEffect } from 'react'
import { moderatorService } from '../../services/moderatorService'
import { registrarService } from '../../services/registrarService'
import { offlineSync } from '../../utils/offlineSync'
import { ModeratorClass, ModeratorDepartment, ModeratorSubject } from '../../types/moderator'
import { StaffProfile } from '../../types/registrar'
import { Plus, Users, BookOpen, Clock, X, Check } from 'lucide-react'

export const ClassesPage: React.FC = () => {
  const [classes, setClasses] = useState<ModeratorClass[]>([])
  const [departments, setDepartments] = useState<ModeratorDepartment[]>([])
  const [subjects, setSubjects] = useState<ModeratorSubject[]>([])
  const [teachers, setTeachers] = useState<StaffProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    p_department_id: '',
    p_subject_id: '',
    p_name: '',
    p_teacher_id: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setFetchLoading(true)

    // Try to get cached data first
    const cachedClasses = await offlineSync.getCachedData('moderator_classes')
    const cachedDepts = await offlineSync.getCachedData('moderator_departments')
    const cachedSubjects = await offlineSync.getCachedData('moderator_subjects')
    const cachedStaff = await offlineSync.getCachedData('moderator_staff')

    if (cachedClasses) setClasses(cachedClasses)
    if (cachedDepts) {
        setDepartments(cachedDepts)
        if (!formData.p_department_id && cachedDepts.length > 0) {
            setFormData(prev => ({ ...prev, p_department_id: cachedDepts[0].id }))
        }
    }
    if (cachedSubjects) {
        setSubjects(cachedSubjects)
        if (!formData.p_subject_id && cachedSubjects.length > 0) {
            setFormData(prev => ({ ...prev, p_subject_id: cachedSubjects[0].id }))
        }
    }
    if (cachedStaff) {
        const teacherList = cachedStaff.filter((s: StaffProfile) => s.role === 'teacher')
        setTeachers(teacherList)
        if (!formData.p_teacher_id && teacherList.length > 0) {
            setFormData(prev => ({ ...prev, p_teacher_id: teacherList[0].id }))
        }
    }

    if (!navigator.onLine && (cachedClasses || cachedDepts || cachedSubjects || cachedStaff)) {
        setFetchLoading(false)
        return
    }

    const [classesRes, deptsRes, subjectsRes, staffRes] = await Promise.all([
      moderatorService.getClasses(),
      moderatorService.getMyDepartments(),
      moderatorService.getSubjects(),
      registrarService.getStaff()
    ])

    if (classesRes.data) {
        setClasses(classesRes.data)
        offlineSync.cacheData('moderator_classes', classesRes.data)
    }
    if (deptsRes.data) {
      setDepartments(deptsRes.data)
      offlineSync.cacheData('moderator_departments', deptsRes.data)
      if (deptsRes.data.length > 0) {
        setFormData(prev => ({ ...prev, p_department_id: deptsRes.data![0].id }))
      }
    }
    if (subjectsRes.data) {
      setSubjects(subjectsRes.data)
      offlineSync.cacheData('moderator_subjects', subjectsRes.data)
      if (subjectsRes.data.length > 0) {
        setFormData(prev => ({ ...prev, p_subject_id: subjectsRes.data![0].id }))
      }
    }
    if (staffRes.data) {
      const teacherList = staffRes.data.filter(s => s.role === 'teacher')
      setTeachers(teacherList)
      offlineSync.cacheData('moderator_staff', staffRes.data)
      if (teacherList.length > 0) {
        setFormData(prev => ({ ...prev, p_teacher_id: teacherList[0].id }))
      }
    }
    setFetchLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!navigator.onLine) {
        setMessage({ type: 'error', text: 'Creating classes requires an internet connection.' })
        return
    }

    setLoading(true)
    setMessage(null)

    const { error } = await moderatorService.createClass(formData)

    if (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to create class' })
    } else {
      setMessage({ type: 'success', text: 'Class created successfully!' })
      setFormData(prev => ({ ...prev, p_name: '' }))
      setShowCreateForm(false)
      const classesRes = await moderatorService.getClasses()
      if (classesRes.data) setClasses(classesRes.data)
    }
    setLoading(false)
  }

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-10 min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Classes</h1>
            <p className="text-lg text-gray-500">Organize and manage academic classes across your assigned departments.</p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-sm hover:shadow-md active:scale-95 ${
              showCreateForm 
                ? 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {showCreateForm ? (
              <><X size={20} /> Cancel</>
            ) : (
              <><Plus size={20} /> Create New Class</>
            )}
          </button>
        </div>

        {message && (
          <div className={`mb-8 p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${
            message.type === 'success' 
              ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
              : 'bg-rose-50 border-rose-100 text-rose-700'
          }`}>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
              message.type === 'success' ? 'bg-emerald-100' : 'bg-rose-100'
            }`}>
              {message.type === 'success' ? <Check size={18} /> : <X size={18} />}
            </div>
            <p className="font-semibold">{message.text}</p>
          </div>
        )}

        {showCreateForm && (
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-xl mb-12 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Plus size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Create New Class</h2>
                <p className="text-sm text-gray-500">Fill in the details to register a new class.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider ml-1">Department</label>
                  <select
                    required
                    value={formData.p_department_id}
                    onChange={(e) => setFormData({ ...formData, p_department_id: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  >
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider ml-1">Subject</label>
                  <select
                    required
                    value={formData.p_subject_id}
                    onChange={(e) => setFormData({ ...formData, p_subject_id: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  >
                    {subjects.map(subject => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name} {subject.code ? `(${subject.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider ml-1">Section / Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Period 1"
                    value={formData.p_name}
                    onChange={(e) => setFormData({ ...formData, p_name: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider ml-1">Assigned Teacher</label>
                  <select
                    required
                    value={formData.p_teacher_id}
                    onChange={(e) => setFormData({ ...formData, p_teacher_id: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  >
                    {teachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.first_name} {teacher.last_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
                >
                  {loading ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Check size={20} />
                  )}
                  {loading ? 'Creating...' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {classes.length === 0 ? (
            <div className="col-span-full bg-white rounded-3xl p-16 border border-gray-100 shadow-sm text-center">
              <div className="h-24 w-24 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mx-auto mb-6">
                <BookOpen size={48} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Classes Found</h3>
              <p className="text-gray-500 max-w-sm mx-auto mb-8">
                Your department doesn't have any classes registered yet. Create your first class to get started.
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center gap-2 text-blue-600 font-bold hover:underline"
              >
                <Plus size={20} /> Add your first class
              </button>
            </div>
          ) : (
            classes.map((cls) => (
              <div key={cls.id} className="group bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="relative p-8 pb-0">
                  <div className="absolute top-8 right-8 h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                    <BookOpen size={24} />
                  </div>
                  <div className="pr-14">
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">{cls.department_name}</p>
                    <h3 className="text-2xl font-extrabold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors line-clamp-1">{cls.subject_name}</h3>
                    <p className="text-sm font-medium text-gray-500 mb-1">{cls.section_name} {cls.subject_code ? `(${cls.subject_code})` : ''}</p>
                  </div>
                </div>

                <div className="p-8 space-y-5">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4 p-3 rounded-2xl bg-gray-50 border border-transparent hover:border-gray-200 transition-colors">
                      <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-gray-400">
                        <Users size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Teacher</p>
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {cls.teacher_first_name} {cls.teacher_last_name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 px-3">
                      <div className="h-10 w-10 flex items-center justify-center text-gray-400">
                        <Clock size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Registered On</p>
                        <p className="text-sm font-medium text-gray-600">
                          {new Date(cls.created_at).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                    <div className="flex -space-x-2">
                      <div className="h-8 w-8 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">ST</div>
                      <div className="h-8 w-8 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">JD</div>
                      <div className="h-8 w-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400">+</div>
                    </div>
                    <button className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1 group/btn">
                      View Details
                      <div className="w-0 group-hover/btn:w-4 overflow-hidden transition-all duration-300">
                        →
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
