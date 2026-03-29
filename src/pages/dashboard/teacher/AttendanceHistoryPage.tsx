import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { teacherService } from '../../../services/teacherService'
import { offlineSync, PendingAttendance, PendingAttendanceRecord } from '../../../utils/offlineSync'
import { 
  TeacherClass, 
  TeacherAttendanceSession, 
  TeacherAttendanceRecordWithStudent,
  TeacherStudent,
  TeacherAttendanceRecord
} from '../../../types/teacher'
import { 
  Calendar, 
  ArrowLeft, 
  Search,
  ChevronRight,
  UserCheck,
  UserX,
  Clock,
  HelpCircle,
  FileText,
  Plus,
  Table as TableIcon,
  Layout,
  AlertCircle,
  CheckCircle2,
  Save,
  X as XIcon,
  FileDown
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { AttendanceStatus } from '../../../types/teacher'

const AttendanceHistoryPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const classIdFromQuery = searchParams.get('classId')

  const [classes, setClasses] = useState<TeacherClass[]>([])
  const [selectedClassId, setSelectedClassId] = useState(classIdFromQuery || '')
  const [sessions, setSessions] = useState<TeacherAttendanceSession[]>([])
  const [selectedSession, setSelectedSession] = useState<TeacherAttendanceSession | null>(null)
  const [records, setRecords] = useState<TeacherAttendanceRecordWithStudent[]>([])
  const [allRecords, setAllRecords] = useState<TeacherAttendanceRecord[]>([])
  const [roster, setRoster] = useState<TeacherStudent[]>([])
  
  const [viewMode, setViewMode] = useState<'sessions' | 'grid'>('sessions')
  
  const [fetchLoading, setFetchLoading] = useState(true)
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [gridLoading, setGridLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newSessionForm, setNewSessionForm] = useState({
    p_name: 'Daily Attendance',
    p_record_date: new Date().toISOString().split('T')[0]
  })

  const fetchInitialData = useCallback(async () => {
    setFetchLoading(true)
    const cachedClasses = await offlineSync.getCachedData('my_classes')
    if (cachedClasses) {
      setClasses(cachedClasses)
      if (!selectedClassId && cachedClasses.length > 0) {
        setSelectedClassId(cachedClasses[0].id)
      }
    }
    
    if (!navigator.onLine && cachedClasses) {
      setFetchLoading(false)
      return
    }

    const { data } = await teacherService.getMyClasses()
    if (data) {
      setClasses(data)
      offlineSync.cacheData('my_classes', data)
      if (!selectedClassId && data.length > 0) {
        setSelectedClassId(data[0].id)
      }
    }
    setFetchLoading(false)
  }, [selectedClassId])

  const fetchSessions = useCallback(async () => {
    if (!selectedClassId) return
    setSessionsLoading(true)
    
    const cacheKey = `sessions_${selectedClassId}`
    const cached = await offlineSync.getCachedData(cacheKey) as TeacherAttendanceSession[] | null
    const pending = await offlineSync.getPendingAttendances(selectedClassId)
    
    let displaySessions = cached || []
    pending.forEach(p => {
        if (!displaySessions.find(s => s.id === p.id)) {
            displaySessions = [...displaySessions, {
                id: p.id,
                name: p.name,
                record_date: p.record_date,
                class_id: p.classId,
                school_id: ''
            } as TeacherAttendanceSession]
        }
    })
    
    setSessions(displaySessions)
    
    if (!navigator.onLine) {
        setSessionsLoading(false)
        return
    }

    const { data } = await teacherService.getAttendanceSessions(selectedClassId)
    if (data) {
      setSessions(data)
      offlineSync.cacheData(cacheKey, data)
    }
    setSessionsLoading(false)
  }, [selectedClassId])

  const fetchRecords = useCallback(async (sessionId: string) => {
    setRecordsLoading(true)
    const cacheKey = `records_${sessionId}`
    const cached = await offlineSync.getCachedData(cacheKey) as TeacherAttendanceRecordWithStudent[] | null
    const pending = await offlineSync.getPendingAttendanceRecords(selectedClassId)
    
    let displayRecords = cached || []
    pending.filter(p => p.attendance_id === sessionId).forEach(p => {
        const index = displayRecords.findIndex(r => r.student_id === p.student_id)
        if (index > -1) {
            displayRecords[index] = { ...displayRecords[index], status: p.status }
        }
    })
    
    if (displayRecords.length > 0) setRecords(displayRecords)

    if (!navigator.onLine) {
        setRecordsLoading(false)
        return
    }

    const { data } = await teacherService.getAttendanceRecords(sessionId)
    if (data) {
      setRecords(data)
      offlineSync.cacheData(cacheKey, data)
    }
    setRecordsLoading(false)
  }, [selectedClassId])

  const fetchGridData = useCallback(async () => {
    if (!selectedClassId) return
    setGridLoading(true)
    
    const rosterKey = `roster_${selectedClassId}`
    const allRecordsKey = `all_attendance_records_${selectedClassId}`
    
    const cachedRoster = await offlineSync.getCachedData(rosterKey)
    const cachedAllRecords = await offlineSync.getCachedData(allRecordsKey) as TeacherAttendanceRecord[] | null
    const pendingRecords = await offlineSync.getPendingAttendanceRecords(selectedClassId)
    
    if (cachedRoster) setRoster(cachedRoster)
    
    let displayAllRecords = cachedAllRecords || []
    pendingRecords.forEach(p => {
        const index = displayAllRecords.findIndex(r => r.attendance_id === p.attendance_id && r.student_id === p.student_id)
        const recordObj = { attendance_id: p.attendance_id, student_id: p.student_id, status: p.status }
        if (index > -1) {
            displayAllRecords[index] = recordObj
        } else {
            displayAllRecords.push(recordObj)
        }
    })
    
    setAllRecords(displayAllRecords)
    
    if (!navigator.onLine) {
        setGridLoading(false)
        return
    }

    const [rosterRes, recordsRes] = await Promise.all([
      teacherService.getClassRoster(selectedClassId),
      teacherService.getAttendanceRecordsForClass(selectedClassId)
    ])
    
    if (rosterRes.data) {
        setRoster(rosterRes.data)
        offlineSync.cacheData(rosterKey, rosterRes.data)
    }
    if (recordsRes.data) {
        setAllRecords(recordsRes.data)
        offlineSync.cacheData(allRecordsKey, recordsRes.data)
    }
    setGridLoading(false)
  }, [selectedClassId])

  useEffect(() => {
    fetchInitialData()
  }, [fetchInitialData])

  useEffect(() => {
    if (selectedClassId) {
      fetchSessions()
      setSelectedSession(null)
      setRecords([])
      if (viewMode === 'grid') {
        fetchGridData()
      }
    }
  }, [selectedClassId, fetchSessions, viewMode, fetchGridData])

  const handleSessionClick = (session: TeacherAttendanceSession) => {
    setSelectedSession(session)
    fetchRecords(session.id)
  }

  const handleUpdateStatus = async (attendanceId: string, studentId: string, status: AttendanceStatus) => {
    setSaveLoading(true)
    
    if (!navigator.onLine) {
        await offlineSync.saveAttendanceRecordLocally({
            attendance_id: attendanceId,
            student_id: studentId,
            status: status,
            classId: selectedClassId
        })
        
        // Optimistic UI updates
        if (viewMode === 'sessions' && selectedSession?.id === attendanceId) {
            setRecords(prev => prev.map(r => r.student_id === studentId ? { ...r, status } : r))
        }
        
        setAllRecords(prev => {
          const exists = prev.some(r => r.attendance_id === attendanceId && r.student_id === studentId)
          let next;
          if (exists) {
            next = prev.map(r => (r.attendance_id === attendanceId && r.student_id === studentId) ? { ...r, status } : r)
          } else {
            next = [...prev, { attendance_id: attendanceId, student_id: studentId, status }]
          }
          // Update cache with the new state
          const allRecordsKey = `all_attendance_records_${selectedClassId}`
          offlineSync.cacheData(allRecordsKey, next)
          return next
        })
        
        setMessage({ type: 'success', text: 'Status saved locally (Offline)' })
        setSaveLoading(false)
        setTimeout(() => setMessage(null), 3000)
        return
    }

    const { error } = await teacherService.saveAttendanceRecord({
      p_attendance_id: attendanceId,
      p_student_id: studentId,
      p_status: status
    })

    if (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to update status' })
    } else {
      // Update local state
      if (viewMode === 'sessions' && selectedSession?.id === attendanceId) {
        setRecords(prev => prev.map(r => r.student_id === studentId ? { ...r, status } : r))
      }
      
      setAllRecords(prev => {
        const exists = prev.some(r => r.attendance_id === attendanceId && r.student_id === studentId)
        let next;
        if (exists) {
          next = prev.map(r => (r.attendance_id === attendanceId && r.student_id === studentId) ? { ...r, status } : r)
        } else {
          next = [...prev, { attendance_id: attendanceId, student_id: studentId, status }]
        }
        // Update cache with the new state
        const allRecordsKey = `all_attendance_records_${selectedClassId}`
        offlineSync.cacheData(allRecordsKey, next)
        return next
      })
    }
    setSaveLoading(false)
    setTimeout(() => setMessage(null), 3000)
  }

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClassId) return
    setSaveLoading(true)
    
    const tempId = crypto.randomUUID()
    
    if (!navigator.onLine) {
        await offlineSync.saveAttendanceLocally({
            id: tempId,
            name: newSessionForm.p_name,
            record_date: newSessionForm.p_record_date,
            classId: selectedClassId
        })
        
        // Optimistic UI
        const newSession = {
            id: tempId,
            name: newSessionForm.p_name,
            record_date: newSessionForm.p_record_date,
            class_id: selectedClassId,
            school_id: ''
        } as TeacherAttendanceSession
        
        setSessions(prev => [...prev, newSession])
        setMessage({ type: 'success', text: 'Session created locally (Offline)' })
        setShowCreateModal(false)
        setSaveLoading(false)
        setTimeout(() => setMessage(null), 3000)
        return
    }

    const { data, error } = await teacherService.createAttendance({
      id: tempId,
      p_class_id: selectedClassId,
      ...newSessionForm
    } as any)

    if (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to create session' })
    } else {
      setMessage({ type: 'success', text: 'Session created successfully!' })
      setShowCreateModal(false)
      fetchSessions()
      if (viewMode === 'grid') {
        fetchGridData()
      }
    }
    setSaveLoading(false)
    setTimeout(() => setMessage(null), 3000)
  }

  const handleExportExcel = () => {
    if (roster.length === 0) {
      setMessage({ type: 'error', text: 'No students in roster to export' })
      setTimeout(() => setMessage(null), 3000)
      return
    }

    const selectedClass = classes.find(c => c.id === selectedClassId)

    // Prepare headers: Student Info, then Each Session, then Summaries
    const headers = [
      'Student Name',
      'Student ID',
      ...sessions.map(s => `${s.name} (${s.record_date})`),
      'Present',
      'Absent',
      'Late',
      'Excused',
      'Total Sessions',
      'Attendance %'
    ]

    const rows = roster.map(student => {
      let presentCount = 0
      let absentCount = 0
      let lateCount = 0
      let excusedCount = 0

      const studentAttendance = sessions.map(session => {
        const status = attendanceMatrix[student.student_id]?.[session.id]
        if (status === 'present') presentCount++
        else if (status === 'absent') absentCount++
        else if (status === 'late') lateCount++
        else if (status === 'excused') excusedCount++
        return status || '-'
      })

      const totalSessions = presentCount + absentCount + lateCount + excusedCount
      const attendancePercentage = totalSessions > 0 
        ? ((presentCount + lateCount + excusedCount) / totalSessions) * 100 
        : 0

      return [
        `${student.last_name}, ${student.first_name}`,
        student.student_id_number,
        ...studentAttendance,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        totalSessions,
        attendancePercentage.toFixed(2) + '%'
      ]
    })

    const data = [headers, ...rows]
    const worksheet = XLSX.utils.aoa_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance')

    const classInfo = selectedClass ? `${selectedClass.subject_code}_${selectedClass.section_name}` : 'Attendance'
    const dateStr = new Date().toISOString().split('T')[0]
    const fileName = `Attendance_Report_${classInfo}_${dateStr}.xlsx`.replace(/\s+/g, '_')

    XLSX.writeFile(workbook, fileName)
  }

  const handleExportSessionExcel = () => {
    if (!selectedSession) return
    if (records.length === 0) {
      setMessage({ type: 'error', text: 'No records to export for this session' })
      setTimeout(() => setMessage(null), 3000)
      return
    }

    const selectedClass = classes.find(c => c.id === selectedClassId)

    // Prepare headers: Student ID, Student Name, Status
    const headers = [
      'Student ID',
      'Student Name',
      'Status',
      'Session Date',
      'Session Name'
    ]

    const rows = records.map(record => [
      record.student_id_number,
      `${record.last_name}, ${record.first_name}`,
      record.status || '-',
      new Date(selectedSession.record_date).toLocaleDateString(),
      selectedSession.name
    ])

    const data = [headers, ...rows]
    const worksheet = XLSX.utils.aoa_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Session Attendance')

    const classInfo = selectedClass ? `${selectedClass.subject_code}_${selectedClass.section_name}` : 'Attendance'
    const fileName = `Attendance_Session_${classInfo}_${selectedSession.name}_${selectedSession.record_date}.xlsx`.replace(/\s+/g, '_')

    XLSX.writeFile(workbook, fileName)
  }

  const cycleStatus = (currentStatus: AttendanceStatus | undefined): AttendanceStatus => {
    const statuses: AttendanceStatus[] = ['present', 'absent', 'late', 'excused']
    if (!currentStatus) return 'present'
    const currentIndex = statuses.indexOf(currentStatus)
    return statuses[(currentIndex + 1) % statuses.length]
  }

  const getStatusIcon = (status: string, size = 16) => {
    switch (status) {
      case 'present': return <UserCheck className="text-green-500" size={size} />
      case 'absent': return <UserX className="text-red-500" size={size} />
      case 'late': return <Clock className="text-yellow-500" size={size} />
      case 'excused': return <HelpCircle className="text-blue-500" size={size} />
      default: return null
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-700 border-green-200'
      case 'absent': return 'bg-red-100 text-red-700 border-red-200'
      case 'late': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'excused': return 'bg-blue-100 text-blue-700 border-blue-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const attendanceMatrix = useMemo(() => {
    const matrix: Record<string, Record<string, string>> = {}
    allRecords.forEach(rec => {
      if (!matrix[rec.student_id]) matrix[rec.student_id] = {}
      matrix[rec.student_id][rec.attendance_id] = rec.status
    })
    return matrix
  }, [allRecords])

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <Link to="/dashboard/my-classes" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-2 transition-colors">
              <ArrowLeft size={16} />
              Back to My Classes
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Attendance Records</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {viewMode === 'grid' && (
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                title="Export Grid to Excel"
              >
                <FileDown size={16} />
                <span>Export Grid</span>
              </button>
            )}

            {viewMode === 'sessions' && selectedSession && records.length > 0 && (
              <button
                onClick={handleExportSessionExcel}
                className="flex items-center gap-2 bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                title="Export Session to Excel"
              >
                <FileDown size={16} />
                <span>Export Session</span>
              </button>
            )}

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Plus size={16} />
              Add Session
            </button>

            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('sessions')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'sessions' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Layout size={16} />
                Sessions
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <TableIcon size={16} />
                Grid View
              </button>
            </div>

            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
            >
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.subject_code} - {cls.section_name}</option>
              ))}
            </select>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg border flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'
          }`}>
            {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Plus className="text-blue-600" size={24} />
                  New Attendance Session
                </h3>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <XIcon size={20} className="text-gray-500" />
                </button>
              </div>
              
              <form onSubmit={handleCreateSession} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider">Session Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Morning Roll Call"
                    value={newSessionForm.p_name}
                    onChange={(e) => setNewSessionForm({ ...newSessionForm, p_name: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider">Record Date</label>
                  <input
                    type="date"
                    required
                    value={newSessionForm.p_record_date}
                    onChange={(e) => setNewSessionForm({ ...newSessionForm, p_record_date: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                
                <div className="flex gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="flex-2 bg-blue-600 text-white px-8 py-2.5 rounded-xl hover:bg-blue-700 font-bold transition-colors flex items-center justify-center gap-2 disabled:bg-blue-300"
                  >
                    {saveLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save size={18} />
                        Create Session
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {viewMode === 'sessions' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sessions List */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Calendar size={20} className="text-gray-400" />
                Sessions
              </h2>
              
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {sessionsLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 italic">
                    No sessions found for this class.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                    {sessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => handleSessionClick(session)}
                        className={`w-full text-left p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group ${
                          selectedSession?.id === session.id ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <div>
                          <p className={`font-bold text-sm ${selectedSession?.id === session.id ? 'text-blue-700' : 'text-gray-900'}`}>
                            {session.name}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <Calendar size={12} />
                            {new Date(session.record_date).toLocaleDateString()}
                          </p>
                        </div>
                        <ChevronRight 
                          size={16} 
                          className={`transition-transform ${
                            selectedSession?.id === session.id ? 'text-blue-500 translate-x-1' : 'text-gray-300 group-hover:translate-x-1'
                          }`} 
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Records View */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FileText size={20} className="text-gray-400" />
                  Records {selectedSession && `— ${selectedSession.name}`}
                </h2>

              {!selectedSession ? (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
                  <Search className="mx-auto text-gray-300 mb-4" size={48} />
                  <h3 className="text-gray-900 font-bold mb-2">Select a Session</h3>
                  <p className="text-gray-500 text-sm max-w-xs mx-auto">
                    Choose an attendance session from the left to view the detailed records of all students.
                  </p>
                </div>
              ) : recordsLoading ? (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Student ID</th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {records.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-6 py-12 text-center text-gray-500 italic">
                              No records found for this session.
                            </td>
                          </tr>
                        ) : (
                          records.map((record) => (
                            <tr key={`${record.attendance_id}_${record.student_id}`} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 font-mono text-sm text-gray-600">{record.student_id_number}</td>
                              <td className="px-6 py-4 font-semibold text-gray-900">{record.first_name} {record.last_name}</td>
                              <td className="px-6 py-4">
                                <div className="flex justify-center gap-2">
                                  {(['present', 'absent', 'late', 'excused'] as AttendanceStatus[]).map((status) => {
                                    const isSelected = record.status === status
                                    return (
                                      <button
                                        key={status}
                                        disabled={saveLoading}
                                        onClick={() => handleUpdateStatus(selectedSession.id, record.student_id, status)}
                                        className={`px-3 py-1 text-[10px] font-bold rounded-full border capitalize transition-colors flex items-center gap-1 ${
                                          isSelected 
                                            ? getStatusBadgeClass(status) + ' shadow-sm' 
                                            : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50 text-gray-400'
                                        }`}
                                      >
                                        {status}
                                      </button>
                                    )
                                  })}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Matrix Grid View */
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <TableIcon size={20} className="text-gray-400" />
              Attendance Matrix
            </h2>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {gridLoading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : roster.length === 0 ? (
                <div className="p-12 text-center text-gray-500 italic">
                  No roster found for this class.
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[700px]">
                  <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
                    <thead className="sticky top-0 z-10 bg-gray-50">
                      <tr className="border-b border-gray-100">
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-48 bg-gray-50 sticky left-0 z-20">Student Name</th>
                        {sessions.map(session => (
                          <th key={session.id} className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center min-w-[120px]">
                            <div className="truncate mb-1">{session.name}</div>
                            <div className="font-normal text-[10px] text-gray-400">
                              {new Date(session.record_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {roster.map((student) => (
                        <tr key={student.student_id} className="hover:bg-gray-50 transition-colors group">
                          <td className="px-6 py-4 bg-white sticky left-0 z-10 border-r border-gray-50 group-hover:bg-gray-50">
                            <div className="font-semibold text-gray-900 truncate">{student.first_name} {student.last_name}</div>
                            <div className="text-[10px] font-mono text-gray-400">{student.student_id_number}</div>
                          </td>
                          {sessions.map(session => {
                            const status = attendanceMatrix[student.student_id]?.[session.id]
                            return (
                              <td key={session.id} className="px-2 py-4 text-center">
                                <div className="flex justify-center">
                                  <button 
                                    disabled={saveLoading}
                                    onClick={() => handleUpdateStatus(session.id, student.student_id, cycleStatus(status as AttendanceStatus))}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center border shadow-sm transition-all hover:scale-110 active:scale-95 ${
                                      status ? getStatusBadgeClass(status) : 'border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                    }`}
                                    title={status ? (status.charAt(0).toUpperCase() + status.slice(1) + ' (Click to change)') : 'Mark Present'}
                                  >
                                    {status ? getStatusIcon(status, 18) : <Plus size={14} className="text-gray-300" />}
                                  </button>
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-4 text-xs text-gray-500 font-medium bg-gray-50 p-4 rounded-lg border border-gray-100">
              <span className="flex items-center gap-1.5"><UserCheck size={14} className="text-green-500" /> Present</span>
              <span className="flex items-center gap-1.5"><UserX size={14} className="text-red-500" /> Absent</span>
              <span className="flex items-center gap-1.5"><Clock size={14} className="text-yellow-500" /> Late</span>
              <span className="flex items-center gap-1.5"><HelpCircle size={14} className="text-blue-500" /> Excused</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AttendanceHistoryPage
