export interface TeacherClass {
  id: string
  department_name: string
  subject_name: string
  subject_code: string
  section_name: string
  student_count: number
}

export interface TeacherUnrolledStudent {
  id: string
  student_id_number: string
  first_name: string
  last_name: string
}

export interface TeacherStudent {
  student_id: string
  student_id_number: string
  first_name: string
  last_name: string
}

export interface TeacherRequestEnrollmentParams {
  p_class_id: string
  p_student_id: string
}

export interface TeacherCreateAssignmentParams {
  id?: string
  p_class_id: string
  p_grading_period_id: string
  p_title: string
  p_max_score: number
  p_due_date: string // DATE
}

export interface TeacherSaveGradeParams {
  p_class_id: string
  p_assignment_id: string
  p_student_id: string
  p_score: number
  p_remarks?: string | null
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'

export interface TeacherAttendanceSession {
  id: string
  name: string
  record_date: string
  created_at: string
}

export interface TeacherAttendanceRecord {
  attendance_id: string
  student_id: string
  status: AttendanceStatus
}

export interface TeacherAttendanceRecordWithStudent extends TeacherAttendanceRecord {
  id: string
  student_id_number: string
  first_name: string
  last_name: string
  updated_at: string
}

export interface TeacherCreateAttendanceParams {
  id?: string
  p_class_id: string
  p_name: string
  p_record_date: string // DATE
}

export interface TeacherSaveAttendanceRecordParams {
  p_attendance_id: string
  p_student_id: string
  p_status: AttendanceStatus
}

export interface TeacherAssignment {
  id: string
  title: string
  max_score: number
  due_date: string // DATE
  created_at: string // TIMESTAMPTZ
}

export interface TeacherGrade {
  assignment_id: string
  student_id: string
  score: number
  remarks: string | null
  updated_at: string // TIMESTAMPTZ
}

export interface TeacherSaveAttendanceParams {
  p_class_id: string
  p_student_id: string
  p_record_date: string // DATE
  p_status: AttendanceStatus
}

// Bulk sync: assignments and grades (offline → online)
export interface TeacherSyncOfflineAssignmentsAndGradesParams {
  classId: string
  assignments: {
    id: string
    grading_period_id: string
    title: string
    max_score: number
    due_date: string // DATE
  }[]
  grades: {
    assignment_id: string
    student_id: string
    score: number
  }[]
}

// Bulk sync: full attendance (sessions + records)
export interface TeacherSyncOfflineAttendanceFullParams {
  classId: string
  attendances: {
    id: string
    name: string
    record_date: string // DATE
  }[]
  records: {
    attendance_id: string
    student_id: string
    status: AttendanceStatus
  }[]
}
