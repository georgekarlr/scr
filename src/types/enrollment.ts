export interface Enrollment {
  id: string;
  student_id: string;
  class_id: string | null; // nullable after migration
  student_year_level: string;
  student_course_id: string | null;
  school_id: string;
  created_at: string;
  // Legacy ghost-enrollment fields
  legacy_subject_id: string | null;
  legacy_academic_year_id: string | null;
  legacy_semester_name: string | null;
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

export interface EncodeLegacyGradeParams {
  p_student_id: string;
  p_subject_id: string;
  p_academic_year_id: string;     // UUID of the old academic year
  p_semester: string;             // e.g. '1st Semester'
  p_student_year_level: string;   // e.g. '1st Year'
  p_student_course_id: string;
  p_final_grade_value?: number | null;
  p_final_grade_code?: string | null;
  p_remarks?: string | null;
}

export interface LegacyGradeItem {
  enrollment_id: string;
  subject_id: string;
  subject_code: string;
  subject_name: string;
  academic_year_id: string;
  academic_year_name: string;
  semester: string;
  year_level: string;
  course_id: string;
  course_code: string;
  final_grade_value: number | null;
  final_grade_code: string | null;
  remarks: string | null;
  encoded_at: string;
}

export interface EditMasterGradeParams {
  gradeId: string;
  enrollmentId: string;
  isLegacy: boolean;
  // Grade data
  gradeValue?: number | null;
  gradeCode?: string | null;
  remarks?: string | null;
  // Common enrollment data (both normal & legacy)
  yearLevel?: string | null;
  courseId?: string | null;
  // Legacy-only metadata
  subjectId?: string | null;
  academicYearId?: string | null;
  semester?: string | null;
}

export interface SchoolGradeItem {
  grade_id: string;
  enrollment_id: string;
  student_id: string;
  student_name: string;
  student_id_number: string;
  is_legacy: boolean;

  // IDs for the edit form (no extra fetches needed)
  subject_id: string | null;
  academic_year_id: string | null;
  course_id: string | null;
  grading_period_id: string;

  // Display text
  subject_code: string;
  subject_name: string;
  academic_year_name: string;
  semester: string;
  year_level_taken: string | null;
  grading_period_name: string;

  // Grade data
  grade_value: number | null;
  grade_code: string | null;
  remarks: string | null;
  encoded_at: string;
}
