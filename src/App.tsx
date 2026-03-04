import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { MessageProvider } from './contexts/MessageContext'
import { NavigationProvider } from './contexts/NavigationContext'
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
import WhoToFollowPage from './pages/WhoToFollowPage'
import MessagesPage from './pages/MessagesPage'
import ChatPage from './pages/ChatPage'
import UserConnectionsPage from './pages/UserConnectionsPage'
import PostPage from './pages/PostPage'
import GamesPage from './pages/GamesPage'
import StudyPage from './pages/StudyPage'
import PlayingPage from './pages/PlayingPage'
import TermsOfServicePage from './pages/legal/TermsOfServicePage'
import PrivacyPolicyPage from './pages/legal/PrivacyPolicyPage'
import CookiePolicyPage from './pages/legal/CookiePolicyPage'
import AboutPage from './pages/AboutPage'
import PresentationPage from './pages/PresentationPage'
import HowToPage from './pages/HowToPage'
import GroupsPage from './pages/GroupsPage'

function App() {
    console.log('App rendering, current path:', window.location.pathname)
    return (
        <Router>
            <AuthProvider>
                <ToastProvider>
                    <NotificationProvider>
                        <MessageProvider>
                            <NavigationProvider>
                            <Routes>
                        {/* Legal Pages - Publicly accessible */}
                        <Route path="/about" element={<Layout><AboutPage /></Layout>} />
                        <Route path="/presentation" element={<Layout><PresentationPage /></Layout>} />
                        <Route path="/how-to" element={<Layout><HowToPage /></Layout>} />
                        <Route path="/tos" element={<Layout><TermsOfServicePage /></Layout>} />
                        <Route path="/privacy" element={<Layout><PrivacyPolicyPage /></Layout>} />
                        <Route path="/cookies" element={<Layout><CookiePolicyPage /></Layout>} />

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
                                <Route path="/dashboard" element={<ProtectedRoute><Layout><FeedPage /></Layout></ProtectedRoute>} />
                                <Route path="/library" element={<ProtectedRoute><Layout><LibraryPage /></Layout></ProtectedRoute>} />
                                <Route path="/explore" element={<ProtectedRoute><Layout><ExplorePage /></Layout></ProtectedRoute>} />
                                <Route path="/groups" element={<ProtectedRoute><Layout><GroupsPage /></Layout></ProtectedRoute>} />
                                <Route path="/games" element={<ProtectedRoute><Layout><GamesPage /></Layout></ProtectedRoute>} />
                                <Route path="/messages" element={<ProtectedRoute><Layout><MessagesPage /></Layout></ProtectedRoute>} />
                                <Route path="/messages/:conversationId" element={<ProtectedRoute><Layout><ChatPage /></Layout></ProtectedRoute>} />
                                <Route path="/notifications" element={<ProtectedRoute><Layout><NotificationsPage /></Layout></ProtectedRoute>} />
                                <Route path="/who-to-follow" element={<ProtectedRoute><Layout><WhoToFollowPage /></Layout></ProtectedRoute>} />
                                <Route path="/profile" element={<ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>} />
                                <Route path="/u/:username" element={<ProtectedRoute><Layout><UserProfilePage /></Layout></ProtectedRoute>} />
                                <Route path="/u/:username/connections" element={<ProtectedRoute><Layout><UserConnectionsPage /></Layout></ProtectedRoute>} />
                                <Route path="/settings" element={<ProtectedRoute><Layout><SettingsPage /></Layout></ProtectedRoute>} />
                                <Route path="/study/:id" element={<ProtectedRoute><Layout><StudyPage /></Layout></ProtectedRoute>} />
                                <Route path="/study/:id/playing/:gameId" element={<ProtectedRoute><PlayingPage /></ProtectedRoute>} />
                                <Route path="/p/:setId" element={<ProtectedRoute><Layout><PostPage /></Layout></ProtectedRoute>} />

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
                        </NavigationProvider>
                        </MessageProvider>
                    </NotificationProvider>
                </ToastProvider>
            </AuthProvider>
        </Router>
    )
}

export default App