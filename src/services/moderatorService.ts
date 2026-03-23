import { supabase } from '../lib/supabase'
import {
  ModeratorDepartment,
  ModeratorSubject,
  ModeratorClass,
  ModeratorCreateClassParams,
  ModeratorClassRoster,
  ModeratorEnrollStudentParams,
  ModeratorRemoveStudentParams,
  ModeratorEnrollmentRequest,
  ModeratorResolveRequestParams,
} from '../types/moderator'

export const moderatorService = {
  /**
   * Get Departments this Moderator controls (so they can pick one in a dropdown)
   */
  async getMyDepartments() {
    const { data, error } = await supabase.rpc('moderator_get_my_departments')
    return { data: data as ModeratorDepartment[] | null, error }
  },

  /**
   * Get Subjects for the school
   */
  async getSubjects() {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('name')
    return { data: data as ModeratorSubject[] | null, error }
  },

  /**
   * Get Classes inside their Departments
   */
  async getClasses() {
    const { data, error } = await supabase.rpc('moderator_get_classes')
    return { data: data as ModeratorClass[] | null, error }
  },

  /**
   * Add a class and assign a teacher
   */
  async createClass(params: ModeratorCreateClassParams) {
    const { data, error } = await supabase.rpc('moderator_create_class', params)
    return { data: data as string | null, error }
  },

  /**
   * Get the current roster for a specific class
   */
  async getClassRoster(classId: string) {
    const { data, error } = await supabase.rpc('moderator_get_class_roster', { p_class_id: classId })
    return { data: data as ModeratorClassRoster[] | null, error }
  },

  /**
   * Enroll a student into a class
   */
  async enrollStudent(params: ModeratorEnrollStudentParams) {
    const { error } = await supabase.rpc('moderator_enroll_student', params)
    return { error }
  },

  /**
   * Remove a student from a class
   */
  async removeStudent(params: ModeratorRemoveStudentParams) {
    const { error } = await supabase.rpc('moderator_remove_student', params)
    return { error }
  },

  /**
   * Get all pending requests for classes in their departments
   */
  async getEnrollmentRequests() {
    const { data, error } = await supabase.rpc('moderator_get_enrollment_requests')
    return { data: data as ModeratorEnrollmentRequest[] | null, error }
  },

  /**
   * Approve or Reject the request
   */
  async resolveRequest(params: ModeratorResolveRequestParams) {
    const { error } = await supabase.rpc('moderator_resolve_request', params)
    return { error }
  },
}
