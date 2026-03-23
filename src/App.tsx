import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { SidebarProvider, useSidebar } from './contexts/SidebarContext'
import { Menu, X, WifiOff, RefreshCw } from 'lucide-react'
import { offlineSync } from './utils/offlineSync'
import LoginForm from './components/auth/LoginForm'
import SignupForm from './components/auth/SignupForm'
import ForgotPasswordForm from './components/auth/ForgotPasswordForm'
import UpdatePasswordForm from './components/auth/UpdatePasswordForm'
import ConfirmAuth from './components/auth/ConfirmAuth'
import Sidebar from './components/layout/Sidebar'
import * as Pages from './pages/dashboard/PlaceholderPages'
import { SettingsPage } from './pages/dashboard/SettingsPage'
import { DepartmentsPage } from './pages/dashboard/DepartmentsPage'
import { StaffPage } from './pages/dashboard/StaffPage'
import { UserApprovalsPage } from './pages/dashboard/UserApprovalsPage'
import { MasterRosterPage } from './pages/dashboard/MasterRosterPage'
import { ClassesPage } from './pages/dashboard/ClassesPage'
import { SubjectsPage } from './pages/dashboard/SubjectsPage'
import { EnrollmentPage } from './pages/dashboard/EnrollmentPage'
import { RequestsInboxPage } from './pages/dashboard/RequestsInboxPage'
import { StaffDirectoryPage } from './pages/dashboard/StaffDirectoryPage'
import { AccountPage } from './pages/dashboard/AccountPage'
import MyClassesPage from './pages/dashboard/teacher/MyClassesPage'
import StudentRequestPage from './pages/dashboard/teacher/StudentRequestPage'
import GradebookPage from './pages/dashboard/teacher/GradebookPage'
import AttendanceHistoryPage from './pages/dashboard/teacher/AttendanceHistoryPage'

