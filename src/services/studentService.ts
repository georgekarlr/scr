import { supabase } from '../lib/supabase'
import { Student, StudentFilters, StudentDashboardSummary, StudentReportCard, StudentSchedule, StudentTOR } from '../types/student'

export const studentService = {
  async getStudentsList(filters: StudentFilters = {}) {
    try {
      const { data, error } = await supabase.rpc('get_students_list', {
        search_term: filters.search_term || null,
        filter_course_id: filters.filter_course_id || null,
        filter_section_id: filters.filter_section_id || null,
        filter_year_level: filters.filter_year_level || null,
        filter_student_type: filters.filter_student_type || null,
        filter_student_id_number: filters.filter_student_id_number || null,
        filter_department: filters.filter_department || null
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
  },

  async getStudentDashboardSummary(studentId: string, academicYearId: string, semester: string) {
    try {
      const { data, error } = await supabase.rpc('get_student_dashboard_summary', {
        p_student_id: studentId,
        p_academic_year_id: academicYearId,
        p_semester: semester
      })

      if (error) {
        console.error('Error fetching student dashboard summary:', error)
        return { data: null, error }
      }

      return { data: data as StudentDashboardSummary, error: null }
    } catch (error: any) {
      console.error('Unexpected error in getStudentDashboardSummary:', error)
      return { data: null, error }
    }
  },

  async getStudentReportCard(studentId: string, academicYearId: string, semester: string) {
    try {
      const { data, error } = await supabase.rpc('get_student_report_card', {
        p_student_id: studentId,
        p_academic_year_id: academicYearId,
        p_semester: semester
      })

      if (error) {
        console.error('Error fetching student report card:', error)
        return { data: null, error }
      }

      return { data: data as StudentReportCard[], error: null }
    } catch (error: any) {
      console.error('Unexpected error in getStudentReportCard:', error)
      return { data: null, error }
    }
  },

  async getStudentSchedule(studentId: string, academicYearId: string, semester: string) {
    try {
      const { data, error } = await supabase.rpc('get_student_schedule', {
        p_student_id: studentId,
        p_academic_year_id: academicYearId,
        p_semester: semester
      })

      console.log("Student Schedule Data:", data);
      if (error) {
        console.error('Error fetching student schedule:', error)
        return { data: null, error }
      }

      return { data: data as StudentSchedule[], error: null }
    } catch (error: any) {
      console.error('Unexpected error in getStudentSchedule:', error)
      return { data: null, error }
    }
  },

  async generateStudentTOR(studentId: string, filterDepartment?: string | null) {
    try {
      const { data, error } = await supabase.rpc('generate_student_tor', {
        p_student_id: studentId,
        p_filter_department: filterDepartment ?? null
      })

      console.log("Student TOR Data:", data);
      if (error) {
        console.error('Error generating student TOR:', error)
        return { data: null, error }
      }

      return { data: data as StudentTOR, error: null }
    } catch (error: any) {
      console.error('Unexpected error in generateStudentTOR:', error)
      return { data: null, error }
    }
  }
}
