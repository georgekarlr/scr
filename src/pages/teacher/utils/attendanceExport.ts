import * as XLSX from 'xlsx'
import { 
  TeacherClass, 
  TeacherAttendanceSession, 
  TeacherStudent,
  TeacherAttendanceRecordWithStudent,
  AttendanceStatus
} from '../../../types/teacher.ts'

export const handleExportExcel = (
  classes: TeacherClass[],
  selectedClassId: string,
  roster: TeacherStudent[],
  sessions: TeacherAttendanceSession[],
  attendanceMatrix: Record<string, Record<string, string | undefined>>,
  setMessage: (msg: { type: 'success' | 'error'; text: string } | null) => void
) => {
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

export const handleExportSessionExcel = (
  classes: TeacherClass[],
  selectedClassId: string,
  selectedSession: TeacherAttendanceSession | null,
  records: TeacherAttendanceRecordWithStudent[],
  setMessage: (msg: { type: 'success' | 'error'; text: string } | null) => void
) => {
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
