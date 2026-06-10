export interface AcademicYear {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
}

export interface AcademicYearFilters {
  filter_is_active?: boolean | null;
}
