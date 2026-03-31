import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { teacherService } from '../../../services/teacherService.ts'
import { offlineSync } from '../../../utils/offlineSync.ts'
import { 
  TeacherClass, 
  TeacherAttendanceSession, 
  TeacherAttendanceRecordWithStudent,
  TeacherStudent,
  TeacherAttendanceRecord,
  AttendanceStatus
} from '../../../types/teacher.ts'
import { handleExportExcel, handleExportSessionExcel } from '../utils/attendanceExport.ts'

export const useAttendance = () => {
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

  useEffect(() => {
    // Listen for sync success to refetch online data
    const unsubscribe = offlineSync.onSyncSuccess(() => {
        console.log('Sync success detected in AttendanceHistoryPage, refetching...')
        fetchInitialData()
        if (selectedClassId) {
            fetchSessions()
            if (viewMode === 'grid') {
                fetchGridData()
            }
            if (selectedSession) {
                fetchRecords(selectedSession.id)
            }
        }
    })

    return () => unsubscribe()
  }, [selectedClassId, fetchInitialData, fetchSessions, viewMode, fetchGridData, selectedSession, fetchRecords])

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

    const { error } = await teacherService.createAttendance({
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

  const attendanceMatrix = useMemo(() => {
    const matrix: Record<string, Record<string, string | undefined>> = {}
    allRecords.forEach(record => {
      if (!matrix[record.student_id]) {
        matrix[record.student_id] = {}
      }
      matrix[record.student_id][record.attendance_id] = record.status
    })
    return matrix
  }, [allRecords])

  const onExportExcel = () => handleExportExcel(classes, selectedClassId, roster, sessions, attendanceMatrix, setMessage)
  const onExportSessionExcel = () => handleExportSessionExcel(classes, selectedClassId, selectedSession, records, setMessage)

  return {
    classes,
    selectedClassId,
    setSelectedClassId,
    sessions,
    selectedSession,
    setSelectedSession,
    records,
    allRecords,
    roster,
    viewMode,
    setViewMode,
    fetchLoading,
    sessionsLoading,
    recordsLoading,
    gridLoading,
    saveLoading,
    message,
    setMessage,
    showCreateModal,
    setShowCreateModal,
    newSessionForm,
    setNewSessionForm,
    handleSessionClick,
    handleUpdateStatus,
    handleCreateSession,
    attendanceMatrix,
    onExportExcel,
    onExportSessionExcel
  }
}
