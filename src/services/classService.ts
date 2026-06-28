import { supabase } from '../lib/supabase'
import { Class, ClassFilters, CreateClassParams, UpdateClassParams } from '../types/class'

export const classService = {
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

      if (error) {
        console.error('Error fetching classes:', error)
        return { data: null, error }
      }

      return { data: data as Class[], error: null }
    } catch (error: any) {
      console.error('Unexpected error in getClasses:', error)
      return { data: null, error }
    }
  },

  async createClass(params: CreateClassParams) {
    try {
      const { data, error } = await supabase.rpc('create_class', {
        p_subject_id: params.subject_id,
        p_teacher_id: params.teacher_id,
        p_department: params.department,
        p_semester: params.semester,
        p_academic_year_id: params.academic_year_id,
        p_section_name: params.section_name || 'A',
        p_capacity: params.capacity || 40,
        p_co_teacher_id: params.co_teacher_id || null,
        p_schedules_json: params.schedules // Passes the new array of schedules
      })

      if (error) {
        console.error('Error creating class:', error)
        return { data: null, error }
      }

      return { data: data as { id: string }[], error: null }
    } catch (error: any) {
      console.error('Unexpected error in createClass:', error)
      return { data: null, error }
    }
  },

  async updateClass(params: UpdateClassParams) {
    try {
      const { data, error } = await supabase.rpc('update_class', {
        p_class_id: params.class_id,
        p_department: params.department,
        p_teacher_id: params.teacher_id,
        p_semester: params.semester,
        p_academic_year_id: params.academic_year_id,
        p_section_name: params.section_name,
        p_capacity: params.capacity,
        p_co_teacher_id: params.co_teacher_id || null,
        p_schedules_json: params.schedules // Passes the new array of schedules
      })

      if (error) {
        console.error('Error updating class:', error)
        return { data: null, error }
      }

      return { data: data as boolean, error: null }
    } catch (error: any) {
      console.error('Unexpected error in updateClass:', error)
      return { data: null, error }
    }
  },

  async deleteClass(classId: string) {
    try {
      const { data, error } = await supabase.rpc('delete_class', {
        p_class_id: classId
      })

      if (error) {
        console.error('Error deleting class:', error)
        return { data: null, error }
      }

      return { data: data as boolean, error: null }
    } catch (error: any) {
      console.error('Unexpected error in deleteClass:', error)
      return { data: null, error }
    }
  },

  async deleteClassSchedule(scheduleId: string) {
    try {
      const { data, error } = await supabase.rpc('delete_class_schedule', {
        p_schedule_id: scheduleId
      })

      if (error) {
        console.error('Error deleting class schedule:', error)
        return { data: null, error }
      }

      return { data: data as boolean, error: null }
    } catch (error: any) {
      console.error('Unexpected error in deleteClassSchedule:', error)
      return { data: null, error }
    }
  }
}