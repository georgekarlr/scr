import { supabase } from '../lib/supabase'
import { ClassRosterItem, EnrollStudentParams } from '../types/enrollment'
import { Class, ClassFilters } from '../types/class'
import { Student } from '../types/student'

export const enrollmentService = {
  async getUnenrolledStudents(classId: string, searchTerm: string = '') {
    try {
      const { data, error } = await supabase.rpc('get_unenrolled_students_for_class', {
        p_class_id: classId,
        search_term: searchTerm || null
      })
      if (error) return { data: null, error }
      return { data: data as Student[], error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  async enrollStudent(params: EnrollStudentParams) {
    console.log('params', params, 'student_id', params.student_id, 'class_id', params.class_id, '')
    try {
      const { data, error } = await supabase.rpc('enroll_student', {
        p_student_id: params.student_id,
        p_class_id: params.class_id
      })
      console.log("error", error)
      if (error) return { data: null, error }
      return { data: data[0] as string, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  async unenrollStudent(enrollmentId: string) {
    try {
      const { data, error } = await supabase.rpc('unenroll_student', {
        p_enrollment_id: enrollmentId
      })
      if (error) return { data: null, error }
      return { data: data as boolean, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  async getClassRoster(classId: string) {
    try {
      const { data, error } = await supabase.rpc('get_class_roster', {
        p_class_id: classId
      })
      if (error) return { data: null, error }
      return { data: data as ClassRosterItem[], error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  async getClasses(filters: ClassFilters = {}) {
    try {
      const { data, error } = await supabase.rpc('get_classes', {
        filter_academic_year_id: filters.filter_academic_year_id || null,
        filter_semester: filters.filter_semester || null,
        filter_department: filters.filter_department || null,
        filter_teacher_id: filters.filter_teacher_id || null,
        filter_subject_id: filters.filter_subject_id || null,
        search_term: filters.search_term || null
      })
      if (error) return { data: null, error }
      return { data: data as Class[], error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  }
}
