import React from 'react'
import { Link } from 'react-router-dom'
import { useGradebook } from './hooks/useGradebook.ts'
import { 
  Plus, 
  BookOpen, 
  ArrowLeft, 
  AlertCircle,
  CheckCircle2,
  Loader2,
  Settings2,
  Eye,
  EyeOff,
  Percent,
  Hash,
  LayoutGrid,
  List,
  FileDown,
  Trash2,
  RefreshCcw,
  Edit2
} from 'lucide-react'

const GradebookPage: React.FC = () => {
  const {
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
  } = useGradebook()

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
                  <button
                    onClick={() => setViewOptions({ ...viewOptions, showAssignmentActions: !viewOptions.showAssignmentActions })}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Settings2 size={16} />
                      Show Actions
                    </div>
                    {viewOptions.showAssignmentActions && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
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
                    onClick={() => {
                      setEditingAssignmentId(null)
                      setAssignmentForm({
                        p_title: '',
                        p_max_score: 100,
                        p_due_date: new Date().toISOString().split('T')[0]
                      })
                      setShowCreateAssignment(!showCreateAssignment)
                    }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <Plus size={18} />
                    New Assignment
                  </button>
                </div>
              </div>

              {showCreateAssignment && (
                <form onSubmit={editingAssignmentId ? handleUpdateAssignment : handleCreateAssignment} className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="md:col-span-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{editingAssignmentId ? 'Edit' : 'New'} Title</label>
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
                      {editingAssignmentId ? 'Update' : 'Create'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateAssignment(false)
                        setEditingAssignmentId(null)
                      }}
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
                        {assignments.map(asgn => {
                          const isDeletedOffline = deletedAssignmentIds.includes(asgn.id) || asgn.action_status === 'deleted';
                          const isUpdatedOffline = asgn.action_status === 'updated';
                          
                          let headerBg = 'bg-gray-50';
                          let textColor = 'text-gray-500';
                          if (isDeletedOffline) {
                            headerBg = 'bg-red-50';
                            textColor = 'text-red-500';
                          } else if (isUpdatedOffline) {
                            headerBg = 'bg-blue-50';
                            textColor = 'text-blue-600';
                          }

                          return (
                            <th key={asgn.id} className={`px-4 py-3 text-center text-xs font-bold uppercase tracking-wider min-w-[120px] border-r border-gray-100 last:border-r-0 group/th ${headerBg} ${textColor}`}>
                              <div className="flex items-center justify-center gap-1 mb-0.5">
                                <div className="truncate" title={asgn.title}>{asgn.title}</div>
                                {isDeletedOffline ? (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRestoreAssignment(asgn.id);
                                    }}
                                    className="text-blue-500 hover:text-blue-700 transition-opacity"
                                    title="Restore Assignment"
                                  >
                                    <RefreshCcw size={12} />
                                  </button>
                                ) : (
                                  <div className={`flex items-center gap-1 transition-opacity ${viewOptions.showAssignmentActions ? 'opacity-100' : 'opacity-20 group-hover/th:opacity-100 group-focus-within/th:opacity-100'}`}>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingAssignmentId(asgn.id);
                                        setAssignmentForm({
                                          p_title: asgn.title,
                                          p_max_score: asgn.max_score,
                                          p_due_date: new Date(asgn.due_date).toISOString().split('T')[0]
                                        });
                                        setShowCreateAssignment(true);
                                      }}
                                      className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                                      title="Edit Assignment"
                                    >
                                      <Edit2 size={12} />
                                    </button>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteAssignment(asgn.id);
                                      }}
                                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                      title="Delete Assignment"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                )}
                              </div>
                              <div className={`text-[10px] font-medium mb-0.5 ${isDeletedOffline ? 'text-red-400' : 'text-gray-400'}`}>{new Date(asgn.due_date).toLocaleDateString()}</div>
                              <div className={`text-[10px] font-bold ${isDeletedOffline ? 'text-red-500' : 'text-blue-500'}`}>Max: {asgn.max_score}</div>
                            </th>
                          )
                        })}
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
                              <td key={asgn.id} className={`px-4 py-3 text-center border-r border-gray-50 last:border-r-0 ${bgClass} ${grade?.action_status === 'updated' ? 'ring-1 ring-inset ring-blue-400' : ''}`}>
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
                          {assignments.map(asgn => {
                            const isDeletedOffline = deletedAssignmentIds.includes(asgn.id);
                            return (
                              <button
                                key={asgn.id}
                                onClick={() => setFocusedAssignmentId(asgn.id)}
                                className={`w-full text-left p-4 rounded-xl border transition-all ${
                                  focusedAssignmentId === asgn.id
                                    ? (isDeletedOffline ? 'bg-red-50 border-red-200 shadow-sm' : 'bg-blue-50 border-blue-200 shadow-sm')
                                    : (isDeletedOffline ? 'bg-red-50/50 border-red-100' : 'bg-white border-gray-200 hover:border-blue-300')
                                }`}
                              >
                                <div className={`font-bold mb-1 ${isDeletedOffline ? 'text-red-700' : 'text-gray-900'}`}>{asgn.title}</div>
                                <div className="flex justify-between items-center text-xs text-gray-500">
                                  <span className={isDeletedOffline ? 'text-red-500' : ''}>Max: {asgn.max_score}</span>
                                  <span className={isDeletedOffline ? 'text-red-500' : ''}>Due: {new Date(asgn.due_date).toLocaleDateString()}</span>
                                </div>
                                {isDeletedOffline && (
                                  <div className="mt-2 text-[10px] font-bold text-red-600 uppercase">Pending Deletion (Offline)</div>
                                )}
                              </button>
                            );
                          })}
                  </div>
                  <div className="md:col-span-2">
                    {focusedAssignmentId ? (
                      <div>
                        {(() => {
                          const asgn = assignments.find(a => a.id === focusedAssignmentId);
                          if (!asgn) return null;
                          const isDeletedOffline = deletedAssignmentIds.includes(asgn.id);
                          return (
                            <>
                              <div className={`flex justify-between items-center mb-6 p-4 rounded-xl ${isDeletedOffline ? 'bg-red-50' : ''}`}>
                                <div>
                                  <h3 className={`text-xl font-bold ${isDeletedOffline ? 'text-red-900' : 'text-gray-900'}`}>{asgn.title}</h3>
                                  <p className={`text-sm ${isDeletedOffline ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                                    {isDeletedOffline ? 'PENDING DELETION (OFFLINE)' : `Entering grades for ${roster.length} students`}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-right">
                                    <div className={`text-xs font-bold uppercase ${isDeletedOffline ? 'text-red-400' : 'text-gray-400'}`}>Max Score</div>
                                    <div className={`text-lg font-bold ${isDeletedOffline ? 'text-red-600' : 'text-blue-600'}`}>{asgn.max_score}</div>
                                  </div>
                                  {isDeletedOffline ? (
                                    <button
                                      onClick={() => handleRestoreAssignment(asgn.id)}
                                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2 font-medium text-sm"
                                      title="Restore Assignment"
                                    >
                                      <RefreshCcw size={20} />
                                      <span>Restore</span>
                                    </button>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => {
                                          setEditingAssignmentId(asgn.id);
                                          setAssignmentForm({
                                            p_title: asgn.title,
                                            p_max_score: asgn.max_score,
                                            p_due_date: new Date(asgn.due_date).toISOString().split('T')[0]
                                          });
                                          setShowCreateAssignment(true);
                                        }}
                                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Edit Assignment"
                                      >
                                        <Edit2 size={20} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteAssignment(asgn.id)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete Assignment"
                                      >
                                        <Trash2 size={20} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className={`bg-white border rounded-xl overflow-hidden ${isDeletedOffline ? 'border-red-200' : 'border-gray-200'}`}>
                                <table className="w-full">
                                  <thead>
                                    <tr className={`border-b ${isDeletedOffline ? 'bg-red-50/50 border-red-100' : 'bg-gray-50 border-gray-200'}`}>
                                      <th className={`px-4 py-3 text-left text-xs font-bold uppercase ${isDeletedOffline ? 'text-red-500' : 'text-gray-500'}`}>Student</th>
                                      <th className={`px-4 py-3 text-center text-xs font-bold uppercase w-32 ${isDeletedOffline ? 'text-red-500' : 'text-gray-500'}`}>Grade</th>
                                      <th className={`px-4 py-3 text-left text-xs font-bold uppercase ${isDeletedOffline ? 'text-red-500' : 'text-gray-500'}`}>Remarks</th>
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
                                        <tr key={student.student_id} className={`hover:bg-gray-50 ${isDeletedOffline ? 'bg-red-50/20' : ''}`}>
                                          <td className="px-4 py-3">
                                            <div className={`text-sm font-semibold ${isDeletedOffline ? 'text-red-900' : 'text-gray-900'}`}>{student.last_name}, {student.first_name}</div>
                                            {viewOptions.showStudentId && (
                                              <div className={`text-xs ${isDeletedOffline ? 'text-red-400' : 'text-gray-500'}`}>{student.student_id_number}</div>
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
                                                  if (isDeletedOffline) return;
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

                                                  if (val !== null && val > asgn.max_score) {
                                                    val = asgn.max_score;
                                                  }

                                                  if (val !== null && val !== grade?.score) {
                                                    handleSaveGrade(asgn.id, student.student_id, val, grade?.remarks)
                                                  }
                                                }}
                                                className={`w-full rounded-lg border px-3 py-1.5 text-sm text-center focus:ring-2 outline-none transition-all ${
                                                  isDeletedOffline ? 'bg-red-50 border-red-100 text-red-700' : 'bg-white border-gray-200 focus:ring-blue-500'
                                                }`}
                                                placeholder="-"
                                                disabled={isSaving || isDeletedOffline}
                                              />
                                              {viewOptions.showAsPercentage && grade && (
                                                <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none ${isDeletedOffline ? 'text-red-300' : 'text-gray-400'}`}>%</span>
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
                                                  if (isDeletedOffline) return;
                                                  const val = e.target.value;
                                                  if (val !== (grade?.remarks || '')) {
                                                    handleSaveGrade(asgn.id, student.student_id, grade?.score ?? null, val)
                                                  }
                                                }}
                                                className={`w-full rounded-lg border px-3 py-1.5 text-sm focus:ring-2 outline-none ${
                                                  isDeletedOffline ? 'bg-red-50 border-red-100 text-red-700 placeholder:text-red-300' : 'bg-white border-gray-200 focus:ring-blue-500 text-gray-600'
                                                }`}
                                                disabled={isSaving || isDeletedOffline}
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
