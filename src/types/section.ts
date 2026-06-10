export interface Section {
  id: string;
  name: string;
  grade_level: string;
  academic_year_id: string;
  academic_year_name: string;
  adviser_id: string | null;
  adviser_first_name?: string | null;
  adviser_last_name?: string | null;
  school_id?: string;
  created_at?: string;
}

export interface SectionFilters {
  search_term?: string | null;
  filter_academic_year_id?: string | null;
}
