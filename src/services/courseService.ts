import { supabase } from '../lib/supabase'
import { Course } from '../types/course'

export const courseService = {
  async createCourse(code: string, name: string, department: string, description?: string) {
    try {
      const { data, error } = await supabase.rpc('create_course', {
        p_code: code,
        p_name: name,
        p_department: department,
        p_description: description || null
      })
      if (error) return { data: null, error }
      return { data: data[0] as Course, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  async getCourses(search?: string, department?: string) {
    try {
      const { data, error } = await supabase.rpc('get_courses', {
        search_term: search || null,
        filter_department: department || null
      })
      if (error) return { data: null, error }
      return { data: data as Course[], error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  async updateCourse(id: string, code: string, name: string, department: string, description?: string) {
    try {
      const { data, error } = await supabase.rpc('update_course', {
        p_course_id: id,
        p_code: code,
        p_name: name,
        p_department: department,
        p_description: description || null
      })
      if (error) return { data: null, error }
      return { data: data[0] as Course, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  async deleteCourse(id: string) {
    try {
      const { data, error } = await supabase.rpc('delete_course', {
        p_course_id: id
      })
      if (error) return { data: null, error }
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  }
}