const DashboardLayout: React.FC = () => {
    const { user, profile, signOut } = useAuth()
    const { isOpen, toggle } = useSidebar()
    const [isOnline, setIsOnline] = useState(navigator.onLine)
    const [isSyncing, setIsSyncing] = useState(false)

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true)
            syncData()
        }
        const handleOffline = () => setIsOnline(false)

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    const syncData = async () => {
        if (!navigator.onLine) return
        setIsSyncing(true)
        try {
            await offlineSync.syncAll()
        } catch (error) {
            console.error('Manual sync failed:', error)
        } finally {
            setIsSyncing(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {!isOnline && (
                <div className="bg-amber-500 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2 animate-in slide-in-from-top duration-300">
                    <WifiOff size={16} />
                    You are offline. Changes will be saved locally and synced when you're back online.
                </div>
            )}
            <nav className="bg-white border-b border-gray-200 px-4 sm:px-8 py-4 flex justify-between items-center z-30 sticky top-0">
                <div className="flex items-center gap-2 sm:gap-4">
                    <button 
                        onClick={toggle}
                        className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg lg:hidden"
                        aria-label="Toggle Menu"
                    >
                        {isOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                    <div className="flex items-center gap-2">
                        <img src="/icon.svg" alt="School Class Record" className="h-8 w-8" />
                        <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent truncate max-w-[150px] sm:max-w-none">
                            School Class Record
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                    {isOnline && (
                        <button
                            onClick={syncData}
                            disabled={isSyncing}
                            className={`p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors ${isSyncing ? 'animate-spin' : ''}`}
                            title="Sync offline data"
                        >
                            <RefreshCw size={20} />
                        </button>
                    )}
                    <Link to="/dashboard/account" className="hidden sm:flex flex-col items-end hover:bg-gray-50 p-1 px-2 rounded-lg transition-colors">
                        <span className="text-sm font-semibold text-gray-900">
                            {profile ? `${profile.first_name} ${profile.last_name}` : user?.user_metadata?.first_name ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}` : 'User'}
                        </span>
                        <span className="text-xs text-gray-500">{profile?.email || user?.email}</span>
                    </Link>
                    <button 
                        onClick={() => signOut()}
                        className="text-sm font-semibold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors border border-blue-100 sm:border-transparent sm:text-gray-600 sm:hover:text-blue-600"
                    >
                        Sign out
                    </button>
                </div>
            </nav>
            <div className="flex flex-1 relative overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-y-auto bg-gray-50 w-full">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

const DashboardOverview: React.FC = () => {
    const { user, profile } = useAuth()
    const metadata = user?.user_metadata
    
    return (
        <div className="p-4 sm:p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">Dashboard</h1>
                <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
                    <p className="text-gray-600 mb-6">
                        Welcome to School Class Record! You're successfully logged in.
                    </p>
                    <div className="bg-blue-50 border border-blue-100 rounded-lg sm:rounded-xl p-4 sm:p-6">
                        <h2 className="text-sm font-bold text-blue-900 mb-4 uppercase tracking-wider">Your Profile Details</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-blue-600 uppercase">Name</p>
                                <p className="text-sm font-semibold text-blue-900">{profile ? `${profile.first_name} ${profile.last_name}` : metadata?.first_name ? `${metadata.first_name} ${metadata.last_name}` : 'Not Available'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-blue-600 uppercase">School</p>
                                <p className="text-sm font-semibold text-blue-900">{profile?.school_name || metadata?.school_name || metadata?.school_id || 'Not Assigned'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-blue-600 uppercase">Role</p>
                                <p className="text-sm font-semibold text-blue-900 capitalize">{(profile?.role || metadata?.role || 'Not Assigned').replace('_', ' ')}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-blue-600 uppercase">Status</p>
                                <p className="text-sm font-semibold text-blue-900">{profile?.status || 'Pending'}</p>
                            </div>
                            <div className="sm:col-span-2 space-y-1">
                                <p className="text-xs font-medium text-blue-600 uppercase">Email</p>
                                <p className="text-sm font-semibold text-blue-900">{profile?.email || user?.email}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }

    return <>{children}</>
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<LoginForm />} />
                    <Route path="/signup" element={<SignupForm />} />
                    <Route path="/forgot-password" element={<ForgotPasswordForm />} />
                    <Route path="/update-password" element={<UpdatePasswordForm />} />
                    <Route path="/confirm-auth" element={<ConfirmAuth />} />
                    
                    <Route 
                        path="/dashboard" 
                        element={
                            <ProtectedRoute>
                                <SidebarProvider>
                                    <DashboardLayout />
                                </SidebarProvider>
                            </ProtectedRoute>
                        } 
                    >
                        <Route index element={<DashboardOverview />} />
                        <Route path="account" element={<AccountPage />} />
                        
                        {/* School Admin Routes */}
                        <Route path="settings" element={<SettingsPage />} />
                        <Route path="departments" element={<DepartmentsPage />} />
                        <Route path="subjects" element={<SubjectsPage />} />
                        <Route path="staff" element={<StaffPage />} />
                        
                        {/* Registrar Routes */}
                        <Route path="approvals" element={<UserApprovalsPage />} />
                        <Route path="roster" element={<MasterRosterPage />} />
                        <Route path="directory" element={<StaffDirectoryPage />} />
                        
                        {/* Moderator Routes */}
                        <Route path="classes" element={<ClassesPage />} />
                        <Route path="enrollment" element={<EnrollmentPage />} />
                        <Route path="requests" element={<RequestsInboxPage />} />
                        
                        {/* Teacher Routes */}
                        <Route path="my-classes" element={<MyClassesPage />} />
                        <Route path="student-request" element={<StudentRequestPage />} />
                        <Route path="gradebook" element={<GradebookPage />} />
                        <Route path="attendance-history" element={<AttendanceHistoryPage />} />
                        
                        {/* Student Routes */}
                        <Route path="my-grades" element={<Pages.MyGradesPage />} />
                        <Route path="my-attendance" element={<Pages.MyAttendancePage />} />
                    </Route>

                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </AuthProvider>
        </Router>
    )
}

export default App