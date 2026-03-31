import { supabase } from '../lib/supabase'
import {
  TeacherClass,
  TeacherUnrolledStudent,
  TeacherStudent,
  TeacherRequestEnrollmentParams,
  TeacherCreateAssignmentParams,
  TeacherSaveGradeParams,
  TeacherCreateAttendanceParams,
  TeacherSaveAttendanceRecordParams,
  TeacherSaveAttendanceParams,
  TeacherAttendanceSession,
  TeacherAttendanceRecord,
  TeacherAttendanceRecordWithStudent,
  TeacherAssignment,
  TeacherGrade,
  TeacherSyncOfflineAssignmentsAndGradesParams,
  TeacherSyncOfflineAttendanceFullParams, TeacherUpdateAssignmentParams,
} from '../types/teacher'

export const teacherService = {
  /**
   * Get all classes assigned to this specific teacher
   */
  async getMyClasses() {
    const { data, error } = await supabase.rpc('teacher_get_my_classes')
    return { data: data as TeacherClass[] | null, error }
  },

  /**
   * Get all students enrolled in a specific class (The Roster)
   */
  async getClassRoster(classId: string) {
    const { data, error } = await supabase.rpc('teacher_get_class_roster', { p_class_id: classId })
    return { data: data as TeacherStudent[] | null, error }
  },

  /**
   * Search the global student list (excluding students already in this class)
   */
  async searchUnrolledStudents(classId: string, searchTerm: string) {
    const { data, error } = await supabase.rpc('teacher_search_unrolled_students', {
      p_class_id: classId,
      p_search_term: searchTerm,
    })
    return { data: data as TeacherUnrolledStudent[] | null, error }
  },

  /**
   * Send a request to the Moderator to add this student
   */
  async requestEnrollment(params: TeacherRequestEnrollmentParams) {
    const { error } = await supabase.rpc('teacher_request_enrollment', params)
    return { error }
  },

  /**
   * Add a new assignment (Quiz, Exam, Homework)
   */
  async createAssignment(params: TeacherCreateAssignmentParams) {
    const { id, ...rest } = params
    const { data, error } = await supabase.rpc('teacher_create_assignment', {
        ...rest,
        p_id: id // Pass p_id if it exists
    })
    return { data: data as string | null, error }
  },

  /**
   * Update an existing assignment
   */
  async updateAssignment(params: TeacherUpdateAssignmentParams) {
    const { error } = await supabase.rpc('teacher_update_assignment', params)
    return { error }
  },

  /**
   * Save or Update a grade
   */
  async saveGrade(params: TeacherSaveGradeParams) {
    const { error } = await supabase.rpc('teacher_save_grade', params)
    return { error }
  },

  /**
   * Get all assignments for a class (Filtered by Grading Period)
   */
  async getAssignments(classId: string, gradingPeriodId: string) {
    const { data, error } = await supabase.rpc('teacher_get_assignments', {
      p_class_id: classId,
      p_grading_period_id: gradingPeriodId,
    })
    return { data: data as TeacherAssignment[] | null, error }
  },

  /**
   * Get all grades for a class (Filtered by Grading Period)
   */
  async getGrades(classId: string, gradingPeriodId: string) {
    const { data, error } = await supabase.rpc('teacher_get_grades', {
      p_class_id: classId,
      p_grading_period_id: gradingPeriodId,
    })
    return { data: data as TeacherGrade[] | null, error }
  },

  /**
   * Create a new attendance session (e.g. "Morning Session")
   */
  async createAttendance(params: TeacherCreateAttendanceParams) {
    const { id, ...rest } = params
    const { data, error } = await supabase.rpc('teacher_create_attendance', {
        ...rest,
        p_id: id // Pass p_id if it exists
    })
    return { data: data as string | null, error }
  },

  /**
   * Save or Update a single student's record for a specific attendance session
   */
  async saveAttendanceRecord(params: TeacherSaveAttendanceRecordParams) {
    const { error } = await supabase.rpc('teacher_save_attendance_record', params)
    return { error }
  },

  /**
   * Get all attendance sessions for a specific class
   */
  async getAttendanceSessions(classId: string) {
    const { data, error } = await supabase.rpc('teacher_get_attendances', { p_class_id: classId })
    return { data: data as TeacherAttendanceSession[] | null, error }
  },

  /**
   * Get all attendance records for a specific class (all students, all sessions)
   */
  async getAttendanceRecordsForClass(classId: string) {
    const { data, error } = await supabase.rpc('teacher_get_attendance_records', { p_class_id: classId })
    return { data: data as TeacherAttendanceRecord[] | null, error }
  },

  /**
   * Get all attendance records for a specific session (with student info)
   */
  async getAttendanceRecords(attendanceId: string) {
    const { data, error } = await supabase
      .from('attendance_records')
      .select(`
        *,
        student:student_id (
          id,
          student_id_number,
          first_name,
          last_name
        )
      `)
      .eq('attendance_id', attendanceId)
    
    const transformed = data?.map(rec => {
      const student = rec.student as unknown as { student_id_number: string; first_name: string; last_name: string }
      return {
        ...rec,
        student_id_number: student?.student_id_number,
        first_name: student?.first_name,
        last_name: student?.last_name,
      }
    })

    return { data: transformed as TeacherAttendanceRecordWithStudent[] | null, error }
  },

  /**
   * Bulk sync offline assignments and grades in a single transaction
   */
  async syncOfflineAssignmentsAndGrades(params: TeacherSyncOfflineAssignmentsAndGradesParams) {
    const { error } = await supabase.rpc('teacher_sync_offline_assignments_and_grades', {
      p_class_id: params.classId,
      p_assignments: params.assignments.map(a => ({
        id: a.id,
        grading_period_id: a.grading_period_id,
        title: a.title,
        max_score: a.max_score,
        due_date: a.due_date,
        action_status: a.action_status
      })),
      p_grades: params.grades.map(g => ({
        assignment_id: g.assignment_id,
        student_id: g.student_id,
        score: g.score,
        action_status: g.action_status
      })),
      p_deleted_assignments: params.deleted_assignments || [],
    })
    return { error }
  },

  /**
   * Delete an assignment
   */
  async deleteAssignment(assignmentId: string) {
    const { error } = await supabase.rpc('teacher_delete_assignment', {
      p_assignment_id: assignmentId,
    })
    return { error }
  },

  /**
   * Bulk sync offline attendance sessions (columns) and records (cells)
   */
  async syncOfflineAttendanceFull(params: TeacherSyncOfflineAttendanceFullParams) {
    const { error } = await supabase.rpc('teacher_sync_offline_attendance_data', {
      p_class_id: params.classId,
      p_attendances: params.attendances,
      p_records: params.records,
    })
    return { error }
  },

  /**
   * @deprecated Use createAttendance and saveAttendanceRecord
   * Save daily attendance for a student
   */
  async saveAttendance(params: TeacherSaveAttendanceParams) {
    const { error } = await supabase.rpc('teacher_save_attendance', params)
    return { error }
  },
}
