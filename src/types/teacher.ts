export interface TeachingSchedule {
  class_id: string;
  subject_code: string;
  subject_name: string;
  subject_units: number;
  section_name: string;
  room_name: string | null;
  room_building: string | null;
  days_of_week: string | null;
  start_time: string | null;
  end_time: string | null;
  enrolled_students: number;
  max_capacity: number;
  is_co_teacher: boolean;
}

export interface TeacherListItem {
  teacher_id: string;
  first_name: string;
  last_name: string;
  created_at: string;
  active_classes_count: number;
}

export interface TeacherProfileBasic {
  teacher_id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at: string;
}

export interface TeacherScheduleItem {
  class_id: string;
  subject_code: string;
  subject_name: string;
  section_name: string;
  semester: string;
  days_of_week: string | null;
  start_time: string | null;
  end_time: string | null;
  room_name: string | null;
  capacity: number;
  enrolled_count: number;
  is_co_teacher: boolean;
}

export interface TeacherProfileData {
  profile: TeacherProfileBasic;
  schedule: TeacherScheduleItem[];
}
