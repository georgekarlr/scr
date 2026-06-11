export interface GradeEntry {
  period_name: string;
  grade: number;
  remarks: string | null;
}

export interface ClassGradebook {
  enrollment_id: string;
  student_id_number: string;
  first_name: string;
  last_name: string;
  grades_list: GradeEntry[];
  running_average: number;
}
