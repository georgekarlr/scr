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
  department: string | null;
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
  filter_department?: string | null;
}

export interface StudentDashboardSummary {
  profile: {
    student_id_number: string | null;
    full_name: string;
    course_code: string | null;
    course_name: string | null;
    year_level: string | null;
    student_type: string | null;
  };
  academics: {
    total_enrolled_units: number;
    current_gwa: number;
  };
  finance: {
    remaining_balance: number;
    is_cleared: boolean;
  };
}

export interface ReportCardGradeEntry {
  period_name: string;
  grade: string | null;
  remarks: string | null;
}

export interface StudentReportCard {
  class_id: string;
  subject_code: string;
  subject_name: string;
  units: number;
  grades_list: ReportCardGradeEntry[];
  final_average: number;
}

export interface StudentSchedule {
  enrollment_id: string;
  class_id: string;
  schedule_id: string | null;
  subject_code: string;
  subject_name: string;
  units: number;
  section_name: string;
  teacher_first_name: string;
  teacher_last_name: string;
  room_name: string | null;
  room_building: string | null;
  days_of_week: string | null;
  start_time: string | null;
  end_time: string | null;
}

export interface StudentTOR {
  student: {
    student_id_number: string | null;
    full_name: string;
    current_course: string | null;
    date_generated: string;
  };
  records: Array<{
    academic_year: string;
    semester: string;
    year_level_taken: string;
    course_taken: string;
    subject_code: string;
    subject_name: string;
    units: number;
    final_grade: number | null;
    remarks: string | null;
  }>;
}
