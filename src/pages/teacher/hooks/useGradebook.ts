import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { teacherService } from '../../../services/teacherService.ts';
import { schoolAdminService } from '../../../services/schoolAdminService.ts';
import { offlineSync, PendingAssignment } from '../../../utils/offlineSync.ts';
import {
  TeacherClass,
  TeacherStudent,
  TeacherAssignment,
  TeacherGrade
} from '../../../types/teacher.ts';
import { GradingPeriod } from '../../../types/schoolAdmin.ts';
import { generateExcel, exportAssignmentExcel } from '../utils/gradebookExport.ts';

export const useGradebook = () => {
  const [searchParams] = useSearchParams();
  const classIdFromQuery = searchParams.get('classId');

  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState(classIdFromQuery || '');
  const [gradingPeriods, setGradingPeriods] = useState<GradingPeriod[]>([]);
  const [selectedGradingPeriodId, setSelectedGradingPeriodId] = useState('');
  
  const [roster, setRoster] = useState<TeacherStudent[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [grades, setGrades] = useState<TeacherGrade[]>([]);
  const [deletedAssignmentIds, setDeletedAssignmentIds] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [gradeSaving, setGradeSaving] = useState<string | null>(null); // assignmentId-studentId
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // View Mode
  const [viewMode, setViewMode] = useState<'grid' | 'assignment'>('grid');

  // View Options
  const [viewOptions, setViewOptions] = useState({
    showStudentId: true,
    showAsPercentage: false,
    showAssignmentActions: true,
  });
  const [showViewOptions, setShowViewOptions] = useState(false);

  // Focused assignment for "by assignment" view
  const [focusedAssignmentId, setFocusedAssignmentId] = useState<string | null>(null);

  // Form for new/edit assignment
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [assignmentForm, setAssignmentForm] = useState({
    p_title: '',
    p_max_score: 100,
    p_due_date: new Date().toISOString().split('T')[0]
  });

  const fetchInitialData = async () => {
    setFetchLoading(true);
    
    const cachedClasses = await offlineSync.getCachedData('my_classes');
    const cachedPeriods = await offlineSync.getCachedData('grading_periods');
    
    if (cachedClasses) setClasses(cachedClasses);
    if (cachedPeriods) setGradingPeriods(cachedPeriods);
    
    if (!navigator.onLine && cachedClasses && cachedPeriods) {
        if (!selectedClassId && cachedClasses.length > 0) setSelectedClassId(cachedClasses[0].id);
        if (cachedPeriods.length > 0) setSelectedGradingPeriodId(cachedPeriods[0].id);
        setFetchLoading(false);
        return;
    }

    const [classesRes, periodsRes] = await Promise.all([
      teacherService.getMyClasses(),
      schoolAdminService.getGradingPeriods()
    ]);

    if (classesRes.data) {
      setClasses(classesRes.data);
      offlineSync.cacheData('my_classes', classesRes.data);
      if (!selectedClassId && classesRes.data.length > 0) {
        setSelectedClassId(classesRes.data[0].id);
      }
    }
    if (periodsRes.data) {
      setGradingPeriods(periodsRes.data);
      offlineSync.cacheData('grading_periods', periodsRes.data);
      if (periodsRes.data.length > 0) {
        setSelectedGradingPeriodId(periodsRes.data[0].id);
      }
    }
    setFetchLoading(false);
  };

  const fetchRoster = async () => {
    if (!selectedClassId) return;
    
    const cacheKey = `roster_${selectedClassId}`;
    const cached = await offlineSync.getCachedData(cacheKey);
    if (cached) setRoster(cached);
    
    if (!navigator.onLine && cached) return;

    const { data } = await teacherService.getClassRoster(selectedClassId);
    if (data) {
        setRoster(data);
        offlineSync.cacheData(cacheKey, data);
    }
  };

  const fetchGradesAndAssignments = async () => {
    if (!selectedClassId || !selectedGradingPeriodId) return;
    setLoading(true);
    
    const deletedOffline = await offlineSync.getDeletedAssignments(selectedClassId);
    setDeletedAssignmentIds(deletedOffline.map(d => d.id));

    const assignKey = `assignments_${selectedClassId}_${selectedGradingPeriodId}`;
    const gradesKey = `grades_${selectedClassId}_${selectedGradingPeriodId}`;
    
    const cachedAssignments = await offlineSync.getCachedData(assignKey) as TeacherAssignment[] | null;
    const cachedGrades = await offlineSync.getCachedData(gradesKey) as TeacherGrade[] | null;
    
    const pendingAssignments = await offlineSync.getPendingAssignments(selectedClassId);
    const pendingGrades = await offlineSync.getPendingGrades(selectedClassId);
    
    let displayAssignments = cachedAssignments || [];
    let displayGrades = cachedGrades || [];
    
    pendingAssignments.forEach(pa => {
        const existing = displayAssignments.find(a => a.id === pa.id);
        if (!existing) {
            displayAssignments = [...displayAssignments, {
                id: pa.id,
                title: pa.title,
                max_score: pa.max_score,
                due_date: pa.due_date,
                class_id: pa.classId,
                grading_period_id: pa.grading_period_id,
                school_id: '',
                action_status: pa.action_status
            } as TeacherAssignment];
        } else {
            existing.action_status = pa.action_status;
            existing.title = pa.title;
            existing.max_score = pa.max_score;
            existing.due_date = pa.due_date;
        }
    });
    
    pendingGrades.forEach(pg => {
        const index = displayGrades.findIndex(g => g.assignment_id === pg.assignment_id && g.student_id === pg.student_id);
        const gradeObj = {
            assignment_id: pg.assignment_id,
            student_id: pg.student_id,
            score: pg.score,
            class_id: pg.classId,
            school_id: '',
            id: '',
            updated_at: new Date().toISOString(),
            action_status: pg.action_status
        } as TeacherGrade;
        
        if (index > -1) {
            displayGrades[index] = gradeObj;
        } else {
            displayGrades.push(gradeObj);
        }
    });

    setAssignments(displayAssignments);
    setGrades(displayGrades);
    
    if (viewMode === 'assignment' && !focusedAssignmentId && displayAssignments.length > 0) {
        setFocusedAssignmentId(displayAssignments[0].id);
    }

    if (!navigator.onLine) {
        setLoading(false);
        return;
    }

    const [assignmentsRes, gradesRes] = await Promise.all([
      teacherService.getAssignments(selectedClassId, selectedGradingPeriodId),
      teacherService.getGrades(selectedClassId, selectedGradingPeriodId)
    ]);
    
    if (assignmentsRes.data) {
      setAssignments(assignmentsRes.data);
      offlineSync.cacheData(assignKey, assignmentsRes.data);
      if (viewMode === 'assignment' && !focusedAssignmentId && assignmentsRes.data.length > 0) {
        setFocusedAssignmentId(assignmentsRes.data[0].id);
      }
    }
    if (gradesRes.data) {
        setGrades(gradesRes.data);
        offlineSync.cacheData(gradesKey, gradesRes.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchRoster();
    }
  }, [selectedClassId]);

  useEffect(() => {
    if (selectedClassId && selectedGradingPeriodId) {
      fetchGradesAndAssignments();
    }
  }, [selectedClassId, selectedGradingPeriodId]);

  useEffect(() => {
    const unsubscribe = offlineSync.onSyncSuccess(() => {
      if (selectedClassId && selectedGradingPeriodId) {
        fetchGradesAndAssignments();
      }
      if (selectedClassId) {
        fetchRoster();
      }
      fetchInitialData();
    });

    return () => unsubscribe();
  }, [selectedClassId, selectedGradingPeriodId]);

  useEffect(() => {
    if (viewMode === 'assignment' && !focusedAssignmentId && assignments.length > 0) {
      setFocusedAssignmentId(assignments[0].id);
    }
  }, [viewMode, assignments]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSaveGrade = async (assignmentId: string, studentId: string, score: number | null, remarks?: string | null) => {
    setGradeSaving(`${assignmentId}-${studentId}`);
    
    const params = {
      p_class_id: selectedClassId,
      p_assignment_id: assignmentId,
      p_student_id: studentId,
      p_score: score ?? 0,
      p_remarks: remarks
    };

    if (!navigator.onLine) {
        await offlineSync.saveGradeLocally({
            assignment_id: assignmentId,
            student_id: studentId,
            score: score ?? 0,
            classId: selectedClassId
        });
        
        setGrades(prev => {
            const index = prev.findIndex(g => g.assignment_id === assignmentId && g.student_id === studentId);
            const newGrade = { 
                assignment_id: assignmentId, 
                student_id: studentId, 
                score: score ?? 0,
                updated_at: new Date().toISOString()
            } as TeacherGrade;
            if (index > -1) {
                const updated = [...prev];
                updated[index] = newGrade;
                return updated;
            }
            return [...prev, newGrade];
        });
        
        showMessage('success', 'Grade saved locally (Offline)');
        setGradeSaving(null);
        return;
    }

    const { error } = await teacherService.saveGrade(params);

    if (error) {
      showMessage('error', error.message || 'Failed to save grade');
    } else {
      const { data } = await teacherService.getGrades(selectedClassId, selectedGradingPeriodId);
      if (data) {
          setGrades(data);
          const gradesKey = `grades_${selectedClassId}_${selectedGradingPeriodId}`;
          offlineSync.cacheData(gradesKey, data);
      }
    }
    setGradeSaving(null);
  };

  const handleGenerateExcel = () => {
    const result = generateExcel(roster, assignments, grades, classes, selectedClassId, gradingPeriods, selectedGradingPeriodId);
    if (result?.error) {
      showMessage('error', result.error);
    }
  };

  const handleExportAssignmentExcel = () => {
    const result = exportAssignmentExcel(focusedAssignmentId, assignments, roster, grades, classes, selectedClassId);
    if (result?.error) {
      showMessage('error', result.error);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !selectedGradingPeriodId) return;
    setLoading(true);
    
    const tempId = crypto.randomUUID();
    const newAssignment: PendingAssignment = {
        id: tempId,
        grading_period_id: selectedGradingPeriodId,
        title: assignmentForm.p_title,
        max_score: assignmentForm.p_max_score,
        due_date: assignmentForm.p_due_date,
        classId: selectedClassId
    };

    if (!navigator.onLine) {
        await offlineSync.saveAssignmentLocally(newAssignment);
        
        setAssignments(prev => [...prev, {
            id: tempId,
            title: newAssignment.title,
            max_score: newAssignment.max_score,
            due_date: newAssignment.due_date,
            class_id: selectedClassId,
            grading_period_id: selectedGradingPeriodId,
            school_id: ''
        } as TeacherAssignment]);
        
        showMessage('success', 'Assignment created locally (Offline)');
        setShowCreateAssignment(false);
        setAssignmentForm({
          p_title: '',
          p_max_score: 100,
          p_due_date: new Date().toISOString().split('T')[0]
        });
        setLoading(false);
        return;
    }
    
    const { error } = await teacherService.createAssignment({
      id: tempId,
      p_class_id: selectedClassId,
      p_grading_period_id: selectedGradingPeriodId,
      ...assignmentForm
    } as any);

    if (error) {
      showMessage('error', error.message || 'Failed to create assignment');
    } else {
      showMessage('success', 'Assignment created successfully!');
      setShowCreateAssignment(false);
      setAssignmentForm({
        p_title: '',
        p_max_score: 100,
        p_due_date: new Date().toISOString().split('T')[0]
      });
      fetchGradesAndAssignments();
    }
    setLoading(false);
  };

  const handleUpdateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssignmentId || !selectedClassId) return;
    setLoading(true);

    const updateData = {
      p_assignment_id: editingAssignmentId,
      p_title: assignmentForm.p_title,
      p_max_score: assignmentForm.p_max_score,
      p_due_date: assignmentForm.p_due_date
    };

    if (!navigator.onLine) {
      const existing = assignments.find(a => a.id === editingAssignmentId);
      if (existing) {
        await offlineSync.saveAssignmentLocally({
          id: editingAssignmentId,
          classId: selectedClassId,
          grading_period_id: existing.grading_period_id,
          title: updateData.p_title,
          max_score: updateData.p_max_score,
          due_date: updateData.p_due_date
        } as PendingAssignment);

        setAssignments(prev => prev.map(a => 
          a.id === editingAssignmentId 
            ? { ...a, title: updateData.p_title, max_score: updateData.p_max_score, due_date: updateData.p_due_date, action_status: 'updated' } 
            : a
        ));
        
        showMessage('success', 'Assignment updated locally (Offline)');
        setShowCreateAssignment(false);
        setEditingAssignmentId(null);
        setAssignmentForm({
          p_title: '',
          p_max_score: 100,
          p_due_date: new Date().toISOString().split('T')[0]
        });
      }
      setLoading(false);
      return;
    }

    const { error } = await teacherService.updateAssignment(updateData);

    if (error) {
      showMessage('error', error.message || 'Failed to update assignment');
    } else {
      showMessage('success', 'Assignment updated successfully!');
      setShowCreateAssignment(false);
      setEditingAssignmentId(null);
      setAssignmentForm({
        p_title: '',
        p_max_score: 100,
        p_due_date: new Date().toISOString().split('T')[0]
      });
      fetchGradesAndAssignments();
    }
    setLoading(false);
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!window.confirm('Are you sure you want to delete this assignment and all its grades?')) return;
    
    setLoading(true);
    if (!navigator.onLine) {
      const isPending = (await offlineSync.getPendingAssignments(selectedClassId)).find(a => a.id === assignmentId);
      await offlineSync.deleteAssignmentLocally(assignmentId, selectedClassId, !!isPending);
      
      if (isPending) {
        setAssignments(prev => prev.filter(a => a.id !== assignmentId));
        setGrades(prev => prev.filter(g => g.assignment_id !== assignmentId));
        if (focusedAssignmentId === assignmentId) setFocusedAssignmentId(null);
      } else {
        setDeletedAssignmentIds(prev => [...prev, assignmentId]);
      }
      
      showMessage('success', 'Assignment marked for deletion (Offline)');
      setLoading(false);
      return;
    }

    const { error } = await teacherService.deleteAssignment(assignmentId);
    if (error) {
      showMessage('error', error.message || 'Failed to delete assignment');
    } else {
      showMessage('success', 'Assignment deleted successfully!');
      if (focusedAssignmentId === assignmentId) setFocusedAssignmentId(null);
      fetchGradesAndAssignments();
    }
    setLoading(false);
  };

  const handleRestoreAssignment = async (assignmentId: string) => {
    setLoading(true);
    await offlineSync.restoreAssignmentLocally(assignmentId);
    setDeletedAssignmentIds(prev => prev.filter(id => id !== assignmentId));
    showMessage('success', 'Assignment restored');
    setLoading(false);
  };

  return {
    classes,
    selectedClassId,
    setSelectedClassId,
    gradingPeriods,
    selectedGradingPeriodId,
    setSelectedGradingPeriodId,
    roster,
    assignments,
    grades,
    deletedAssignmentIds,
    loading,
    fetchLoading,
    gradeSaving,
    message,
    viewMode,
    setViewMode,
    viewOptions,
    setViewOptions,
    showViewOptions,
    setShowViewOptions,
    focusedAssignmentId,
    setFocusedAssignmentId,
    showCreateAssignment,
    setShowCreateAssignment,
    editingAssignmentId,
    setEditingAssignmentId,
    assignmentForm,
    setAssignmentForm,
    handleSaveGrade,
    handleGenerateExcel,
    handleExportAssignmentExcel,
    handleCreateAssignment,
    handleUpdateAssignment,
    handleDeleteAssignment,
    handleRestoreAssignment
  };
};
