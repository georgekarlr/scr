export interface Enrollment {
  id: string;
  student_id: string;
  class_id: string;
  student_year_level: string;
  student_course_id: string | null;
  school_id: string;
  created_at: string;
}

export interface ClassRosterItem {
  enrollment_id: string;
  student_id: string;
  student_id_number: string;
  first_name: string;
  last_name: string;
  course_code: string | null;
  year_level: string;
  enrolled_at: string;
}

export interface EnrollStudentParams {
  student_id: string;
  class_id: string;
}
