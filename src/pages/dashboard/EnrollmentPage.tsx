import React, { useState, useEffect } from 'react'
import { moderatorService } from '../../services/moderatorService'
import { registrarService } from '../../services/registrarService'
import { offlineSync } from '../../utils/offlineSync'
import { ModeratorClass, ModeratorClassRoster } from '../../types/moderator'
import { Student } from '../../types/registrar'
import { Search, UserPlus, UserMinus, Users, BookOpen } from 'lucide-react'

export const EnrollmentPage: React.FC = () => {
  const [classes, setClasses] = useState<ModeratorClass[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [roster, setRoster] = useState<ModeratorClassRoster[]>([])
  const [allStudents, setAllStudents] = useState<Student[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [rosterSearchQuery, setRosterSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (selectedClassId) {
      fetchRoster(selectedClassId)
    } else {
      setRoster([])
    }
  }, [selectedClassId])

  const fetchInitialData = async () => {
    setFetchLoading(true)
    const cachedClasses = await offlineSync.getCachedData('moderator_classes')
    const cachedStudents = await offlineSync.getCachedData('registrar_students')
    if (cachedClasses) {
      setClasses(cachedClasses)
      if (cachedClasses.length > 0) {
        setSelectedClassId(cachedClasses[0].id)
      }
    }
    if (cachedStudents) setAllStudents(cachedStudents)

    if (!navigator.onLine && (cachedClasses || cachedStudents)) {
      setFetchLoading(false)
      return
    }

    const [classesRes, studentsRes] = await Promise.all([
      moderatorService.getClasses(),
      registrarService.getStudents()
    ])

    if (classesRes.data) {
      setClasses(classesRes.data)
      offlineSync.cacheData('moderator_classes', classesRes.data)
      if (classesRes.data.length > 0 && !selectedClassId) {
        setSelectedClassId(classesRes.data[0].id)
      }
    }
    if (studentsRes.data) {
      setAllStudents(studentsRes.data)
      offlineSync.cacheData('registrar_students', studentsRes.data)
    }
    setFetchLoading(false)
  }

  const fetchRoster = async (classId: string) => {
    const cachedRoster = await offlineSync.getCachedData(`moderator_class_roster_${classId}`)
    if (cachedRoster) setRoster(cachedRoster)

    if (!navigator.onLine && cachedRoster) return

    const { data } = await moderatorService.getClassRoster(classId)
    if (data) {
      setRoster(data)
      offlineSync.cacheData(`moderator_class_roster_${classId}`, data)
    }
  }

  const handleEnroll = async (studentId: string) => {
    if (!selectedClassId) return

    if (!navigator.onLine) {
      setMessage({ type: 'error', text: 'Enrolling students requires an internet connection.' })
      return
    }

    setLoading(true)
    const { error } = await moderatorService.enrollStudent({
      p_class_id: selectedClassId,
      p_student_id: studentId
    })

    if (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to enroll student' })
    } else {
      setMessage({ type: 'success', text: 'Student enrolled successfully' })
      fetchRoster(selectedClassId)
    }
    setLoading(false)
    setTimeout(() => setMessage(null), 3000)
  }

  const handleRemove = async (studentId: string) => {
    if (!selectedClassId) return

    if (!navigator.onLine) {
      alert('Removing students requires an internet connection.')
      return
    }

    if (!confirm('Are you sure you want to remove this student from the class?')) return
    
    setLoading(true)
    const { error } = await moderatorService.removeStudent({
      p_class_id: selectedClassId,
      p_student_id: studentId
    })

    if (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to remove student' })
    } else {
      setMessage({ type: 'success', text: 'Student removed successfully' })
      fetchRoster(selectedClassId)
    }
    setLoading(false)
    setTimeout(() => setMessage(null), 3000)
  }

  const filteredStudents = allStudents.filter(student => {
    const fullName = `${student.first_name} ${student.last_name}`.toLowerCase()
    const idNum = student.student_id_number.toLowerCase()
    const query = searchQuery.toLowerCase()
    const isAlreadyEnrolled = roster.some(r => r.student_id === student.id)
    
    return !isAlreadyEnrolled && (fullName.includes(query) || idNum.includes(query))
  }).slice(0, 10)

  const filteredRoster = roster.filter(member => {
    const fullName = `${member.first_name} ${member.last_name}`.toLowerCase()
    const idNum = member.student_id_number.toLowerCase()
    const query = rosterSearchQuery.toLowerCase()
    return fullName.includes(query) || idNum.includes(query)
  })

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
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Enrollment Management</h1>
          <p className="text-lg text-gray-500">Add or remove students from your department's classes.</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Class Selection & Student Search */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <label className="block text-xs font-bold text-gray-400 mb-3 uppercase tracking-widest">Select Class</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500">
                  <BookOpen size={18} />
                </div>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-3 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-gray-700 appearance-none"
                >
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.subject_name} - {cls.section_name}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <Search size={16} />
                </div>
              </div>
              {selectedClassId && (
                <p className="mt-3 text-xs text-gray-400 font-medium italic">
                  Currently managing: <span className="text-blue-600 not-italic">
                    {classes.find(c => c.id === selectedClassId)?.department_name}
                  </span>
                </p>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Enroll Students</label>
                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">Directory</span>
              </div>
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Find by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-3">
                {filteredStudents.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="mx-auto text-gray-200 mb-2" size={32} />
                    <p className="text-sm text-gray-400">No students found</p>
                  </div>
                ) : (
                  filteredStudents.map(student => (
                    <div key={student.id} className="group flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-transparent hover:border-blue-100 hover:bg-blue-50/30 transition-all">
                      <div className="min-w-0 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-400 font-bold text-xs shrink-0 group-hover:text-blue-500 transition-colors">
                          {student.first_name[0]}{student.last_name[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{student.first_name} {student.last_name}</p>
                          <p className="text-[10px] text-gray-400 font-mono tracking-tighter">{student.student_id_number}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleEnroll(student.id)}
                        disabled={loading}
                        className="h-8 w-8 flex items-center justify-center text-blue-600 bg-white hover:bg-blue-600 hover:text-white rounded-lg transition-all shadow-sm active:scale-90 disabled:opacity-50"
                        title="Enroll Student"
                      >
                        <UserPlus size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
              {searchQuery === '' && filteredStudents.length > 0 && (
                <p className="mt-6 text-center text-[10px] text-gray-400 font-medium">Type to search the full roster</p>
              )}
            </div>
          </div>

          {/* Right Column: Class Roster */}
          <div className="lg:col-span-8">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50/30 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-blue-600">
                      <Users size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Class Roster</h2>
                      <p className="text-sm text-gray-500">{roster.length} students currently enrolled</p>
                    </div>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="Filter roster..."
                      value={rosterSearchQuery}
                      onChange={(e) => setRosterSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

                {roster.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-24 text-center px-6">
                    <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-4">
                      <BookOpen size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Empty Roster</h3>
                    <p className="text-gray-500 max-w-xs mx-auto">
                      No students have been enrolled in this class yet. Use the directory on the left to add students.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Mobile Card View for Roster */}
                    <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
                      {filteredRoster.map((member) => (
                        <div key={member.enrollment_id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex justify-between items-center group">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 font-bold text-sm">
                              {member.first_name[0]}{member.last_name[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-900 truncate">{member.first_name} {member.last_name}</p>
                              <p className="text-xs text-gray-500 font-mono tracking-tighter">{member.student_id_number}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemove(member.student_id)}
                            className="p-2 text-rose-600 bg-white hover:bg-rose-600 hover:text-white rounded-xl shadow-sm border border-rose-50 transition-all active:scale-90"
                            title="Remove Student"
                          >
                            <UserMinus size={18} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table View for Roster */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50/50 text-gray-400 text-[10px] uppercase tracking-widest">
                            <th className="px-8 py-4 font-bold">Student</th>
                            <th className="px-8 py-4 font-bold">ID Number</th>
                            <th className="px-8 py-4 font-bold">Enrollment Date</th>
                            <th className="px-8 py-4 font-bold text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {filteredRoster.map((member) => (
                            <tr key={member.enrollment_id} className="group hover:bg-blue-50/20 transition-colors">
                              <td className="px-8 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 font-bold text-xs group-hover:bg-white group-hover:text-blue-500 transition-all">
                                    {member.first_name[0]}{member.last_name[0]}
                                  </div>
                                  <span className="text-sm font-bold text-gray-900">{member.first_name} {member.last_name}</span>
                                </div>
                              </td>
                              <td className="px-8 py-4 text-sm text-gray-500 font-mono">{member.student_id_number}</td>
                              <td className="px-8 py-4 text-sm text-gray-400">
                                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </td>
                              <td className="px-8 py-4 text-right">
                                <button
                                  onClick={() => handleRemove(member.student_id)}
                                  className="opacity-0 group-hover:opacity-100 inline-flex items-center justify-center text-rose-600 hover:bg-rose-50 p-2 rounded-xl transition-all"
                                  title="Remove Student"
                                >
                                  <UserMinus size={20} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
                {filteredRoster.length === 0 && roster.length > 0 && (
                  <div className="py-20 text-center">
                    <p className="text-gray-400 font-medium">No students match your filter</p>
                  </div>
                )}
              </div>
          </div>
        </div>
      </div>
    </div>
  )
}
