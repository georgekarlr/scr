export interface Subject {
  id: string;
  code: string;
  name: string;
  units: number;
  school_id?: string;
}

export interface CreateSubjectParams {
  p_code: string;
  p_name: string;
  p_units: number;
}

export interface UpdateSubjectParams {
  p_subject_id: string;
  p_code: string;
  p_name: string;
  p_units: number;
}
