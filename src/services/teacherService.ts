import { supabase } from '../lib/supabase'
import { TeachingSchedule, TeacherListItem, TeacherProfileData } from '../types/teacher'
import { ClassGradebook } from '../types/grade'

export interface ClassGrade {
  enrollment_id: string;
  student_id: string;
  student_id_number: string;
  first_name: string;
  last_name: string;
  grade_id: string | null;
  grade_value: number | null;
  remarks: string | null;
}

export const teacherService = {
  async getClassGradebook(classId: string) {
    try {
      const { data, error } = await supabase.rpc('get_class_gradebook', {
        p_class_id: classId
      })

      if (error) {
        console.error('Error fetching class gradebook:', error)
        return { data: null, error }
      }

      return { data: data as ClassGradebook[], error: null }
    } catch (error: any) {
      console.error('Unexpected error in getClassGradebook:', error)
      return { data: null, error }
    }
  },

  async getMyTeachingSchedule(filters: {
    academicYearId?: string;
    semester?: string;
    department?: string;
    searchTerm?: string;
    daysOfWeek?: string;
  }) {
    try {
      const { data, error } = await supabase.rpc('get_my_teaching_schedule', {
        filter_academic_year_id: filters.academicYearId || null,
        filter_semester: filters.semester || null,
        filter_department: filters.department || null,
        search_term: filters.searchTerm || null,
        filter_days_of_week: filters.daysOfWeek || null
      })

      if (error) {
        console.error('Error fetching teaching schedule:', error)
        return { data: null, error }
      }

      return { data: data as TeachingSchedule[], error: null }
    } catch (error: any) {
      console.error('Unexpected error in getMyTeachingSchedule:', error)
      return { data: null, error }
    }
  },

  async getClassGrades(classId: string, gradingPeriodId: string) {
    try {
      const { data, error } = await supabase.rpc('get_class_grades', {
        p_class_id: classId,
        p_grading_period_id: gradingPeriodId
      })

      if (error) {
        console.error('Error fetching class grades:', error)
        return { data: null, error }
      }

      return { data: data as ClassGrade[], error: null }
    } catch (error: any) {
      console.error('Unexpected error in getClassGrades:', error)
      return { data: null, error }
    }
  },

  async upsertStudentGrade(enrollmentId: string, gradingPeriodId: string, gradeValue: number, remarks?: string | null) {
    try {
      const { data, error } = await supabase.rpc('upsert_student_grade', {
        p_enrollment_id: enrollmentId,
        p_grading_period_id: gradingPeriodId,
        p_grade_value: gradeValue,
        p_remarks: remarks
      })

      if (error) {
        console.error('Error upserting student grade:', error)
        return { data: null, error }
      }

      return { data: data as boolean, error: null }
    } catch (error: any) {
      console.error('Unexpected error in upsertStudentGrade:', error)
      return { data: null, error }
    }
  },

  async getTeachersList(searchTerm?: string) {
    try {
      const { data, error } = await supabase.rpc('get_teachers_list', {
        search_term: searchTerm || null
      })

      if (error) {
        console.error('Error fetching teachers list:', error)
        return { data: null, error }
      }

      return { data: data as TeacherListItem[], error: null }
    } catch (error: any) {
      console.error('Unexpected error in getTeachersList:', error)
      return { data: null, error }
    }
  },

  async getTeacherProfile(teacherId: string, academicYearId: string) {
    try {
      const { data, error } = await supabase.rpc('get_teacher_profile', {
        p_teacher_id: teacherId,
        p_academic_year_id: academicYearId
      })

      if (error) {
        console.error('Error fetching teacher profile:', error)
        return { data: null, error }
      }

      return { data: data as TeacherProfileData, error: null }
    } catch (error: any) {
      console.error('Unexpected error in getTeacherProfile:', error)
      return { data: null, error }
    }
  }
}
