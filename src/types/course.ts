export interface Course {
  id: string;
  code: string;
  name: string;
  department: string;
  description: string | null;
  school_id?: string;
}
