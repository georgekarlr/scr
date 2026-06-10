import React from 'react'
import { X, AlertCircle } from 'lucide-react'

interface ErrorModalProps {
  isOpen: boolean
  title?: string
  message: string
  onClose: () => void
}

const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  title = 'Error',
  message,
  onClose
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-red-50/50">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-red-600" size={20} />
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded-lg transition-colors text-gray-500"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{message}</p>
        </div>
        
        <div className="flex justify-end p-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default ErrorModal
