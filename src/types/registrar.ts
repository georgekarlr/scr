import { AppRole, ProfileStatus } from './auth'

export interface PendingProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  created_at: string
}

export interface ApproveProfileParams {
  p_profile_id: string
  p_role: AppRole
}

export interface Student {
  id: string
  student_id_number: string
  first_name: string
  last_name: string
  has_account: boolean
}

export interface CreateStudentParams {
  p_student_id_number: string
  p_first_name: string
  p_last_name: string
}

export interface UpdateStudentParams {
  p_id: string
  p_student_id_number: string
  p_first_name: string
  p_last_name: string
}

export interface StaffProfile {
  id: string
  first_name: string
  last_name: string
  email: string
  role: AppRole
  status: ProfileStatus
}

export interface UpdateStaffRoleParams {
  p_profile_id: string
  p_role: AppRole
  p_status: ProfileStatus
}
