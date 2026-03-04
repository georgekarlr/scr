import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Mail, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react'

const ForgotPasswordForm: React.FC = () => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const { resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    const { error } = await resetPassword(email)
    
    if (error) {
      setError(error.message)
    } else {
      setMessage('Password reset link has been sent to your email.')
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-6 sm:mb-10">
          <div className="flex flex-col items-center justify-center gap-4 mb-4">
            <img src="/icon.svg" alt="Ceintelly" className="h-16 w-16 sm:h-20 sm:w-20" />
            <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Ceintelly
            </h1>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Reset your password</h2>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 px-4">Enter your email and we'll send you a link to reset your password.</p>
        </div>
        
        <div className="bg-white p-6 sm:p-8 rounded-2xl sm:border sm:border-gray-100 sm:shadow-xl sm:shadow-blue-50/50">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center space-x-3 animate-shake">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {message && (
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center space-x-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                <p className="text-sm text-green-700">{message}</p>
              </div>
            )}

            {!message && (
              <>
                <div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all outline-none text-gray-900"
                      placeholder="Email address"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-full shadow-lg shadow-blue-200 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    'Send reset link'
                  )}
                </button>
              </>
            )}
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <Link
              to="/login"
              className="inline-flex items-center font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordForm
