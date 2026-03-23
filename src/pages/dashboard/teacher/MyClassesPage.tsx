import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { teacherService } from '../../../services/teacherService'
import { offlineSync } from '../../../utils/offlineSync'
import { TeacherClass } from '../../../types/teacher'
import { Users, BookOpen, ChevronRight, Calendar, Search, SlidersHorizontal } from 'lucide-react'
import { Link } from 'react-router-dom'

const MyClassesPage: React.FC = () => {
  const [classes, setClasses] = useState<TeacherClass[]>([])
  const [error, setError] = useState<string | null>(null)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchMyClasses = useCallback(async () => {
    setFetchLoading(true)
    
    // Try to get cached data first
    const cached = await offlineSync.getCachedData('my_classes')
    if (cached) {
      setClasses(cached)
    }

    if (!navigator.onLine && cached) {
      setFetchLoading(false)
      return
    }

    const { data, error } = await teacherService.getMyClasses()
    if (error) {
      setError(error.message)
    } else if (data) {
      setClasses(data)
      offlineSync.cacheData('my_classes', data)
    }
    setFetchLoading(false)
  }, [])

  useEffect(() => {
    fetchMyClasses()
  }, [fetchMyClasses])

  const filteredClasses = useMemo(() => {
    return classes.filter(cls => 
      cls.section_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.subject_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.department_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [classes, searchTerm])

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
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">My Classes</h1>
            <p className="text-gray-500 mt-1">View and manage your assigned classes.</p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm text-sm"
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl border bg-red-50 border-red-100 text-red-700 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl p-16 border border-dashed border-gray-200 shadow-sm text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="text-gray-300" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No classes found</h3>
              <p className="text-gray-500 max-w-xs mx-auto">
                {searchTerm ? `No classes matching "${searchTerm}"` : "You haven't been assigned any classes yet."}
              </p>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="mt-4 text-blue-600 font-medium hover:underline text-sm"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            filteredClasses.map((cls) => (
              <div 
                key={cls.id} 
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group"
              >
                <div className="relative h-32 bg-gradient-to-br from-blue-600 to-indigo-700 p-6 flex flex-col justify-end overflow-hidden">
                  {/* Decorative circles */}
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                  <div className="absolute top-10 -left-6 w-20 h-20 bg-blue-400/20 rounded-full blur-xl"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-blue-500/30 text-blue-50 rounded text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border border-blue-400/20">
                        {cls.subject_code}
                      </span>
                    </div>
                    <h3 className="text-white font-bold text-xl truncate leading-tight group-hover:text-blue-50 transition-colors">{cls.subject_name}</h3>
                    <p className="text-blue-100/80 text-sm font-medium">{cls.section_name}</p>
                  </div>
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-500">
                        <SlidersHorizontal size={14} />
                        <span className="text-xs font-medium uppercase tracking-wider">Department</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{cls.department_name}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Users size={14} />
                        <span className="text-xs font-medium uppercase tracking-wider">Students</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-gray-900">{cls.student_count}</span>
                        <div className="flex -space-x-2">
                           {[...Array(Math.min(3, cls.student_count))].map((_, i) => (
                             <div key={i} className="w-5 h-5 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-500">
                               S
                             </div>
                           ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-auto space-y-2">
                    <Link 
                      to={`/dashboard/gradebook?classId=${cls.id}`}
                      className="flex items-center justify-between bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-all text-sm font-bold shadow-sm shadow-blue-200 active:scale-[0.98]"
                    >
                      <span className="flex items-center gap-2">
                        <BookOpen size={16} />
                        Gradebook
                      </span>
                      <ChevronRight size={16} />
                    </Link>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Link 
                        to={`/dashboard/attendance-history?classId=${cls.id}`}
                        className="flex items-center justify-center gap-2 bg-gray-50 text-gray-700 px-3 py-2.5 rounded-xl hover:bg-gray-100 transition-colors text-xs font-semibold border border-gray-100"
                      >
                        <Calendar size={14} />
                        Attendance
                      </Link>
                      <Link 
                        to={`/dashboard/student-request?classId=${cls.id}`}
                        className="flex items-center justify-center gap-2 bg-gray-50 text-gray-700 px-3 py-2.5 rounded-xl hover:bg-gray-100 transition-colors text-xs font-semibold border border-gray-100"
                      >
                        <Plus size={14} />
                        Request
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

const Plus: React.FC<{ size?: number; className?: string }> = ({ size = 20, className = "" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
)

export default MyClassesPage
