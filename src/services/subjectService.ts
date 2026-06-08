import { supabase } from '../lib/supabase'
import { Subject } from '../types/subject'

export const subjectService = {
  async getSubjects(searchTerm?: string) {
    try {
      const { data, error } = await supabase.rpc('get_subjects', {
        search_term: searchTerm || null
      })
      if (error) throw error
      return { data: data as Subject[], error: null }
    } catch (error: any) {
      console.error('Error fetching subjects:', error)
      return { data: null, error }
    }
  },

  async createSubject(code: string, name: string, units: number) {
    try {
      const { data, error } = await supabase.rpc('create_subject', {
        p_code: code,
        p_name: name,
        p_units: units
      })
      if (error) throw error
      return { data: data[0] as Subject, error: null }
    } catch (error: any) {
      console.error('Error creating subject:', error)
      return { data: null, error }
    }
  },

  async updateSubject(id: string, code: string, name: string, units: number) {
    try {
      const { data, error } = await supabase.rpc('update_subject', {
        p_subject_id: id,
        p_code: code,
        p_name: name,
        p_units: units
      })
      if (error) throw error
      return { data: data[0] as Subject, error: null }
    } catch (error: any) {
      console.error('Error updating subject:', error)
      return { data: null, error }
    }
  },

  async deleteSubject(id: string) {
    try {
      const { data, error } = await supabase.rpc('delete_subject', {
        p_subject_id: id
      })
      if (error) throw error
      return { data, error: null }
    } catch (error: any) {
      console.error('Error deleting subject:', error)
      return { data: null, error }
    }
  }
}
