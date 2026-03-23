import { supabase } from '../lib/supabase'
import {
  PendingProfile,
  ApproveProfileParams,
  Student,
  CreateStudentParams,
  UpdateStudentParams,
  StaffProfile,
  UpdateStaffRoleParams
} from '../types/registrar'

export const registrarService = {
  /**
   * Get all pending sign-ups.
   */
  async getPendingProfiles() {
    const { data, error } = await supabase.rpc('registrar_get_pending_profiles')
    return { data: data as PendingProfile[] | null, error }
  },

  /**
   * Approve a user and assign their role.
   */
  async approveProfile(params: ApproveProfileParams) {
    const { error } = await supabase.rpc('registrar_approve_profile', params)
    return { error }
  },

  /**
   * Get all students in the master roster.
   */
  async getStudents() {
    const { data, error } = await supabase.rpc('registrar_get_students')
    return { data: data as Student[] | null, error }
  },

  /**
   * Add a new student to the school roster.
   */
  async createStudent(params: CreateStudentParams) {
    const { data, error } = await supabase.rpc('registrar_create_student', params)
    return { data: data as string | null, error }
  },

  /**
   * Update a student's details in the roster.
   */
  async updateStudent(params: UpdateStudentParams) {
    const { error } = await supabase.rpc('registrar_update_student', params)
    return { error }
  },

  /**
   * Remove a student from the school roster.
   */
  async deleteStudent(id: string) {
    const { error } = await supabase.rpc('registrar_delete_student', { p_id: id })
    return { error }
  },

  /**
   * Get staff members (excluding students and high-level admins).
   */
  async getStaff() {
    const { data, error } = await supabase.rpc('registrar_get_staff')
    return { data: data as StaffProfile[] | null, error }
  },

  /**
   * Change a staff member's role or status.
   */
  async updateStaffRole(params: UpdateStaffRoleParams) {
    const { error } = await supabase.rpc('registrar_update_staff_role', params)
    return { error }
  }
}
