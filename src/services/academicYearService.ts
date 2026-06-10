import { supabase } from '../lib/supabase'
import { AcademicYear } from '../types/academicYear'

export const academicYearService = {
  async createAcademicYear(name: string, startDate?: string | null, endDate?: string | null, isActive: boolean = false) {
    try {
      const { data, error } = await supabase.rpc('create_academic_year', {
        p_name: name,
        p_start_date: startDate || null,
        p_end_date: endDate || null,
        p_is_active: isActive
      })
      if (error) return { data: null, error }
      return { data: data[0] as AcademicYear, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  async getAcademicYears(isActive?: boolean | null) {
    try {
      const { data, error } = await supabase.rpc('get_academic_years', {
        filter_is_active: isActive === undefined ? null : isActive
      })
      if (error) return { data: null, error }
      return { data: data as AcademicYear[], error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  async updateAcademicYear(id: string, name: string, startDate: string | null, endDate: string | null, isActive: boolean) {
    try {
      const { data, error } = await supabase.rpc('update_academic_year', {
        p_year_id: id,
        p_name: name,
        p_start_date: startDate,
        p_end_date: endDate,
        p_is_active: isActive
      })
      if (error) return { data: null, error }
      return { data: data as boolean, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  async deleteAcademicYear(id: string) {
    try {
      const { data, error } = await supabase.rpc('delete_academic_year', {
        p_year_id: id
      })
      if (error) return { data: null, error }
      return { data: data as boolean, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  }
}
