export interface Course {
  id: string;
  code: string;
  name: string;
  description: string | null;
  school_id?: string;
}
