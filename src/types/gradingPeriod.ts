export interface GradingPeriod {
  id: string;
  name: string;
  department: string;
  academic_year_id: string;
  academic_year_name: string;
  semester: string;
  required_payment_percentage: number;
  is_active: boolean;
}

export interface GradingPeriodFilters {
  filter_academic_year_id?: string | null;
  filter_semester?: string | null;
  filter_department?: string | null;
  filter_is_active?: boolean | null;
}
