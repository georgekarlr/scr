export interface GradeEntry {
  period_id: string;
  period_name: string;
  is_active: boolean;
  grade: string | null;
  remarks: string | null;
}

export interface ClassGradebook {
  enrollment_id: string;
  student_id: string;
  student_id_number: string;
  first_name: string;
  last_name: string;
  course_code: string | null;
  grades_list: GradeEntry[];
  running_average: string | null;
}
