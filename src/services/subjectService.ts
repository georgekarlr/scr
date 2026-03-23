import { supabase } from '../lib/supabase'
import {
  Subject,
  CreateSubjectParams,
  UpdateSubjectParams
} from '../types/subject'

export const subjectService = {
  /**
   * Create a new Subject in the global catalog.
   * Access: school_admin, registrar
   */
  async createSubject(params: CreateSubjectParams) {
    const { data, error } = await supabase.rpc('admin_create_subject', params)
    return { data: data as string | null, error }
  },

  /**
   * Get all Subjects for the current school.
   */
  async getSubjects() {
    const { data, error } = await supabase.rpc('get_subjects')
    return { data: data as Subject[] | null, error }
  },

  /**
   * Update a Subject's name or code.
   * Access: school_admin, registrar
   */
  async updateSubject(params: UpdateSubjectParams) {
    const { error } = await supabase.rpc('admin_update_subject', params)
    return { error }
  },

  /**
   * Remove a Subject from the catalog.
   * Access: school_admin, registrar
   */
  async deleteSubject(id: string) {
    const { error } = await supabase.rpc('admin_delete_subject', { p_id: id })
    return { error }
  }
}
