import { supabase } from '../lib/supabase'
import { GradingPeriod, GradingPeriodFilters } from '../types/gradingPeriod'

export const gradingPeriodService = {
  async createGradingPeriod(name: string, department: string, academicYearId: string, semester: string, requiredPaymentPercentage: number = 100, weightPercentage: number = 25, isActive: boolean = true) {
    try {
      const { data, error } = await supabase.rpc('create_grading_period', {
        p_name: name,
        p_department: department,
        p_academic_year_id: academicYearId,
        p_semester: semester,
        p_required_payment_percentage: requiredPaymentPercentage,
        p_weight_percentage: weightPercentage,
        p_is_active: isActive
      })
      if (error) return { data: null, error }
      return { data: data[0] as string, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  async getGradingPeriods(filters: GradingPeriodFilters = {}) {
    try {
      const { data, error } = await supabase.rpc('get_grading_periods', {
        filter_academic_year_id: filters.filter_academic_year_id || null,
        filter_semester: filters.filter_semester || null,
        filter_department: filters.filter_department || null,
        filter_is_active: filters.filter_is_active === undefined ? null : filters.filter_is_active
      })
      if (error) return { data: null, error }
      return { data: data as GradingPeriod[], error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  async updateGradingPeriod(id: string, name: string, department: string, academicYearId: string, semester: string, requiredPaymentPercentage: number, weightPercentage: number, isActive: boolean) {
    try {
      const { data, error } = await supabase.rpc('update_grading_period', {
        p_period_id: id,
        p_name: name,
        p_department: department,
        p_academic_year_id: academicYearId,
        p_semester: semester,
        p_required_payment_percentage: requiredPaymentPercentage,
        p_weight_percentage: weightPercentage,
        p_is_active: isActive
      })
      if (error) return { data: null, error }
      return { data: data as boolean, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  async deleteGradingPeriod(id: string) {
    try {
      const { data, error } = await supabase.rpc('delete_grading_period', {
        p_period_id: id
      })
      if (error) return { data: null, error }
      return { data: data as boolean, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  }
}
