import React, { useState, useMemo } from 'react'
import { useLocation, Link } from 'react-router-dom'
import Sidebar from './Sidebar'
import RightSidebar from './RightSidebar'
import BottomNav from './BottomNav'
import CreateSetModal from '../dashboard/CreateSetModal'
import { Bell, MessageSquare, Settings, Gamepad2, Users, ArrowLeft } from 'lucide-react'
import { useNotifications } from '../../contexts/NotificationContext'
import { useMessages } from '../../contexts/MessageContext'
import { useNavigation } from '../../contexts/NavigationContext'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  console.log('Layout rendering')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const { unreadCount } = useNotifications()
  const { unreadMessagesCount } = useMessages()
  const { isBottomNavVisible, isTopBarVisible } = useNavigation()
  const location = useLocation()
  const publicPaths = ['/about', '/presentation', '/how-to', '/tos', '/privacy', '/cookies']
  const isPublicPage = publicPaths.includes(location.pathname)
  const isChatPage = location.pathname.startsWith('/messages/')
  const isGamesPage = location.pathname === '/games'
  const hideBottomNav = isChatPage || (isGamesPage && !isBottomNavVisible) || isPublicPage
  const hideTopBar = isChatPage || (isGamesPage && !isTopBarVisible) || isPublicPage
  const hideSidebar = isPublicPage
  const hideRightSidebar = isPublicPage
  useMemo(() => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Home';
    if (path === '/explore') return 'Explore';
    if (path === '/library') return 'Library';
    if (path === '/groups') return 'Groups';
    if (path === '/games') return 'Games';
    if (path === '/messages') return 'Messages';
    if (path.startsWith('/messages/')) return 'Chat';
    if (path === '/notifications') return 'Notifications';
    if (path === '/profile') return 'Profile';
    if (path === '/settings') return 'Settings';
    if (path === '/presentation') return 'Presentation';
    if (path === '/how-to') return 'How-To Guide';
    if (path === '/about') return 'About';
    if (path === '/tos') return 'Terms of Service';
    if (path === '/privacy') return 'Privacy Policy';
    if (path === '/cookies') return 'Cookie Policy';
    if (path.startsWith('/u/')) return 'User Profile';
    return 'Ceintelly';
  }, [location.pathname]);
  return (
    <div className="min-h-screen bg-white">
      <div className={`mx-auto flex items-start ${isPublicPage ? 'max-w-none' : 'max-w-7xl'}`}>
        {/* Left Sidebar */}
        {!hideSidebar && <Sidebar isOpen={false} onClose={() => {}} />}
        
        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col min-h-screen ${!isPublicPage ? 'border-r border-gray-100' : ''} ${hideBottomNav ? 'h-screen' : 'pb-28 lg:pb-0'} min-w-0`}>
          {/* Mobile Top Bar */}
          {!hideTopBar && (
            <div className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 h-16 flex items-center justify-between px-4">
              <Link to="/dashboard" className="flex items-center gap-2">
                <img src="/icon.svg" alt="Ceintelly" className="h-8 w-8" />
                <h2 className="text-xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Ceintelly
                </h2>
              </Link>
              <div className="flex items-center space-x-1">
                <Link
                  to="/groups"
                  className={`p-2 rounded-full transition-colors ${
                    location.pathname === '/groups' 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                  aria-label="Groups"
                >
                  <Users className="h-6 w-6" />
                </Link>
                <Link
                  to="/games"
                  className={`p-2 rounded-full transition-colors ${
                    location.pathname === '/games' 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                  aria-label="Games"
                >
                  <Gamepad2 className="h-6 w-6" />
                </Link>
                <Link
                  to="/messages"
                  className={`relative p-2 rounded-full transition-colors ${
                    location.pathname === '/messages' 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                  aria-label="Messages"
                >
                  <MessageSquare className="h-6 w-6" />
                  {unreadMessagesCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold bg-blue-500 text-white rounded-full ring-2 ring-white">
                      {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                    </span>
                  )}
                </Link>
                <Link
                  to="/notifications"
                  className={`relative p-2 rounded-full transition-colors ${
                    location.pathname === '/notifications' 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                  aria-label="Notifications"
                >
                  <Bell className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold bg-red-500 text-white rounded-full ring-2 ring-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  to="/settings"
                  className={`p-2 rounded-full transition-colors ${
                    location.pathname === '/settings' 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                  aria-label="Settings"
                >
                  <Settings className="h-6 w-6" />
                </Link>
              </div>
            </div>
          )}

          {/* Public Page Navigation */}
          {isPublicPage && (
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 h-16 flex items-center justify-between px-4 lg:px-8">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 group transition-all"
              >
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                  <ArrowLeft className="h-5 w-5" />
                </div>
                <span className="font-medium text-gray-600 group-hover:text-blue-600 transition-colors">
                  Back to Dashboard
                </span>
              </Link>
              <Link to="/dashboard" className="flex items-center gap-2">
                <img src="/icon.svg" alt="Ceintelly" className="h-8 w-8" />
                <h2 className="text-xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Ceintelly
                </h2>
              </Link>
            </div>
          )}
          
          {/* Page content */}
          <main className="flex-1 relative focus:outline-none">
            {children}
          </main>
        </div>

        {/* Right Sidebar - Desktop Only */}
        {!hideRightSidebar && <RightSidebar />}
      </div>

      {/* Mobile Bottom Navigation */}
      {!hideBottomNav && <BottomNav onCreateClick={() => setIsCreateModalOpen(true)} />}

      {/* Create Set Modal */}
      <CreateSetModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  )
}

export default Layout