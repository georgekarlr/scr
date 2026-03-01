import React, { useState } from 'react'

const GroupsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'my-groups' | 'invitations' | 'requests' | 'explore'>('my-groups')

  const tabs = [
    { id: 'my-groups', label: 'My Groups' },
    { id: 'invitations', label: 'Invitations' },
    { id: 'requests', label: 'Requests' },
    { id: 'explore', label: 'Explore' },
  ] as const

  const renderContent = () => {
    switch (activeTab) {
      case 'my-groups':
        return (
          <div className="mt-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">My Groups</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mb-3">MG{i}</div>
                  <h3 className="font-bold text-gray-900">My Study Group #{i}</h3>
                  <p className="text-sm text-gray-600 mt-1">This is one of the groups you are a member of.</p>
                  <button className="mt-3 inline-flex items-center px-3 py-1.5 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700">Open</button>
                </div>
              ))}
            </div>
          </div>
        )
      case 'invitations':
        return (
          <div className="mt-6 text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <p className="text-gray-500 font-medium">No pending invitations</p>
          </div>
        )
      case 'requests':
        return (
          <div className="mt-6 text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <p className="text-gray-500 font-medium">No active join requests</p>
          </div>
        )
      case 'explore':
        return (
          <div className="mt-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Discover Groups</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mb-3">G{i}</div>
                  <h3 className="font-bold text-gray-900">Study Group #{i}</h3>
                  <p className="text-sm text-gray-600 mt-1">A sample group card. Replace with real groups later.</p>
                  <button className="mt-3 inline-flex items-center px-3 py-1.5 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700">View</button>
                </div>
              ))}
            </div>
          </div>
        )
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Groups</h1>
        
        {/* Navigation Tabs */}
        <div className="mt-6 border-b border-gray-100 overflow-x-auto">
          <nav className="flex space-x-8 min-w-max" aria-label="Groups navigation">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-bold text-sm transition-colors whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {renderContent()}
      </div>
    </div>
  )
}

export default GroupsPage
