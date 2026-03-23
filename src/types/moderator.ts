export interface ModeratorDepartment {
  id: string
  name: string
}

export interface ModeratorSubject {
  id: string
  name: string
  code: string | null
}

export interface ModeratorClass {
  id: string
  department_name: string
  subject_name: string
  subject_code: string | null
  section_name: string
  teacher_id: string | null
  teacher_first_name: string | null
  teacher_last_name: string | null
  created_at: string
}

export interface ModeratorCreateClassParams {
  p_department_id: string
  p_subject_id: string
  p_name: string
  p_teacher_id: string
}

export interface ModeratorClassRoster {
  enrollment_id: string
  student_id: string
  student_id_number: string
  first_name: string
  last_name: string
}

export interface ModeratorEnrollStudentParams {
  p_class_id: string
  p_student_id: string
}

export interface ModeratorRemoveStudentParams {
  p_class_id: string
  p_student_id: string
}

export interface ModeratorEnrollmentRequest {
  request_id: string
  subject_name: string
  section_name: string
  teacher_name: string
  student_name: string
  student_id_number: string
  created_at: string
}

export interface ModeratorResolveRequestParams {
  p_request_id: string
  p_status: 'approved' | 'rejected'
}
