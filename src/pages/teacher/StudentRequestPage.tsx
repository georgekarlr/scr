import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { teacherService } from '../../services/teacherService.ts'
import { offlineSync } from '../../utils/offlineSync.ts'
import { TeacherClass, TeacherUnrolledStudent } from '../../types/teacher.ts'
import { Search, UserPlus, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'

const StudentRequestPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const classIdFromQuery = searchParams.get('classId')

  const [classes, setClasses] = useState<TeacherClass[]>([])
  const [selectedClassId, setSelectedClassId] = useState(classIdFromQuery || '')
  const [searchTerm, setSearchTerm] = useState('')
  const [students, setStudents] = useState<TeacherUnrolledStudent[]>([])
  const [loading, setLoading] = useState(false)
  const [requestingId, setRequestingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchMyClasses = async () => {
    const cached = await offlineSync.getCachedData('my_classes')
    if (cached) {
      setClasses(cached)
      if (!selectedClassId && cached.length > 0) {
        setSelectedClassId(cached[0].id)
      }
    }

    if (!navigator.onLine && cached) return

    const { data } = await teacherService.getMyClasses()
    if (data) {
      setClasses(data)
      offlineSync.cacheData('my_classes', data)
      if (!selectedClassId && data.length > 0) {
        setSelectedClassId(data[0].id)
      }
    }
  }

  const handleSearch = async () => {
    if (!selectedClassId) return
    if (!navigator.onLine) {
        setMessage({ type: 'error', text: 'Searching students requires an internet connection.' })
        return
    }
    setLoading(true)
    const { data, error } = await teacherService.searchUnrolledStudents(selectedClassId, searchTerm)
    if (error) {
      console.error('Search error:', error)
    } else if (data) {
      setStudents(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchMyClasses()
  }, [])

  useEffect(() => {
    if (selectedClassId && searchTerm.length >= 2) {
      const delayDebounceFn = setTimeout(() => {
        handleSearch()
      }, 500)
      return () => clearTimeout(delayDebounceFn)
    } else {
      setStudents([])
    }
  }, [searchTerm, selectedClassId])

  const handleRequestEnrollment = async (studentId: string) => {
    if (!selectedClassId) return
    if (!navigator.onLine) {
        setMessage({ type: 'error', text: 'Requesting enrollment requires an internet connection.' })
        return
    }
    setRequestingId(studentId)
    setMessage(null)

    const { error } = await teacherService.requestEnrollment({
      p_class_id: selectedClassId,
      p_student_id: studentId,
    })

    if (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to send request' })
    } else {
      setMessage({ type: 'success', text: 'Enrollment request sent successfully!' })
      // Remove the student from the current search results
      setStudents(prev => prev.filter(s => s.id !== studentId))
    }
    setRequestingId(null)
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link to="/dashboard/my-classes" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4 transition-colors">
            <ArrowLeft size={16} />
            Back to My Classes
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Add Student Request</h1>
          <p className="text-gray-500">Search and request to add students to your classes.</p>
        </div>

        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-0 opacity-50"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Target Class</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50/50 transition-all font-medium text-gray-700"
              >
                <option value="" disabled>Select a class</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.subject_code} - {cls.section_name} — {cls.department_name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Search Student</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Name or Student ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 pl-12 pr-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50/50 transition-all font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg border flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'
          }`}>
            {message.type === 'success' && <CheckCircle2 size={20} />}
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Student ID</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Name</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-20 text-center">
                    <Loader2 className="mx-auto text-blue-600 animate-spin mb-4" size={40} />
                    <p className="text-gray-500 font-medium italic">Searching students...</p>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-20 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                       <Search className="text-gray-300" size={32} />
                    </div>
                    <p className="text-gray-500 font-medium">
                      {searchTerm.length < 2 
                        ? 'Type at least 2 characters to search' 
                        : 'No students found matching your search.'}
                    </p>
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-5 font-mono text-sm text-gray-500">{student.student_id_number}</td>
                    <td className="px-6 py-5">
                       <div className="font-bold text-gray-900">{student.first_name} {student.last_name}</div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        onClick={() => handleRequestEnrollment(student.id)}
                        disabled={requestingId === student.id}
                        className="inline-flex items-center gap-2 bg-white text-blue-600 border border-blue-200 px-5 py-2 rounded-xl hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all active:scale-95 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 text-sm font-bold shadow-sm"
                      >
                        {requestingId === student.id ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                        Request
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default StudentRequestPage
