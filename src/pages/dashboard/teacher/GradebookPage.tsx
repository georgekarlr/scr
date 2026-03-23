import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { teacherService } from '../../../services/teacherService'
import { schoolAdminService } from '../../../services/schoolAdminService'
import { offlineSync, PendingAssignment, PendingGrade } from '../../../utils/offlineSync'
import { 
  TeacherClass, 
  TeacherStudent, 
  TeacherAssignment, 
  TeacherGrade 
} from '../../../types/teacher'
import { GradingPeriod } from '../../../types/schoolAdmin'
import { 
  Plus, 
  BookOpen, 
  ArrowLeft, 
  AlertCircle,
  CheckCircle2,
  Save,
  Loader2,
  Settings2,
  Eye,
  EyeOff,
  Percent,
  Hash,
  LayoutGrid,
  List,
  FileDown
} from 'lucide-react'
import * as XLSX from 'xlsx'

const GradebookPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const classIdFromQuery = searchParams.get('classId')

  const [classes, setClasses] = useState<TeacherClass[]>([])
  const [selectedClassId, setSelectedClassId] = useState(classIdFromQuery || '')
  const [gradingPeriods, setGradingPeriods] = useState<GradingPeriod[]>([])
  const [selectedGradingPeriodId, setSelectedGradingPeriodId] = useState('')
  
  const [roster, setRoster] = useState<TeacherStudent[]>([])
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([])
  const [grades, setGrades] = useState<TeacherGrade[]>([])
  
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [gradeSaving, setGradeSaving] = useState<string | null>(null) // assignmentId-studentId
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // View Mode
  const [viewMode, setViewMode] = useState<'grid' | 'assignment'>('grid')

  // View Options
  const [viewOptions, setViewOptions] = useState({
    showStudentId: true,
    showAsPercentage: false,
  })
  const [showViewOptions, setShowViewOptions] = useState(false)

  // Focused assignment for "by assignment" view
  const [focusedAssignmentId, setFocusedAssignmentId] = useState<string | null>(null)

  // Form for new assignment
  const [showCreateAssignment, setShowCreateAssignment] = useState(false)
  const [assignmentForm, setAssignmentForm] = useState({
    p_title: '',
    p_max_score: 100,
    p_due_date: new Date().toISOString().split('T')[0]
  })

  const fetchInitialData = async () => {
    setFetchLoading(true)
    
    // Try to get cached data first
    const cachedClasses = await offlineSync.getCachedData('my_classes')
    const cachedPeriods = await offlineSync.getCachedData('grading_periods')
    
    if (cachedClasses) setClasses(cachedClasses)
    if (cachedPeriods) setGradingPeriods(cachedPeriods)
    
    if (!navigator.onLine && cachedClasses && cachedPeriods) {
        if (!selectedClassId && cachedClasses.length > 0) setSelectedClassId(cachedClasses[0].id)
        if (cachedPeriods.length > 0) setSelectedGradingPeriodId(cachedPeriods[0].id)
        setFetchLoading(false)
        return
    }

    const [classesRes, periodsRes] = await Promise.all([
      teacherService.getMyClasses(),
      schoolAdminService.getGradingPeriods()
    ])

    if (classesRes.data) {
      setClasses(classesRes.data)
      offlineSync.cacheData('my_classes', classesRes.data)
      if (!selectedClassId && classesRes.data.length > 0) {
        setSelectedClassId(classesRes.data[0].id)
      }
    }
    if (periodsRes.data) {
      setGradingPeriods(periodsRes.data)
      offlineSync.cacheData('grading_periods', periodsRes.data)
      if (periodsRes.data.length > 0) {
        setSelectedGradingPeriodId(periodsRes.data[0].id)
      }
    }
    setFetchLoading(false)
  }

  const fetchRoster = async () => {
    if (!selectedClassId) return
    
    const cacheKey = `roster_${selectedClassId}`
    const cached = await offlineSync.getCachedData(cacheKey)
    if (cached) setRoster(cached)
    
    if (!navigator.onLine && cached) return

    const { data } = await teacherService.getClassRoster(selectedClassId)
    if (data) {
        setRoster(data)
        offlineSync.cacheData(cacheKey, data)
    }
  }

  const fetchGradesAndAssignments = async () => {
    if (!selectedClassId || !selectedGradingPeriodId) return
    setLoading(true)
    
    const assignKey = `assignments_${selectedClassId}_${selectedGradingPeriodId}`
    const gradesKey = `grades_${selectedClassId}_${selectedGradingPeriodId}`
    
    const cachedAssignments = await offlineSync.getCachedData(assignKey) as TeacherAssignment[] | null
    const cachedGrades = await offlineSync.getCachedData(gradesKey) as TeacherGrade[] | null
    
    // When merging cached data with pending offline data
    const pendingAssignments = await offlineSync.getPendingAssignments(selectedClassId)
    const pendingGrades = await offlineSync.getPendingGrades(selectedClassId)
    
    let displayAssignments = cachedAssignments || []
    let displayGrades = cachedGrades || []
    
    // Merge pending assignments (avoid duplicates)
    pendingAssignments.forEach(pa => {
        if (!displayAssignments.find(a => a.id === pa.id)) {
            displayAssignments = [...displayAssignments, {
                id: pa.id,
                title: pa.title,
                max_score: pa.max_score,
                due_date: pa.due_date,
                class_id: pa.classId,
                grading_period_id: pa.grading_period_id,
                school_id: '' // placeholder
            } as TeacherAssignment]
        }
    })
    
    // Merge pending grades
    pendingGrades.forEach(pg => {
        const index = displayGrades.findIndex(g => g.assignment_id === pg.assignment_id && g.student_id === pg.student_id)
        const gradeObj = {
            assignment_id: pg.assignment_id,
            student_id: pg.student_id,
            score: pg.score,
            class_id: pg.classId,
            school_id: '',
            id: '',
            updated_at: new Date().toISOString()
        } as TeacherGrade
        
        if (index > -1) {
            displayGrades[index] = gradeObj
        } else {
            displayGrades.push(gradeObj)
        }
    })

    setAssignments(displayAssignments)
    setGrades(displayGrades)
    
    if (viewMode === 'assignment' && !focusedAssignmentId && displayAssignments.length > 0) {
        setFocusedAssignmentId(displayAssignments[0].id)
    }

    if (!navigator.onLine) {
        setLoading(false)
        return
    }

    const [assignmentsRes, gradesRes] = await Promise.all([
      teacherService.getAssignments(selectedClassId, selectedGradingPeriodId),
      teacherService.getGrades(selectedClassId, selectedGradingPeriodId)
    ])
    
    if (assignmentsRes.data) {
      setAssignments(assignmentsRes.data)
      offlineSync.cacheData(assignKey, assignmentsRes.data)
      if (viewMode === 'assignment' && !focusedAssignmentId && assignmentsRes.data.length > 0) {
        setFocusedAssignmentId(assignmentsRes.data[0].id)
      }
    }
    if (gradesRes.data) {
        setGrades(gradesRes.data)
        offlineSync.cacheData(gradesKey, gradesRes.data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (selectedClassId) {
      fetchRoster()
    }
  }, [selectedClassId])

  useEffect(() => {
    if (selectedClassId && selectedGradingPeriodId) {
      fetchGradesAndAssignments()
    }
  }, [selectedClassId, selectedGradingPeriodId])

  useEffect(() => {
    if (viewMode === 'assignment' && !focusedAssignmentId && assignments.length > 0) {
      setFocusedAssignmentId(assignments[0].id)
    }
  }, [viewMode, assignments])

  const handleSaveGrade = async (assignmentId: string, studentId: string, score: number | null, remarks?: string | null) => {
    setGradeSaving(`${assignmentId}-${studentId}`)
    
    const params = {
      p_class_id: selectedClassId,
      p_assignment_id: assignmentId,
      p_student_id: studentId,
      p_score: score ?? 0,
      p_remarks: remarks
    }

    if (!navigator.onLine) {
        // Save to local queue
        await offlineSync.saveGradeLocally({
            assignment_id: assignmentId,
            student_id: studentId,
            score: score ?? 0,
            classId: selectedClassId
        })
        
        // Optimistic UI update
        setGrades(prev => {
            const index = prev.findIndex(g => g.assignment_id === assignmentId && g.student_id === studentId)
            const newGrade = { 
                assignment_id: assignmentId, 
                student_id: studentId, 
                score: score ?? 0,
                updated_at: new Date().toISOString()
            } as TeacherGrade
            if (index > -1) {
                const updated = [...prev]
                updated[index] = newGrade
                return updated
            }
            return [...prev, newGrade]
        })
        
        setMessage({ type: 'success', text: 'Grade saved locally (Offline)' })
        setTimeout(() => setMessage(null), 3000)
        setGradeSaving(null)
        return
    }

    const { error } = await teacherService.saveGrade(params)

    if (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to save grade' })
      setTimeout(() => setMessage(null), 3000)
    } else {
      // Refresh grades
      const { data } = await teacherService.getGrades(selectedClassId, selectedGradingPeriodId)
      if (data) {
          setGrades(data)
          const gradesKey = `grades_${selectedClassId}_${selectedGradingPeriodId}`
          offlineSync.cacheData(gradesKey, data)
      }
    }
    setGradeSaving(null)
  }

  const handleGenerateExcel = () => {
    if (roster.length === 0) {
      setMessage({ type: 'error', text: 'No students in roster to export' })
      setTimeout(() => setMessage(null), 3000)
      return
    }

    const selectedClass = classes.find(c => c.id === selectedClassId)
    const selectedPeriod = gradingPeriods.find(p => p.id === selectedGradingPeriodId)

    // Prepare data for Excel
    // Header Row: Student Name, Student ID, Assignment 1, Assignment 2, ..., Total Score, Percentage
    const headers = [
      'Student Name',
      'Student ID',
      ...assignments.map(a => `${a.title} (Max: ${a.max_score})`),
      'Total Score',
      'Total Max',
      'Percentage (%)'
    ]

    const rows = roster.map(student => {
      let studentTotalScore = 0
      let totalMaxScore = 0

      const studentGrades = assignments.map(asgn => {
        const grade = grades.find(g => g.assignment_id === asgn.id && g.student_id === student.student_id)
        const score = grade?.score ?? 0
        studentTotalScore += score
        totalMaxScore += asgn.max_score
        return score
      })

      const percentage = totalMaxScore > 0 ? (studentTotalScore / totalMaxScore) * 100 : 0

      return [
        `${student.last_name}, ${student.first_name}`,
        student.student_id_number,
        ...studentGrades,
        studentTotalScore,
        totalMaxScore,
        percentage.toFixed(2)
      ]
    })

    // Combine headers and rows
    const data = [headers, ...rows]

    // Create Worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(data)

    // Create Workbook
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Gradebook')

    // Generate File Name
    const classInfo = selectedClass ? `${selectedClass.subject_code}_${selectedClass.section_name}` : 'Gradebook'
    const periodName = selectedPeriod ? selectedPeriod.name : 'Period'
    const dateStr = new Date().toISOString().split('T')[0]
    const fileName = `Gradebook_${classInfo}_${periodName}_${dateStr}.xlsx`.replace(/\s+/g, '_')

    // Download File
    XLSX.writeFile(workbook, fileName)
  }

  const handleExportAssignmentExcel = () => {
    if (!focusedAssignmentId) return
    const asgn = assignments.find(a => a.id === focusedAssignmentId)
    if (!asgn) return
    if (roster.length === 0) {
      setMessage({ type: 'error', text: 'No students in roster to export' })
      setTimeout(() => setMessage(null), 3000)
      return
    }

    const selectedClass = classes.find(c => c.id === selectedClassId)

    // Header Row: Student ID, Student Name, Score, Max Score, Percentage, Remarks
    const headers = [
      'Student ID',
      'Student Name',
      'Score',
      'Max Score',
      'Percentage (%)',
      'Remarks'
    ]

    const rows = roster.map(student => {
      const grade = grades.find(g => g.assignment_id === asgn.id && g.student_id === student.student_id)
      const score = grade?.score ?? 0
      const percentage = asgn.max_score > 0 ? (score / asgn.max_score) * 100 : 0

      return [
        student.student_id_number,
        `${student.last_name}, ${student.first_name}`,
        score,
        asgn.max_score,
        percentage.toFixed(2),
        grade?.remarks || ''
      ]
    })

    const data = [headers, ...rows]
    const worksheet = XLSX.utils.aoa_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Assignment Grades')

    const classInfo = selectedClass ? `${selectedClass.subject_code}_${selectedClass.section_name}` : 'Gradebook'
    const dateStr = new Date().toISOString().split('T')[0]
    const fileName = `Gradebook_Assignment_${classInfo}_${asgn.title}_${dateStr}.xlsx`.replace(/\s+/g, '_')

    XLSX.writeFile(workbook, fileName)
  }

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClassId || !selectedGradingPeriodId) return
    setLoading(true)
    
    const tempId = crypto.randomUUID()
    const newAssignment: PendingAssignment = {
        id: tempId,
        grading_period_id: selectedGradingPeriodId,
        title: assignmentForm.p_title,
        max_score: assignmentForm.p_max_score,
        due_date: assignmentForm.p_due_date,
        classId: selectedClassId
    }

    if (!navigator.onLine) {
        await offlineSync.saveAssignmentLocally(newAssignment)
        
        // Optimistic UI
        setAssignments(prev => [...prev, {
            id: tempId,
            title: newAssignment.title,
            max_score: newAssignment.max_score,
            due_date: newAssignment.due_date,
            class_id: selectedClassId,
            grading_period_id: selectedGradingPeriodId,
            school_id: ''
        } as TeacherAssignment])
        
        setMessage({ type: 'success', text: 'Assignment created locally (Offline)' })
        setShowCreateAssignment(false)
        setAssignmentForm({
          p_title: '',
          p_max_score: 100,
          p_due_date: new Date().toISOString().split('T')[0]
        })
        setLoading(false)
        setTimeout(() => setMessage(null), 3000)
        return
    }
    
    const { error } = await teacherService.createAssignment({
      id: tempId, // Pass the generated ID
      p_class_id: selectedClassId,
      p_grading_period_id: selectedGradingPeriodId,
      ...assignmentForm
    } as any)

    if (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to create assignment' })
    } else {
      setMessage({ type: 'success', text: 'Assignment created successfully!' })
      setShowCreateAssignment(false)
      setAssignmentForm({
        p_title: '',
        p_max_score: 100,
        p_due_date: new Date().toISOString().split('T')[0]
      })
      fetchGradesAndAssignments()
    }
    setLoading(false)
    setTimeout(() => setMessage(null), 3000)
  }

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <Link to="/dashboard/my-classes" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-2 transition-colors">
              <ArrowLeft size={16} />
              Back to My Classes
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gradebook</h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
            >
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.subject_code} - {cls.section_name}</option>
              ))}
            </select>
            <select
              value={selectedGradingPeriodId}
              onChange={(e) => setSelectedGradingPeriodId(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
            >
              {gradingPeriods.map(period => (
                <option key={period.id} value={period.id}>{period.name}</option>
              ))}
            </select>

            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <LayoutGrid size={16} />
                <span>Grid</span>
              </button>
              <button
                onClick={() => setViewMode('assignment')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'assignment' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <List size={16} />
                <span>By Assignment</span>
              </button>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowViewOptions(!showViewOptions)}
                className="flex items-center gap-2 bg-white border border-gray-300 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                <Settings2 size={18} />
                <span>View</span>
              </button>

              {showViewOptions && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-xl z-50 p-2">
                  <div className="text-xs font-bold text-gray-400 uppercase px-3 py-2">Display Options</div>
                  <button
                    onClick={() => setViewOptions({ ...viewOptions, showStudentId: !viewOptions.showStudentId })}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {viewOptions.showStudentId ? <Eye size={16} /> : <EyeOff size={16} />}
                      Student ID
                    </div>
                    {viewOptions.showStudentId && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                  </button>
                  <button
                    onClick={() => setViewOptions({ ...viewOptions, showAsPercentage: !viewOptions.showAsPercentage })}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {viewOptions.showAsPercentage ? <Percent size={16} /> : <Hash size={16} />}
                      Show Percentages
                    </div>
                    {viewOptions.showAsPercentage && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg border flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'
          }`}>
            {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-8">
          <div className="p-6">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900">Assignments</h2>
                <div className="flex gap-2">
                  {viewMode === 'grid' && (
                    <button
                      onClick={handleGenerateExcel}
                      className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                      title="Export Grid to Excel"
                    >
                      <FileDown size={18} />
                      <span>Export Grid</span>
                    </button>
                  )}
                  {viewMode === 'assignment' && focusedAssignmentId && (
                    <button
                      onClick={handleExportAssignmentExcel}
                      className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                      title="Export Assignment to Excel"
                    >
                      <FileDown size={18} />
                      <span>Export Assignment</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowCreateAssignment(!showCreateAssignment)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <Plus size={18} />
                    New Assignment
                  </button>
                </div>
              </div>

              {showCreateAssignment && (
                <form onSubmit={handleCreateAssignment} className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="md:col-span-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Midterm Quiz"
                      value={assignmentForm.p_title}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, p_title: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Max Score</label>
                    <input
                      type="number"
                      required
                      value={assignmentForm.p_max_score}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, p_max_score: parseInt(e.target.value) })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Due Date</label>
                    <input
                      type="date"
                      required
                      value={assignmentForm.p_due_date}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, p_due_date: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:bg-blue-300"
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateAssignment(false)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {viewMode === 'grid' ? (
                <div className="overflow-auto max-h-[600px] border border-gray-200 rounded-lg">
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 z-20">
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[200px] sticky left-0 bg-gray-50 z-30 border-r border-gray-200">Student Name</th>
                        {assignments.map(asgn => (
                          <th key={asgn.id} className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[120px] bg-gray-50 border-r border-gray-100 last:border-r-0">
                            <div className="truncate mb-0.5" title={asgn.title}>{asgn.title}</div>
                            <div className="text-[10px] text-gray-400 font-medium mb-0.5">{new Date(asgn.due_date).toLocaleDateString()}</div>
                            <div className="text-[10px] text-blue-500 font-bold">Max: {asgn.max_score}</div>
                          </th>
                        ))}
                        {assignments.length === 0 && (
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">No assignments yet</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {roster.map(student => (
                        <tr key={student.student_id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap sticky left-0 bg-white z-10 border-r border-gray-200 group-hover:bg-gray-50">
                            <div className="text-sm font-semibold text-gray-900">{student.last_name}, {student.first_name}</div>
                            {viewOptions.showStudentId && (
                              <div className="text-xs text-gray-500">{student.student_id_number}</div>
                            )}
                          </td>
                          {assignments.map(asgn => {
                            const grade = grades.find(g => g.assignment_id === asgn.id && g.student_id === student.student_id)
                            const isSaving = gradeSaving === `${asgn.id}-${student.student_id}`
                            
                            const score = grade?.score ?? null;
                            const percentage = score !== null ? (score / asgn.max_score) * 100 : null;
                            
                            const displayValue = (grade && viewOptions.showAsPercentage)
                              ? (percentage!).toFixed(1)
                              : (grade?.score ?? '');

                            let scoreColorClass = 'border-gray-200';
                            let bgClass = '';
                            if (percentage !== null) {
                              if (percentage < 60) {
                                scoreColorClass = 'border-red-200 focus:ring-red-500';
                                bgClass = 'bg-red-50/30';
                              } else if (percentage < 75) {
                                scoreColorClass = 'border-yellow-200 focus:ring-yellow-500';
                                bgClass = 'bg-yellow-50/30';
                              } else {
                                scoreColorClass = 'border-green-200 focus:ring-green-500';
                                bgClass = 'bg-green-50/30';
                              }
                            }
                            
                            return (
                              <td key={asgn.id} className={`px-4 py-3 text-center border-r border-gray-50 last:border-r-0 ${bgClass}`}>
                                <div className="relative inline-block w-20">
                                  <input
                                    type={viewOptions.showAsPercentage ? "text" : "number"}
                                    defaultValue={displayValue}
                                    key={`${asgn.id}-${student.student_id}-${viewOptions.showAsPercentage}-${isSaving}-${displayValue}`}
                                    onFocus={(e) => e.target.select()}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        (e.target as HTMLInputElement).blur();
                                      }
                                    }}
                                    onBlur={(e) => {
                                      let val: number | null = null;
                                      if (viewOptions.showAsPercentage) {
                                        const raw = e.target.value.replace('%', '');
                                        const pct = parseFloat(raw);
                                        if (!isNaN(pct)) {
                                          val = (pct / 100) * asgn.max_score;
                                        }
                                      } else {
                                        val = e.target.value === '' ? null : parseFloat(e.target.value)
                                      }

                                      // Clamp value to max_score
                                      if (val !== null && val > asgn.max_score) {
                                        val = asgn.max_score;
                                        e.target.value = viewOptions.showAsPercentage ? '100' : asgn.max_score.toString();
                                      }

                                      if (val !== null && val !== grade?.score) {
                                        handleSaveGrade(asgn.id, student.student_id, val, grade?.remarks)
                                      }
                                    }}
                                    className={`w-full rounded-lg border px-2 py-1.5 text-sm text-center focus:ring-2 outline-none transition-all ${scoreColorClass} ${
                                      viewOptions.showAsPercentage ? 'bg-white/50' : 'bg-white'
                                    }`}
                                    placeholder="-"
                                    disabled={isSaving}
                                  />
                                  {viewOptions.showAsPercentage && grade && (
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">%</span>
                                  )}
                                  {isSaving && (
                                    <div className="absolute -right-6 top-1/2 -translate-y-1/2 text-blue-500 animate-spin">
                                      <Loader2 size={14} />
                                    </div>
                                  )}
                                </div>
                              </td>
                            )
                          })}
                          {assignments.length === 0 && (
                            <td className="px-4 py-3 text-sm text-gray-400 italic">No assignments for this period</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1 border-r border-gray-100 pr-6 space-y-2">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Assignment List</h3>
                    {assignments.length === 0 && (
                      <div className="text-gray-400 italic text-sm py-4">No assignments found</div>
                    )}
                    {assignments.map(asgn => (
                      <button
                        key={asgn.id}
                        onClick={() => setFocusedAssignmentId(asgn.id)}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                          focusedAssignmentId === asgn.id
                            ? 'bg-blue-50 border-blue-200 shadow-sm'
                            : 'bg-white border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="font-bold text-gray-900 mb-1">{asgn.title}</div>
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span>Max: {asgn.max_score}</span>
                          <span>Due: {new Date(asgn.due_date).toLocaleDateString()}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="md:col-span-2">
                    {focusedAssignmentId ? (
                      <div>
                        {(() => {
                          const asgn = assignments.find(a => a.id === focusedAssignmentId);
                          if (!asgn) return null;
                          return (
                            <>
                              <div className="flex justify-between items-center mb-6">
                                <div>
                                  <h3 className="text-xl font-bold text-gray-900">{asgn.title}</h3>
                                  <p className="text-sm text-gray-500">Entering grades for {roster.length} students</p>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs font-bold text-gray-400 uppercase">Max Score</div>
                                  <div className="text-lg font-bold text-blue-600">{asgn.max_score}</div>
                                </div>
                              </div>
                              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                                <table className="w-full">
                                  <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Student</th>
                                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase w-32">Grade</th>
                                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Remarks</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {roster.map(student => {
                                      const grade = grades.find(g => g.assignment_id === asgn.id && g.student_id === student.student_id);
                                      const isSaving = gradeSaving === `${asgn.id}-${student.student_id}`;
                                      const displayValue = (grade && viewOptions.showAsPercentage)
                                        ? ((grade.score / asgn.max_score) * 100).toFixed(1)
                                        : (grade?.score ?? '');

                                      return (
                                        <tr key={student.student_id} className="hover:bg-gray-50">
                                          <td className="px-4 py-3">
                                            <div className="text-sm font-semibold text-gray-900">{student.last_name}, {student.first_name}</div>
                                            {viewOptions.showStudentId && (
                                              <div className="text-xs text-gray-500">{student.student_id_number}</div>
                                            )}
                                          </td>
                                          <td className="px-4 py-3">
                                            <div className="relative">
                                              <input
                                                type={viewOptions.showAsPercentage ? "text" : "number"}
                                                defaultValue={displayValue}
                                                key={`${asgn.id}-${student.student_id}-${viewOptions.showAsPercentage}-focused-${isSaving}-${displayValue}`}
                                                onFocus={(e) => e.target.select()}
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter') {
                                                    (e.target as HTMLInputElement).blur();
                                                  }
                                                }}
                                                onBlur={(e) => {
                                                  let val: number | null = null;
                                                  if (viewOptions.showAsPercentage) {
                                                    const raw = e.target.value.replace('%', '');
                                                    const pct = parseFloat(raw);
                                                    if (!isNaN(pct)) {
                                                      val = (pct / 100) * asgn.max_score;
                                                    }
                                                  } else {
                                                    val = e.target.value === '' ? null : parseFloat(e.target.value)
                                                  }

                                                  // Clamp value to max_score
                                                  if (val !== null && val > asgn.max_score) {
                                                    val = asgn.max_score;
                                                    e.target.value = viewOptions.showAsPercentage ? '100' : asgn.max_score.toString();
                                                  }

                                                  if (val !== null && val !== grade?.score) {
                                                    handleSaveGrade(asgn.id, student.student_id, val, grade?.remarks)
                                                  }
                                                }}
                                                className={`w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-center focus:ring-2 focus:ring-blue-500 outline-none ${
                                                  viewOptions.showAsPercentage ? 'bg-gray-50' : ''
                                                }`}
                                                placeholder="-"
                                                disabled={isSaving}
                                              />
                                              {viewOptions.showAsPercentage && grade && (
                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">%</span>
                                              )}
                                              {isSaving && (
                                                <div className="absolute -right-6 top-1/2 -translate-y-1/2 text-blue-500 animate-spin">
                                                  <Loader2 size={14} />
                                                </div>
                                              )}
                                            </div>
                                          </td>
                                          <td className="px-4 py-3">
                                            <div className="relative">
                                              <input
                                                type="text"
                                                defaultValue={grade?.remarks || ''}
                                                key={`${asgn.id}-${student.student_id}-remarks-${isSaving}-${grade?.remarks || ''}`}
                                                placeholder="Add remarks..."
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter') {
                                                    (e.target as HTMLInputElement).blur();
                                                  }
                                                }}
                                                onBlur={(e) => {
                                                  const val = e.target.value;
                                                  if (val !== (grade?.remarks || '')) {
                                                    handleSaveGrade(asgn.id, student.student_id, grade?.score ?? null, val)
                                                  }
                                                }}
                                                className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                disabled={isSaving}
                                              />
                                              {isSaving && (
                                                <div className="absolute -right-6 top-1/2 -translate-y-1/2 text-blue-500 animate-spin">
                                                  <Loader2 size={14} />
                                                </div>
                                              )}
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-gray-100 rounded-3xl">
                        <BookOpen className="text-gray-200 mb-4" size={48} />
                        <h3 className="text-lg font-bold text-gray-400">Select an Assignment</h3>
                        <p className="text-gray-400 text-sm max-w-xs">Click an assignment on the left to start entering grades for this class.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GradebookPage
