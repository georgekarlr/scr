import { supabase } from '../lib/supabase'
import { 
  CreateGradingPeriodParams, 
  CreateDepartmentParams, 
  InviteStaffParams,
  UpdateGradingPeriodParams,
  UpdateDepartmentParams,
  UpdateStaffParams,
  GradingPeriod,
  Department,
  Moderator,
  StaffProfile
} from '../types/schoolAdmin'

export const schoolAdminService = {
  /**
   * Create a new grading period for the admin's school.
   */
  async createGradingPeriod(params: CreateGradingPeriodParams) {
    const { data, error } = await supabase.rpc('admin_create_grading_period', params)
    return { data: data as string | null, error }
  },

  /**
   * Create a new department for the admin's school.
   */
  async createDepartment(params: CreateDepartmentParams) {
    const { data, error } = await supabase.rpc('admin_create_department', params)
    return { data: data as string | null, error }
  },

  /**
   * Invite staff (registrar, moderator, teacher, or school_admin) to the school.
   */
  async inviteStaff(params: InviteStaffParams) {
    const { data, error } = await supabase.rpc('admin_invite_staff', params)
    return { data: data as string | null, error }
  },

  /**
   * Update a grading period.
   */
  async updateGradingPeriod(params: UpdateGradingPeriodParams) {
    const { error } = await supabase.rpc('admin_update_grading_period', params)
    return { error }
  },

  /**
   * Delete a grading period.
   */
  async deleteGradingPeriod(id: string) {
    const { error } = await supabase.rpc('admin_delete_grading_period', { p_id: id })
    return { error }
  },

  /**
   * Update a department.
   */
  async updateDepartment(params: UpdateDepartmentParams) {
    const { error } = await supabase.rpc('admin_update_department', params)
    return { error }
  },

  /**
   * Delete a department.
   */
  async deleteDepartment(id: string) {
    const { error } = await supabase.rpc('admin_delete_department', { p_id: id })
    return { error }
  },

  /**
   * Update a staff profile.
   */
  async updateStaff(params: UpdateStaffParams) {
    const { error } = await supabase.rpc('admin_update_staff', params)
    return { error }
  },

  /**
   * Remove a staff profile.
   */
  async removeStaff(id: string) {
    const { error } = await supabase.rpc('admin_remove_staff', { p_profile_id: id })
    return { error }
  },

  /**
   * Fetch all grading periods for the school.
   */
  async getGradingPeriods() {
    const { data, error } = await supabase.rpc('admin_get_grading_periods')
    return { data: data as GradingPeriod[] | null, error }
  },

  /**
   * Fetch all departments for the school.
   */
  async getDepartments() {
    const { data, error } = await supabase.rpc('admin_get_departments')
    return { data: data as Department[] | null, error }
  },

  /**
   * Fetch all moderators for the school.
   */
  async getModerators() {
    const { data, error } = await supabase.rpc('admin_get_moderators')
    return { data: data as Moderator[] | null, error }
  },

  /**
   * Fetch all staff profiles for the school.
   */
  async getStaff() {
    const { data, error } = await supabase.rpc('admin_get_staff')
    return { data: data as StaffProfile[] | null, error }
  }
}
