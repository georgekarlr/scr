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
