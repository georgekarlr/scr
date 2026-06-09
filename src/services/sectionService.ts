import { supabase } from '../lib/supabase'
import { Section, SectionFilters } from '../types/section'

export const sectionService = {
  async getSections(filters?: SectionFilters) {
    try {
      const { data, error } = await supabase.rpc('get_sections', {
        search_term: filters?.search_term || null,
        filter_academic_year: filters?.filter_academic_year || null
      });

      if (error) {
        console.error('Error fetching sections:', error);
        return { data: null, error };
      }

      return { data: data as Section[], error: null };
    } catch (error: any) {
      console.error('Unexpected error in getSections:', error);
      return { data: null, error };
    }
  },

  async createSection(name: string, gradeLevel: string, academicYear: string, adviserId?: string | null) {
    try {
      const { data, error } = await supabase.rpc('create_section', {
        p_name: name,
        p_grade_level: gradeLevel,
        p_academic_year: academicYear,
        p_adviser_id: adviserId || null
      });

      if (error) {
        console.error('Error creating section:', error);
        return { data: null, error };
      }

      return { data: data[0] as Section, error: null };
    } catch (error: any) {
      console.error('Unexpected error in createSection:', error);
      return { data: null, error };
    }
  },

  async updateSection(id: string, name: string, gradeLevel: string, academicYear: string, adviserId?: string | null) {
    try {
      const { data, error } = await supabase.rpc('update_section', {
        p_section_id: id,
        p_name: name,
        p_grade_level: gradeLevel,
        p_academic_year: academicYear,
        p_adviser_id: adviserId || null
      });

      if (error) {
        console.error('Error updating section:', error);
        return { data: null, error };
      }

      return { data: data[0] as Section, error: null };
    } catch (error: any) {
      console.error('Unexpected error in updateSection:', error);
      return { data: null, error };
    }
  },

  async deleteSection(id: string) {
    try {
      const { data, error } = await supabase.rpc('delete_section', {
        p_section_id: id
      });

      if (error) {
        console.error('Error deleting section:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Unexpected error in deleteSection:', error);
      return { data: null, error };
    }
  }
};
