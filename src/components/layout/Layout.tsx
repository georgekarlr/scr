import React, { useState, useEffect, useMemo } from 'react'
import { useLocation, Link } from 'react-router-dom'
import Sidebar from './Sidebar'
import RightSidebar from './RightSidebar'
import BottomNav from './BottomNav'
import CreateSetModal from '../dashboard/CreateSetModal'
import { Bell, Trophy, MessageSquare, Settings } from 'lucide-react'
import { useNotifications } from '../../contexts/NotificationContext'
import { useAuth } from '../../contexts/AuthContext'
import { messageService } from '../../services/messageService'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  console.log('Layout rendering')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const { unreadCount } = useNotifications()
  const { user } = useAuth()
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
  const location = useLocation()
  const isMessagesPage = location.pathname === '/messages'
  const isChatPage = location.pathname.startsWith('/messages/')
  const hideBottomNav = isChatPage

  useEffect(() => {
    const fetchUnreadMessages = async () => {
      try {
        const count = await messageService.getUnreadMessagesCount();
        setUnreadMessagesCount(count);
      } catch (error) {
        console.error('Error fetching unread messages count:', error);
      }
    };

    if (user) {
      fetchUnreadMessages();
      const interval = setInterval(fetchUnreadMessages, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const pageTitle = useMemo(() => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Home';
    if (path === '/explore') return 'Explore';
    if (path === '/library') return 'Library';
    if (path === '/messages') return 'Messages';
    if (path.startsWith('/messages/')) return 'Chat';
    if (path === '/leaderboard') return 'Leaderboard';
    if (path === '/notifications') return 'Notifications';
    if (path === '/profile') return 'Profile';
    if (path === '/settings') return 'Settings';
    if (path.startsWith('/u/')) return 'User Profile';
    return 'Ceintelly';
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto flex items-start">
        {/* Left Sidebar */}
        <Sidebar isOpen={false} onClose={() => {}} />
        
        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col min-h-screen border-r border-gray-100 ${hideBottomNav ? 'h-screen' : 'pb-28 lg:pb-0'} min-w-0`}>
          {/* Mobile Top Bar */}
          {!isChatPage && (
            <div className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 h-16 flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Ceintelly
                </h2>
                <div className="h-4 w-[1px] bg-gray-200 mx-1" />
                <span className="text-sm font-bold text-gray-900">{pageTitle}</span>
              </div>
              <div className="flex items-center space-x-1">
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
                  to="/leaderboard"
                  className={`p-2 rounded-full transition-colors ${
                    location.pathname === '/leaderboard' 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                  aria-label="Leaderboard"
                >
                  <Trophy className="h-6 w-6" />
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
          
          {/* Page content */}
          <main className="flex-1 relative focus:outline-none">
            {children}
          </main>
        </div>

        {/* Right Sidebar - Desktop Only */}
        <RightSidebar />
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