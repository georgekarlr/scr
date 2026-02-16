import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { type EmailOtpType } from '@supabase/supabase-js'
import { Loader2, AlertCircle } from 'lucide-react'

const ConfirmAuth: React.FC = () => {
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      console.log('ConfirmAuth: Handling confirmation', location.search, location.hash)
      const searchParams = new URLSearchParams(location.search)
      const token_hash = searchParams.get('token_hash')
      const type = searchParams.get('type') as EmailOtpType | null
      const next = searchParams.get('next') || '/dashboard'

      if (token_hash && type) {
        console.log('ConfirmAuth: Verifying OTP')
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type,
        })

        if (!error) {
          console.log('ConfirmAuth: OTP verified, navigating to', next)
          navigate(next, { replace: true })
        } else {
          console.error('ConfirmAuth: OTP verification error', error)
          setError(error.message)
        }
      } else {
        // If we don't have token_hash/type, we might be returning from a standard oauth or email link
        // that Supabase handles automatically if we're in the same tab, 
        // but let's check if we have a session now
        console.log('ConfirmAuth: Checking session')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (session) {
          console.log('ConfirmAuth: Session found, navigating to', next)
          navigate(next, { replace: true })
        } else if (sessionError) {
          console.error('ConfirmAuth: Session error', sessionError)
          setError(sessionError.message)
        } else {
          // Check if there is an error in the URL (e.g. from OAuth)
          const errorDescription = searchParams.get('error_description')
          const errorCode = searchParams.get('error')
          if (errorCode || errorDescription) {
            console.error('ConfirmAuth: OAuth error in URL', errorCode, errorDescription)
            setError(errorDescription || errorCode || 'Authentication failed')
          } else {
            // Give it a small delay as session might still be loading in some edge cases
            console.log('ConfirmAuth: No session yet, retrying in 1s...')
            setTimeout(async () => {
              const { data: { session: retrySession } } = await supabase.auth.getSession()
              if (retrySession) {
                console.log('ConfirmAuth: Session found after retry, navigating to', next)
                navigate(next, { replace: true })
              } else {
                console.error('ConfirmAuth: No session found after retry')
                setError('Invalid confirmation link or session expired.')
              }
            }, 1000)
          }
        }
      }
    }

    handleEmailConfirmation()
  }, [location, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        {!error ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Verifying...</h2>
            <p className="mt-2 text-gray-600">Please wait while we confirm your request.</p>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 px-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ConfirmAuth
