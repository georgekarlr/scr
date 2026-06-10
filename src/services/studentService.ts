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
        filter_student_type: filters.filter_student_type || null,
        filter_student_id_number: filters.filter_student_id_number || null
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
  },

  async updateStudentProfile(params: {
    studentId: string;
    firstName: string;
    lastName: string;
    studentIdNumber: string;
    studentType: string;
    yearLevel: string;
    courseId?: string | null;
    sectionId?: string | null;
  }) {
    try {
      const { data, error } = await supabase.rpc('update_student_profile', {
        p_student_id: params.studentId,
        p_first_name: params.firstName,
        p_last_name: params.lastName,
        p_student_id_number: params.studentIdNumber,
        p_student_type: params.studentType,
        p_year_level: params.yearLevel,
        p_course_id: params.courseId || null,
        p_section_id: params.sectionId || null
      })

      if (error) {
        console.error('Error updating student profile:', error)
        return { data: null, error }
      }

      const updatedProfiles = data as Student[]
      return { data: updatedProfiles.length > 0 ? updatedProfiles[0] : null, error: null }
    } catch (error: any) {
      console.error('Unexpected error in updateStudentProfile:', error)
      return { data: null, error }
    }
  }
}
