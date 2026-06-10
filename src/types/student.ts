export interface Student {
  student_id: string;
  student_id_number: string | null;
  first_name: string;
  last_name: string;
  student_type: string | null;
  year_level: string | null;
  course_id: string | null;
  course_code: string | null;
  course_name?: string | null;
  section_id: string | null;
  section_name: string | null;
  created_at?: string;
}

export interface StudentFilters {
  search_term?: string | null;
  filter_course_id?: string | null;
  filter_section_id?: string | null;
  filter_year_level?: string | null;
  filter_student_type?: string | null;
  filter_student_id_number?: string | null;
}
