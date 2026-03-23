import React, { useState, useEffect } from 'react'
import { moderatorService } from '../../services/moderatorService'
import { offlineSync } from '../../utils/offlineSync'
import { ModeratorEnrollmentRequest } from '../../types/moderator'
import { Check, X, Clock, User, BookOpen } from 'lucide-react'

export const RequestsInboxPage: React.FC = () => {
  const [requests, setRequests] = useState<ModeratorEnrollmentRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    setFetchLoading(true)
    const cached = await offlineSync.getCachedData('moderator_enrollment_requests')
    if (cached) setRequests(cached)

    if (!navigator.onLine && cached) {
      setFetchLoading(false)
      return
    }

    const { data } = await moderatorService.getEnrollmentRequests()
    if (data) {
      setRequests(data)
      offlineSync.cacheData('moderator_enrollment_requests', data)
    }
    setFetchLoading(false)
  }

  const handleResolve = async (requestId: string, status: 'approved' | 'rejected') => {
    if (!navigator.onLine) {
      setMessage({ type: 'error', text: `Resolving requests requires an internet connection.` })
      return
    }

    setLoading(true)
    const { error } = await moderatorService.resolveRequest({
      p_request_id: requestId,
      p_status: status
    })

    if (error) {
      setMessage({ type: 'error', text: error.message || `Failed to ${status} request` })
    } else {
      setMessage({ type: 'success', text: `Request ${status} successfully` })
      fetchRequests()
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
    <div className="p-4 sm:p-10 min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Requests Inbox</h1>
          <p className="text-lg text-gray-500">Review and approve enrollment requests from teachers.</p>
        </div>

        {message && (
          <div className={`mb-8 p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${
            message.type === 'success' 
              ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
              : 'bg-rose-50 border-rose-100 text-rose-700'
          }`}>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
              message.type === 'success' ? 'bg-emerald-100' : 'bg-rose-100'
            }`}>
              {message.type === 'success' ? <Check size={18} /> : <X size={18} />}
            </div>
            <p className="font-semibold">{message.text}</p>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {requests.length === 0 ? (
            <div className="px-6 py-24 text-center">
              <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mx-auto mb-4">
                <Clock size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Inbox is Clear</h3>
              <p className="text-gray-500 max-w-xs mx-auto">No pending enrollment requests. You're all caught up!</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="grid grid-cols-1 gap-4 p-4 lg:hidden">
                {requests.map((req) => (
                  <div key={req.request_id} className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-5">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-blue-600 shrink-0">
                          <User size={24} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate text-base">{req.student_name}</p>
                          <p className="text-xs text-gray-400 font-mono tracking-tighter">{req.student_id_number}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 bg-white px-2 py-1 rounded-lg border border-gray-100">
                        {new Date(req.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3 py-4 border-y border-gray-200/50">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Subject</span>
                        <div className="flex items-center gap-1.5 text-sm text-gray-700 font-bold bg-blue-50/50 px-2 py-1 rounded-lg">
                          <BookOpen size={14} className="text-blue-500" />
                          <span className="truncate">{req.subject_name}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Section</span>
                        <div className="text-sm text-gray-700 font-medium">
                          {req.section_name}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Requested By</span>
                        <div className="text-sm text-gray-700 font-medium">
                          {req.teacher_name}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-1">
                      <button
                        onClick={() => handleResolve(req.request_id, 'approved')}
                        disabled={loading}
                        className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
                      >
                        <Check size={18} /> Approve
                      </button>
                      <button
                        onClick={() => handleResolve(req.request_id, 'rejected')}
                        disabled={loading}
                        className="flex-1 inline-flex items-center justify-center gap-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-100 px-4 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                      >
                        <X size={18} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 text-gray-400 text-[10px] uppercase tracking-widest">
                      <th className="px-8 py-5 font-bold">Student Information</th>
                      <th className="px-8 py-5 font-bold">Subject</th>
                      <th className="px-8 py-5 font-bold">Section</th>
                      <th className="px-8 py-5 font-bold">Requester</th>
                      <th className="px-8 py-5 font-bold">Submission Date</th>
                      <th className="px-8 py-5 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {requests.map((req) => (
                      <tr key={req.request_id} className="group hover:bg-blue-50/10 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:text-blue-500 transition-all">
                              <User size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{req.student_name}</p>
                              <p className="text-[10px] text-gray-400 font-mono">{req.student_id_number}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="inline-flex items-center gap-2 text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl text-sm font-bold border border-blue-100/50">
                            <BookOpen size={16} className="text-blue-500" />
                            <span>{req.subject_name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="text-sm font-medium text-gray-600">{req.section_name}</div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="text-sm font-medium text-gray-600">{req.teacher_name}</div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="text-sm text-gray-400 font-medium italic">
                            {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => handleResolve(req.request_id, 'approved')}
                              disabled={loading}
                              className="h-10 w-10 flex items-center justify-center text-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm active:scale-90"
                              title="Approve Request"
                            >
                              <Check size={20} />
                            </button>
                            <button
                              onClick={() => handleResolve(req.request_id, 'rejected')}
                              disabled={loading}
                              className="h-10 w-10 flex items-center justify-center text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white rounded-xl transition-all shadow-sm active:scale-90"
                              title="Reject Request"
                            >
                              <X size={20} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
