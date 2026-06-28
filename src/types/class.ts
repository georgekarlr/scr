// types/class.ts

export interface ClassSchedule {
  schedule_id: string;
  room_id: string | null;
  room_name: string | null;
  room_building: string | null;
  days_of_week: string;
  start_time: string;
  end_time: string;
}

export interface Class {
  id: string;
  department: string;
  subject_id: string;
  subject_code: string;
  subject_name: string;
  subject_units: number;
  teacher_id: string;
  teacher_first_name: string;
  teacher_last_name: string;
  co_teacher_id: string | null;
  co_teacher_first_name: string | null;
  co_teacher_last_name: string | null;
  section_name: string;
  semester: string;
  academic_year_id: string;
  academic_year_name: string;
  capacity: number;
  enrolled_count: number;
  schedules: ClassSchedule[]; // Replaced individual fields with this array
}

export interface ClassFilters {
  filter_academic_year_id?: string | null;
  filter_semester?: string | null;
  filter_department?: string | null;
  filter_teacher_id?: string | null;
  filter_subject_id?: string | null;
  search_term?: string | null;
}

export interface ScheduleInput {
  room_id: string | null;
  days_of_week: string;
  start_time: string;
  end_time: string;
}

export interface CreateClassParams {
  subject_id: string;
  teacher_id: string;
  department: string;
  semester: string;
  academic_year_id: string;
  section_name?: string;
  capacity?: number;
  co_teacher_id?: string | null;
  schedules: ScheduleInput[]; // Replaced individual fields
}

export interface UpdateClassParams {
  class_id: string;
  teacher_id: string;
  department: string;
  semester: string;
  academic_year_id: string;
  section_name: string;
  capacity: number;
  co_teacher_id?: string | null;
  schedules: ScheduleInput[]; // Replaced individual fields
}