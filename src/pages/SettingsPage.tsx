import React, { useState } from 'react'
import { 
  LogOut, 
  HelpCircle, 
  FileText, 
  ChevronRight, 
  Shield, 
  MessageCircle,
  ExternalLink,
  Info
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import LogoutConfirmationModal from '../components/ui/LogoutConfirmationModal'
import { Link } from 'react-router-dom'

const SettingsPage: React.FC = () => {
  const { signOut, user } = useAuth()
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
      setIsLoggingOut(false)
    }
  }

  const supportSections = [
    {
      title: 'Support',
      items: [
        { name: 'About Us', icon: Info, description: 'Learn about our mission and story', href: '/about' },
        { name: 'Help Center', icon: HelpCircle, description: 'Get help with using Ceintelly', href: '#' },
        { name: 'FAQ', icon: MessageCircle, description: 'Frequently asked questions', href: '#' },
        { name: 'Terms of Service', icon: FileText, description: 'Read our terms and conditions', href: '/tos' },
        { name: 'Privacy Policy', icon: Shield, description: 'How we handle your data', href: '/privacy' },
      ]
    }
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-0">
      {/* Page Header */}
      <div className="px-1">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-xs sm:text-sm text-gray-600">Manage your account and app preferences</p>
      </div>

      {/* Account Section */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden sm:shadow-sm">
        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Account</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-sm">
                {user?.email?.[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{user?.email}</p>
                <p className="text-xs text-gray-500">Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'recently'}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-50">
            <button
              onClick={() => setIsLogoutModalOpen(true)}
              className="flex items-center justify-between w-full px-4 py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors font-bold group"
            >
              <div className="flex items-center">
                <LogOut className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" />
                <span>Sign Out</span>
              </div>
              <ChevronRight className="h-5 w-5 opacity-50" />
            </button>
          </div>
        </div>
      </div>

      <LogoutConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
        loading={isLoggingOut}
      />

      {/* Support Sections */}
      {supportSections.map((section, idx) => (
        <div key={idx} className="bg-white border border-gray-100 rounded-2xl overflow-hidden sm:shadow-sm">
          <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{section.title}</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {section.items.map((item, itemIdx) => {
              const Icon = item.icon
              return (
                <Link
                  key={itemIdx}
                  to={item.href}
                  className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors group text-left"
                >
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center mr-4 group-hover:bg-blue-100 transition-colors">
                      <Icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                </Link>
              )
            })}
          </div>
        </div>
      ))}

      {/* Version Info */}
      <div className="text-center py-4">
        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">
          Ceintelly v1.0.0
        </p>
      </div>
    </div>
  )
}

export default SettingsPage
