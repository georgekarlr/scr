import { TeacherClass, TeacherStudent, TeacherAssignment, TeacherGrade } from '../../../types/teacher';
import { GradingPeriod } from '../../../types/schoolAdmin';
import * as XLSX from 'xlsx';

export const generateExcel = (
  roster: TeacherStudent[],
  assignments: TeacherAssignment[],
  grades: TeacherGrade[],
  classes: TeacherClass[],
  selectedClassId: string,
  gradingPeriods: GradingPeriod[],
  selectedGradingPeriodId: string
) => {
  if (roster.length === 0) {
    return { error: 'No students in roster to export' };
  }

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const selectedPeriod = gradingPeriods.find(p => p.id === selectedGradingPeriodId);

  const headers = [
    'Student Name',
    'Student ID',
    ...assignments.map(a => `${a.title} (Max: ${a.max_score})`),
    'Total Score',
    'Total Max',
    'Percentage (%)'
  ];

  const rows = roster.map(student => {
    let studentTotalScore = 0;
    let totalMaxScore = 0;

    const studentGrades = assignments.map(asgn => {
      const grade = grades.find(g => g.assignment_id === asgn.id && g.student_id === student.student_id);
      const score = grade?.score ?? 0;
      studentTotalScore += score;
      totalMaxScore += asgn.max_score;
      return score;
    });

    const percentage = totalMaxScore > 0 ? (studentTotalScore / totalMaxScore) * 100 : 0;

    return [
      `${student.last_name}, ${student.first_name}`,
      student.student_id_number,
      ...studentGrades,
      studentTotalScore,
      totalMaxScore,
      percentage.toFixed(2)
    ];
  });

  const data = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Gradebook');

  const classInfo = selectedClass ? `${selectedClass.subject_code}_${selectedClass.section_name}` : 'Gradebook';
  const periodName = selectedPeriod ? selectedPeriod.name : 'Period';
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `Gradebook_${classInfo}_${periodName}_${dateStr}.xlsx`.replace(/\s+/g, '_');

  XLSX.writeFile(workbook, fileName);
  return { success: true };
};

export const exportAssignmentExcel = (
  focusedAssignmentId: string | null,
  assignments: TeacherAssignment[],
  roster: TeacherStudent[],
  grades: TeacherGrade[],
  classes: TeacherClass[],
  selectedClassId: string
) => {
  if (!focusedAssignmentId) return;
  const asgn = assignments.find(a => a.id === focusedAssignmentId);
  if (!asgn) return;
  if (roster.length === 0) {
    return { error: 'No students in roster to export' };
  }

  const selectedClass = classes.find(c => c.id === selectedClassId);

  const headers = [
    'Student ID',
    'Student Name',
    'Score',
    'Max Score',
    'Percentage (%)',
    'Remarks'
  ];

  const rows = roster.map(student => {
    const grade = grades.find(g => g.assignment_id === asgn.id && g.student_id === student.student_id);
    const score = grade?.score ?? 0;
    const percentage = asgn.max_score > 0 ? (score / asgn.max_score) * 100 : 0;

    return [
      student.student_id_number,
      `${student.last_name}, ${student.first_name}`,
      score,
      asgn.max_score,
      percentage.toFixed(2),
      grade?.remarks || ''
    ];
  });

  const data = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Assignment Grades');

  const classInfo = selectedClass ? `${selectedClass.subject_code}_${selectedClass.section_name}` : 'Gradebook';
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `Gradebook_Assignment_${classInfo}_${asgn.title}_${dateStr}.xlsx`.replace(/\s+/g, '_');

  XLSX.writeFile(workbook, fileName);
  return { success: true };
};
