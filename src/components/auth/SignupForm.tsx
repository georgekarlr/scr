import React, { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import StatusMessage from '../ui/StatusMessage'

declare global {
  interface Window {
    handleSignInWithGoogle: (response: any) => Promise<void>;
    google: any;
  }
}

const SignupForm: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [nonceData, setNonceData] = useState<{ raw: string, hashed: string } | null>(null)
  const { signUp, signInWithGoogleIdToken, user } = useAuth()

  useEffect(() => {
    const generateNonce = async () => {
      const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
      const encoder = new TextEncoder()
      const encodedNonce = encoder.encode(nonce)
      const hashBuffer = await crypto.subtle.digest('SHA-256', encodedNonce)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashed = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

      setNonceData({ raw: nonce, hashed })
    }

    generateNonce()
  }, [])

  useEffect(() => {
    if (!nonceData) return

    const handleCredentialResponse = async (response: any) => {
      setStatus('loading')
      setMessage('')
      const { error } = await signInWithGoogleIdToken(response.credential, nonceData.raw)
      if (error) {
        setMessage(error.message)
        setStatus('error')
      }
    }

    const initGoogleSignIn = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          nonce: nonceData.hashed,
          auto_select: true,
          itp_support: true,
          use_fedcm_for_prompt: true,
        })

        const buttonElement = document.getElementById('google-signin-button')
        if (buttonElement) {
          window.google.accounts.id.renderButton(buttonElement, {
            type: 'standard',
            shape: 'pill',
            theme: 'outline',
            text: 'signin_with',
            size: 'large',
            logo_alignment: 'left',
            width: 320,
          })
        }

        // Also prompt One Tap
        window.google.accounts.id.prompt()
      } else {
        // Retry after a short delay if script hasn't loaded yet
        setTimeout(initGoogleSignIn, 100)
      }
    }

    initGoogleSignIn()
  }, [nonceData, signInWithGoogleIdToken])

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setMessage('')

    if (password !== confirmPassword) {
      setMessage('Passwords do not match')
      setStatus('error')
      return
    }

    const { error } = await signUp(email, password)

    if (error) {
      setMessage(error.message)
      setStatus('error')
    } else {
      setMessage('Account created successfully! Please check your email to verify your account.')
      setStatus('success')
    }
  }

  return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-8 sm:py-12">
        <div className="max-w-md w-full">
          <div className="text-center mb-6 sm:mb-10">
            <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2 sm:mb-4">
              Ceintelly
            </h1>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Join the community</h2>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 px-4">Start your social learning journey today.</p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl sm:border sm:border-gray-100 sm:shadow-xl sm:shadow-blue-50/50">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-5 sm:mb-6">Create your account</h3>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <StatusMessage status={status} message={message} />

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

              <div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all outline-none text-gray-900"
                      placeholder="Password"
                  />
                  <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all outline-none text-gray-900"
                      placeholder="Confirm Password"
                  />
                  <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-full shadow-lg shadow-blue-200 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                {status === 'loading' ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                    'Create account'
                )}
              </button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 flex flex-col items-center">
                <div id="google-signin-button"></div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link
                    to="/login"
                    className="font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Log in
                </Link>
              </p>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-gray-400 px-10">
            By signing up, you agree to the Terms of Service and Privacy Policy, including Cookie Use.
          </p>
        </div>
      </div>
  )
}

export default SignupForm