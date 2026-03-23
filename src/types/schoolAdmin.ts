import { AppRole } from './auth'

export interface CreateGradingPeriodParams {
  p_name: string
  p_weight?: number
  p_start_date?: string | null
  p_end_date?: string | null
}

export interface CreateDepartmentParams {
  p_name: string
  p_moderator_id?: string | null
}

export interface InviteStaffParams {
  p_email: string
  p_first_name: string
  p_last_name: string
  p_role: AppRole
}

export interface UpdateGradingPeriodParams {
  p_id: string
  p_name: string
  p_weight: number
  p_start_date: string | null
  p_end_date: string | null
}

export interface UpdateDepartmentParams {
  p_id: string
  p_name: string
  p_moderator_id: string | null
}

export interface UpdateStaffParams {
  p_profile_id: string
  p_first_name: string
  p_last_name: string
  p_role: AppRole
  p_status: string
}

export interface GradingPeriod {
  id: string
  school_id: string
  name: string
  weight: number
  start_date: string | null
  end_date: string | null
  created_at: string
}

export interface Department {
  id: string
  school_id: string
  name: string
  moderator_id: string | null
  moderator_first_name?: string | null
  moderator_last_name?: string | null
  created_at: string
}

export interface Moderator {
  id: string
  first_name: string
  last_name: string
  email: string
}

export interface StaffProfile {
  id: string
  school_id: string
  email: string
  first_name: string
  last_name: string
  role: AppRole
  status: string
  created_at: string
}
