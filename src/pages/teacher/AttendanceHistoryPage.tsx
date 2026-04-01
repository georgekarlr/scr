import React from 'react'
import { Link } from 'react-router-dom'
import { useAttendance } from './hooks/useAttendance.ts'
import { 
  Calendar, 
  ArrowLeft, 
  Search,
  ChevronRight,
  UserCheck,
  UserX,
  Clock,
  HelpCircle,
  FileText,
  Plus,
  Table as TableIcon,
  Layout,
  AlertCircle,
  CheckCircle2,
  Save,
  X as XIcon,
  FileDown,
  Trash2,
  RotateCcw,
  Pencil
} from 'lucide-react'
import { AttendanceStatus } from '../../types/teacher.ts'

const AttendanceHistoryPage: React.FC = () => {
  const {
    classes,
    selectedClassId,
    setSelectedClassId,
    sessions,
    selectedSession,
    records,
    sessionRecords,
    roster,
    viewMode,
    setViewMode,
    fetchLoading,
    sessionsLoading,
    recordsLoading,
    gridLoading,
    saveLoading,
    message,
    showCreateModal,
    setShowCreateModal,
    newSessionForm,
    setNewSessionForm,
    showEditModal,
    setShowEditModal,
    editingSession,
    setEditingSession,
    editSessionForm,
    setEditSessionForm,
    handleSessionClick,
    handleUpdateStatus,
    handleCreateSession,
    handleUpdateSession,
    attendanceMatrix,
    onExportExcel,
    onExportSessionExcel,
    handleDeleteSession,
    handleRestoreSession,
    deletedSessionIds
  } = useAttendance()

  const cycleStatus = (currentStatus: AttendanceStatus | undefined): AttendanceStatus => {
    const statuses: AttendanceStatus[] = ['present', 'absent', 'late', 'excused']
    if (!currentStatus) return 'present'
    const currentIndex = statuses.indexOf(currentStatus)
    return statuses[(currentIndex + 1) % statuses.length]
  }

  const getStatusIcon = (status: string, size = 16) => {
    switch (status) {
      case 'present': return <UserCheck className="text-green-500" size={size} />
      case 'absent': return <UserX className="text-red-500" size={size} />
      case 'late': return <Clock className="text-yellow-500" size={size} />
      case 'excused': return <HelpCircle className="text-blue-500" size={size} />
      default: return null
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-700 border-green-200'
      case 'absent': return 'bg-red-100 text-red-700 border-red-200'
      case 'late': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'excused': return 'bg-blue-100 text-blue-700 border-blue-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
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
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <Link to="/dashboard/my-classes" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-2 transition-colors">
              <ArrowLeft size={16} />
              Back to My Classes
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Attendance Records</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {viewMode === 'grid' && (
               <button
                  onClick={onExportExcel}
                  className="flex items-center gap-2 bg-white text-gray-700 border border-gray-300 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  <FileDown size={16} />
                  Export Report
                </button>
            )}

            {viewMode === 'sessions' && selectedSession && records.length > 0 && (
              <button
                onClick={onExportSessionExcel}
                className="flex items-center gap-2 bg-white text-gray-700 border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-xs font-bold"
              >
                <FileDown size={14} />
                Export Session
              </button>
            )}

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Plus size={16} />
              Add Session
            </button>

            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('sessions')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'sessions' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Layout size={16} />
                Sessions
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <TableIcon size={16} />
                Grid View
              </button>
            </div>

            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
            >
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.subject_code} - {cls.section_name}</option>
              ))}
            </select>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg border flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'
          }`}>
            {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Plus className="text-blue-600" size={24} />
                  New Attendance Session
                </h3>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <XIcon size={20} className="text-gray-500" />
                </button>
              </div>
              
              <form onSubmit={handleCreateSession} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider">Session Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Morning Roll Call"
                    value={newSessionForm.p_name}
                    onChange={(e) => setNewSessionForm({ ...newSessionForm, p_name: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider">Record Date</label>
                  <input
                    type="date"
                    required
                    value={newSessionForm.p_record_date}
                    onChange={(e) => setNewSessionForm({ ...newSessionForm, p_record_date: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                
                <div className="flex gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="flex-2 bg-blue-600 text-white px-8 py-2.5 rounded-xl hover:bg-blue-700 font-bold transition-colors flex items-center justify-center gap-2 disabled:bg-blue-300"
                  >
                    {saveLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save size={18} />
                        Create Session
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Session Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="bg-blue-600 p-6 flex justify-between items-center text-white">
                <div>
                  <h3 className="text-xl font-bold">Edit Session</h3>
                  <p className="text-blue-100 text-sm mt-1">Update attendance session details</p>
                </div>
                <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <XIcon size={24} />
                </button>
              </div>
              
              <form onSubmit={handleUpdateSession} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider">Session Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Morning Session, Lab Day"
                    value={editSessionForm.p_name}
                    onChange={(e) => setEditSessionForm({ ...editSessionForm, p_name: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider">Record Date</label>
                  <input
                    type="date"
                    required
                    value={editSessionForm.p_record_date}
                    onChange={(e) => setEditSessionForm({ ...editSessionForm, p_record_date: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                
                <div className="flex gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="flex-2 bg-blue-600 text-white px-8 py-2.5 rounded-xl hover:bg-blue-700 font-bold transition-colors flex items-center justify-center gap-2 disabled:bg-blue-300"
                  >
                    {saveLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save size={18} />
                        Update Session
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {viewMode === 'sessions' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sessions List */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Calendar size={20} className="text-gray-400" />
                Sessions
              </h2>
              
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {sessionsLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 italic">
                    No sessions found for this class.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                    {sessions.map((session) => {
                      const isDeleted = deletedSessionIds.includes(session.id)
                      return (
                        <button
                          key={session.id}
                          onClick={() => {
                            if (!isDeleted) handleSessionClick(session)
                          }}
                          className={`w-full text-left p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group ${
                            selectedSession?.id === session.id ? 'bg-blue-50/50' : ''
                          } ${isDeleted ? 'bg-red-50/30 cursor-default' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            <div>
                              <p className={`font-bold text-sm ${
                                isDeleted ? 'text-red-600 line-through' : (selectedSession?.id === session.id ? 'text-blue-700' : 'text-gray-900')
                              }`}>
                                {session.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                  <Calendar size={12} />
                                  {new Date(session.record_date).toLocaleDateString()}
                                </p>
                                {isDeleted && (
                                  <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                    Deleted Offline
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isDeleted ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRestoreSession(session.id);
                                }}
                                className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Restore Session"
                              >
                                <RotateCcw size={16} />
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingSession(session);
                                    setEditSessionForm({
                                      p_attendance_id: session.id,
                                      p_name: session.name,
                                      p_record_date: session.record_date
                                    });
                                    setShowEditModal(true);
                                  }}
                                  className="p-1.5 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Edit Session"
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSession(session.id);
                                  }}
                                  className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete Session"
                                >
                                  <Trash2 size={16} />
                                </button>
                                <ChevronRight 
                                  size={16} 
                                  className={`transition-transform ${
                                    selectedSession?.id === session.id ? 'text-blue-500 translate-x-1' : 'text-gray-300 group-hover:translate-x-1'
                                  }`} 
                                />
                              </>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Records View */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FileText size={20} className="text-gray-400" />
                  Records {selectedSession && `— ${selectedSession.name}`}
                </h2>

              {!selectedSession ? (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
                  <Search className="mx-auto text-gray-300 mb-4" size={48} />
                  <h3 className="text-gray-900 font-bold mb-2">Select a Session</h3>
                  <p className="text-gray-500 text-sm max-w-xs mx-auto">
                    Choose an attendance session from the left to view the detailed records of all students.
                  </p>
                </div>
              ) : recordsLoading ? (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Student ID</th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {sessionRecords.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-6 py-12 text-center text-gray-500 italic">
                              No records found for this session.
                            </td>
                          </tr>
                        ) : (
                          sessionRecords.map((record) => (
                            <tr key={`${record.attendance_id}_${record.student_id}`} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 font-mono text-sm text-gray-600">{record.student_id_number}</td>
                              <td className="px-6 py-4 font-semibold text-gray-900">{record.first_name} {record.last_name}</td>
                              <td className="px-6 py-4">
                                <div className="flex justify-center gap-2">
                                  {(['present', 'absent', 'late', 'excused'] as AttendanceStatus[]).map((status) => {
                                    const isSelected = record.status === status
                                    return (
                                      <button
                                        key={status}
                                        disabled={saveLoading}
                                        onClick={() => handleUpdateStatus(selectedSession.id, record.student_id, status)}
                                        className={`px-3 py-1 text-[10px] font-bold rounded-full border capitalize transition-colors flex items-center gap-1 ${
                                          isSelected 
                                            ? getStatusBadgeClass(status) + ' shadow-sm' 
                                            : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50 text-gray-400'
                                        }`}
                                      >
                                        {status}
                                      </button>
                                    )
                                  })}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Matrix Grid View */
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <TableIcon size={20} className="text-gray-400" />
              Attendance Matrix
            </h2>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {gridLoading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : roster.length === 0 ? (
                <div className="p-12 text-center text-gray-500 italic">
                  No roster found for this class.
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[700px]">
                  <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
                    <thead className="sticky top-0 z-10 bg-gray-50">
                      <tr className="border-b border-gray-100">
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-48 bg-gray-50 sticky left-0 z-20">Student Name</th>
                        {sessions.map(session => (
                          <th key={session.id} className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center min-w-[120px]">
                            <div className="truncate mb-1">{session.name}</div>
                            <div className="font-normal text-[10px] text-gray-400">
                              {new Date(session.record_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {roster.map((student) => (
                        <tr key={student.student_id} className="hover:bg-gray-50 transition-colors group">
                          <td className="px-6 py-4 bg-white sticky left-0 z-10 border-r border-gray-50 group-hover:bg-gray-50">
                            <div className="font-semibold text-gray-900 truncate">{student.first_name} {student.last_name}</div>
                            <div className="text-[10px] font-mono text-gray-400">{student.student_id_number}</div>
                          </td>
                          {sessions.map(session => {
                            const status = attendanceMatrix[student.student_id]?.[session.id]
                            return (
                              <td key={session.id} className="px-2 py-4 text-center">
                                <div className="flex justify-center">
                                  <button 
                                    disabled={saveLoading}
                                    onClick={() => handleUpdateStatus(session.id, student.student_id, cycleStatus(status as AttendanceStatus))}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center border shadow-sm transition-all hover:scale-110 active:scale-95 ${
                                      status ? getStatusBadgeClass(status) : 'border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                    }`}
                                    title={status ? (status.charAt(0).toUpperCase() + status.slice(1) + ' (Click to change)') : 'Mark Present'}
                                  >
                                    {status ? getStatusIcon(status, 18) : <Plus size={14} className="text-gray-300" />}
                                  </button>
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-4 text-xs text-gray-500 font-medium bg-gray-50 p-4 rounded-lg border border-gray-100">
              <span className="flex items-center gap-1.5"><UserCheck size={14} className="text-green-500" /> Present</span>
              <span className="flex items-center gap-1.5"><UserX size={14} className="text-red-500" /> Absent</span>
              <span className="flex items-center gap-1.5"><Clock size={14} className="text-yellow-500" /> Late</span>
              <span className="flex items-center gap-1.5"><HelpCircle size={14} className="text-blue-500" /> Excused</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AttendanceHistoryPage
