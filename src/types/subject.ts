export interface Subject {
  id: string;
  name: string;
  code: string | null;
  created_at: string;
}

export interface CreateSubjectParams {
  p_name: string;
  p_code?: string | null;
}

export interface UpdateSubjectParams {
  p_id: string;
  p_name: string;
  p_code?: string | null;
}
