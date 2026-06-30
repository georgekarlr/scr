import { supabase } from '../lib/supabase'
import { ClassRosterItem, EnrollStudentParams, EncodeLegacyGradeParams, LegacyGradeItem, SchoolGradeItem, EditMasterGradeParams } from '../types/enrollment'
import { Class, ClassFilters } from '../types/class'
import { Student } from '../types/student'

export const enrollmentService = {
  async getUnenrolledStudents(classId: string, searchTerm: string = '') {
    try {
      const { data, error } = await supabase.rpc('get_unenrolled_students_for_class', {
        p_class_id: classId,
        search_term: searchTerm || null
      })
      if (error) return { data: null, error }
      return { data: data as Student[], error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  async enrollStudent(params: EnrollStudentParams) {
    try {
      const { data, error } = await supabase.rpc('enroll_student', {
        p_student_id: params.student_id,
        p_class_id: params.class_id
      })
      if (error) return { data: null, error }
      return { data: data[0] as string, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  async unenrollStudent(enrollmentId: string) {
    try {
      const { data, error } = await supabase.rpc('unenroll_student', {
        p_enrollment_id: enrollmentId
      })
      if (error) return { data: null, error }
      return { data: data as boolean, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  async getClassRoster(classId: string) {
    try {
      const { data, error } = await supabase.rpc('get_class_roster', {
        p_class_id: classId
      })
      if (error) return { data: null, error }
      return { data: data as ClassRosterItem[], error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  async getClasses(filters: ClassFilters = {}) {
    try {
      const { data, error } = await supabase.rpc('get_classes', {
        filter_academic_year_id: filters.filter_academic_year_id || null,
        filter_semester: filters.filter_semester || null,
        filter_department: filters.filter_department || null,
        filter_teacher_id: filters.filter_teacher_id || null,
        filter_subject_id: filters.filter_subject_id || null,
        search_term: filters.search_term || null
      })
      if (error) return { data: null, error }
      return { data: data as Class[], error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  },
  async encodeLegacyGrade(params: EncodeLegacyGradeParams) {
    try {
      const { data, error } = await supabase.rpc('encode_legacy_grade', {
        p_student_id: params.p_student_id,
        p_subject_id: params.p_subject_id,
        p_academic_year_id: params.p_academic_year_id,
        p_semester: params.p_semester,
        p_student_year_level: params.p_student_year_level,
        p_student_course_id: params.p_student_course_id,
        p_final_grade_value: params.p_final_grade_value ?? null,
        p_final_grade_code: params.p_final_grade_code ?? null,
        p_remarks: params.p_remarks ?? null,
      })
      if (error) return { data: null, error }
      return { data: data as boolean, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  },
  async updateGradeByEnrollmentId(enrollmentId: string, finalGrade: string, remarks: string) {
    try {
      const { data: grades, error: fetchError } = await supabase
        .from('grades')
        .select('*')
        .eq('enrollment_id', enrollmentId);

      if (fetchError) return { data: null, error: fetchError };

      let gradeValue: number | null = null;
      let gradeCode: string | null = null;

      const val = parseFloat(finalGrade);
      if (!isNaN(val)) {
        gradeValue = val;
      } else if (finalGrade.trim()) {
        gradeCode = finalGrade.trim().toUpperCase();
      }

      if (grades && grades.length > 0) {
        const { error: updateError } = await supabase
          .from('grades')
          .update({
            grade_value: gradeValue,
            grade_code: gradeCode,
            remarks: remarks.trim() || null
          })
          .eq('enrollment_id', enrollmentId);

        if (updateError) return { data: null, error: updateError };
        return { data: true, error: null };
      } else {
        const { data: gpData, error: gpError } = await supabase
          .from('grading_periods')
          .select('id')
          .limit(1);

        if (gpError) return { data: null, error: gpError };
        if (!gpData || gpData.length === 0) {
          return { data: null, error: new Error('No grading periods found to associate the grade.') };
        }

        const gradingPeriodId = gpData[0].id;
        const { error: insertError } = await supabase
          .from('grades')
          .insert({
            enrollment_id: enrollmentId,
            grading_period_id: gradingPeriodId,
            grade_value: gradeValue,
            grade_code: gradeCode,
            remarks: remarks.trim() || null
          });

        if (insertError) return { data: null, error: insertError };
        return { data: true, error: null };
      }
    } catch (err) {
      return { data: null, error: err }
    }
  },
  async getStudentLegacyGrades(studentId: string) {
    try {
      const { data, error } = await supabase.rpc('get_student_legacy_grades', {
        p_student_id: studentId
      })
      if (error) return { data: null, error }
      return { data: data as LegacyGradeItem[], error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  /** Master Grade Viewer — fetches all school grades via the new RPC.
   *  filter_is_legacy: true = legacy only | false = normal only | null = both */
  async getAllSchoolGrades(filterIsLegacy: boolean | null = null, searchTerm: string | null = null) {
    try {
      const { data, error } = await supabase.rpc('get_all_school_grades', {
        filter_is_legacy: filterIsLegacy,
        search_term: searchTerm || null,
      })
      if (error) return { data: null, error }
      return { data: data as SchoolGradeItem[], error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  /** Update legacy enrollment metadata (subject, year, semester, course, year level). */
  async updateLegacyEnrollmentMeta(
    enrollmentId: string,
    params: {
      subjectId: string;
      academicYearId: string;
      semester: string;
      yearLevel: string;
      courseId: string;
    }
  ) {
    try {
      const { error } = await supabase
        .from('enrollments')
        .update({
          legacy_subject_id: params.subjectId || null,
          legacy_academic_year_id: params.academicYearId || null,
          legacy_semester_name: params.semester || null,
          student_year_level: params.yearLevel || null,
          student_course_id: params.courseId || null,
        })
        .eq('id', enrollmentId)
      return { error: error ?? null }
    } catch (err) {
      return { error: err }
    }
  },

  /** Update a grade row directly by grade_id. */
  async updateGradeById(
    gradeId: string,
    params: {
      gradeValue: number | null;
      gradeCode: string | null;
      remarks: string | null;
    }
  ) {
    try {
      const { error } = await supabase
        .from('grades')
        .update({
          grade_value: params.gradeValue,
          grade_code: params.gradeCode,
          remarks: params.remarks,
        })
        .eq('id', gradeId)
      return { error: error ?? null }
    } catch (err) {
      return { error: err }
    }
  },

  /** Master Grade Viewer — single RPC edit for both normal and legacy grades.
   *  The RPC handles security, grade update, and enrollment meta update. */
  async editMasterGrade(params: EditMasterGradeParams) {
    try {
      const { data, error } = await supabase.rpc('edit_master_grade', {
        p_grade_id: params.gradeId,
        p_enrollment_id: params.enrollmentId,
        p_is_legacy: params.isLegacy,
        p_grade_value: params.gradeValue ?? null,
        p_grade_code: params.gradeCode ?? null,
        p_remarks: params.remarks ?? null,
        p_year_level_taken: params.yearLevel ?? null,
        p_course_id: params.courseId ?? null,
        p_subject_id: params.subjectId ?? null,
        p_academic_year_id: params.academicYearId ?? null,
        p_semester: params.semester ?? null,
      })
      if (error) return { data: null, error }
      return { data: data as boolean, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  },
}
