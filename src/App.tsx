import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { NotificationProvider } from './contexts/NotificationContext'
import LoginForm from './components/auth/LoginForm'
import SignupForm from './components/auth/SignupForm'
import ForgotPasswordForm from './components/auth/ForgotPasswordForm'
import UpdatePasswordForm from './components/auth/UpdatePasswordForm'
import ConfirmAuth from './components/auth/ConfirmAuth'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/layout/Layout'
import FeedPage from './pages/FeedPage'
import ExplorePage from './pages/ExplorePage'
import LibraryPage from './pages/LibraryPage'
import PlaceholderPage from './pages/PlaceholderPage'
import UserProfilePage from './pages/UserProfilePage'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'
import NotificationsPage from './pages/NotificationsPage'
import MessagesPage from './pages/MessagesPage'
import ChatPage from './pages/ChatPage'
import UserConnectionsPage from './pages/UserConnectionsPage'
import { Trophy } from 'lucide-react'

function App() {
    console.log('App rendering')
    return (
        <AuthProvider>
            <ToastProvider>
                <NotificationProvider>
                    <Router>
                        <Routes>
                        {/* Public routes */}
                        <Route path="/login" element={<LoginForm />} />
                        <Route path="/signup" element={<SignupForm />} />
                        <Route path="/forgot-password" element={<ForgotPasswordForm />} />
                        <Route path="/auth/confirm" element={<ConfirmAuth />} />
                        <Route path="/account/update-password" element={
                            <ProtectedRoute>
                                <UpdatePasswordForm />
                            </ProtectedRoute>
                        } />

                        {/* Private routes */}
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    <Layout>
                                        <FeedPage />
                                    </Layout>
                                </ProtectedRoute>
                            }
                        />

                        {/* Placeholder routes for navigation items */}
                        <Route path="/library" element={
                            <ProtectedRoute><Layout><LibraryPage /></Layout></ProtectedRoute>
                        } />
                        <Route path="/explore" element={
                            <ProtectedRoute><Layout><ExplorePage /></Layout></ProtectedRoute>
                        } />
                        <Route path="/messages" element={
                            <ProtectedRoute><Layout><MessagesPage /></Layout></ProtectedRoute>
                        } />
                        <Route path="/messages/:conversationId" element={
                            <ProtectedRoute><Layout><ChatPage /></Layout></ProtectedRoute>
                        } />
                        <Route path="/leaderboard" element={
                            <ProtectedRoute><Layout><PlaceholderPage title="Leaderboard" description="See how you rank against other learners." icon={Trophy} /></Layout></ProtectedRoute>
                        } />
                        <Route path="/notifications" element={
                            <ProtectedRoute><Layout><NotificationsPage /></Layout></ProtectedRoute>
                        } />
                        <Route path="/profile" element={
                            <ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>
                        } />
                        {/* Public profile by username */}
                        <Route path="/u/:username" element={
                            <ProtectedRoute>
                                <Layout>
                                    <UserProfilePage />
                                </Layout>
                            </ProtectedRoute>
                        } />
                        <Route path="/u/:username/connections" element={
                            <ProtectedRoute>
                                <Layout>
                                    <UserConnectionsPage />
                                </Layout>
                            </ProtectedRoute>
                        } />
                        <Route path="/settings" element={
                            <ProtectedRoute><Layout><SettingsPage /></Layout></ProtectedRoute>
                        } />

                        {/* Redirect root to dashboard */}
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        
                        {/* Catch all */}
                        <Route path="*" element={
                            <div style={{ padding: '50px', textAlign: 'center', backgroundColor: '#fee2e2' }}>
                                <h1 style={{ color: '#dc2626' }}>404 - Page Not Found</h1>
                                <p>The path <code>{window.location.pathname}</code> does not match any routes.</p>
                                <a href="/login" style={{ color: '#2563eb', fontWeight: 'bold' }}>Go to Login</a>
                            </div>
                        } />
                    </Routes>
                </Router>
                </NotificationProvider>
            </ToastProvider>
        </AuthProvider>
    )
}

export default App