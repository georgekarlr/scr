import { supabase } from '../lib/supabase'
import { Student, StudentFilters } from '../types/student'

export const studentService = {
  async getStudentsList(filters: StudentFilters = {}) {
    try {
      const { data, error } = await supabase.rpc('get_students_list', {
        search_term: filters.search_term || null,
        filter_course_id: filters.filter_course_id || null,
        filter_section_id: filters.filter_section_id || null,
        filter_year_level: filters.filter_year_level || null,
        filter_student_type: filters.filter_student_type || null
      })

      if (error) {
        console.error('Error fetching students list:', error)
        return { data: null, error }
      }

      return { data: data as Student[], error: null }
    } catch (error: any) {
      console.error('Unexpected error in getStudentsList:', error)
      return { data: null, error }
    }
  },

  async getStudentProfile(studentId: string) {
    try {
      const { data, error } = await supabase.rpc('get_student_profile', {
        p_student_id: studentId
      })

      if (error) {
        console.error('Error fetching student profile:', error)
        return { data: null, error }
      }

      const profiles = data as Student[]
      return { data: profiles.length > 0 ? profiles[0] : null, error: null }
    } catch (error: any) {
      console.error('Unexpected error in getStudentProfile:', error)
      return { data: null, error }
    }
  }
}
