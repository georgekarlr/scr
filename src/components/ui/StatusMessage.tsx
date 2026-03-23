import React from 'react'

interface StatusMessageProps {
  status: 'idle' | 'loading' | 'success' | 'error'
  message: React.ReactNode
}

const StatusMessage: React.FC<StatusMessageProps> = ({ status, message }) => {
  if (status === 'idle' || !message) return null

  const getStatusStyles = () => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'loading':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  return (
    <div className={`mt-4 p-4 border rounded-lg text-sm font-medium ${getStatusStyles()}`}>
      {status === 'loading' && (
        <span className="inline-block animate-spin mr-2">⏳</span>
      )}
      {message}
    </div>
  )
}

export default StatusMessage
