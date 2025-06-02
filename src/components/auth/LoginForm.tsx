'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

export const LoginForm = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const { signIn, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()

  // Get the redirect path from location state, or default to '/'
  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }

    setLoading(true)

    try {
      const { error } = await signIn(email, password)
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password')
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Please check your email and confirm your account')
        } else {
          toast.error(error.message || 'An error occurred during login')
        }
      } else {
        toast.success('Successfully logged in!')
        navigate(from, { replace: true })
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    
    try {
      const { error } = await signInWithGoogle()
      
      if (error) {
        console.error('Google sign in error:', error)
        toast.error('Failed to sign in with Google')
      }
      // Note: We don't navigate here because OAuth redirects automatically
    } catch (error) {
      console.error('Google sign in error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-white">
        <div className="max-w-[400px] w-full bg-gradient-to-b from-white to-amber-50 rounded-[40px] p-[25px_35px] border-[5px] border-white shadow-[0_30px_30px_-20px_rgba(133,189,215,0.88)] m-5">
          <div className="text-center font-black text-3xl text-amber-600">
            {t('login.title')}
          </div>

          {/* Show success message if redirected from registration */}
          {location.state?.registered && (
            <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md text-sm text-center">
              Registration successful! Please check your email to confirm your account.
            </div>
          )}

          {/* Google Sign In Button */}
          <div className="mt-6">
            <button
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-gray-300 rounded-[20px] text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_5px_5px_-3px_rgba(0,0,0,0.1)]"
            >
              {googleLoading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-amber-600 rounded-full animate-spin" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              {googleLoading ? 'Signing in...' : 'Continue with Google'}
            </button>
          </div>

          {/* Divider */}
          <div className="mt-6 mb-4 flex items-center">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-sm text-gray-500">or</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border-none py-4 px-5 rounded-[20px] shadow-[0_10px_10px_-5px_#fff3e0] border-x-2 border-transparent focus:outline-none focus:border-x-2 focus:border-amber-400 transition-all"
                  placeholder={t('login.email')}
                  disabled={loading || googleLoading}
              />
              <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border-none py-4 px-5 rounded-[20px] shadow-[0_10px_10px_-5px_#fff3e0] border-x-2 border-transparent focus:outline-none focus:border-x-2 focus:border-amber-400 transition-all"
                  placeholder={t('login.password')}
                  disabled={loading || googleLoading}
              />
            </div>

            <div className="text-right">
              <Link
                  to="/forgot-password"
                  className="text-xs text-amber-600 hover:text-amber-700 transition-colors"
              >
                {t('login.forgotPassword')}
              </Link>
            </div>

            <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-white py-4 px-4 rounded-[20px] shadow-[0_20px_10px_-15px_rgba(133,189,215,0.88)] border-none transition-all hover:scale-[1.03] hover:shadow-[0_23px_10px_-20px_rgba(133,189,215,0.88)] active:scale-95 active:shadow-[0_15px_10px_-10px_rgba(133,189,215,0.88)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : t('login.submit')}
            </button>
          </form>

          <div className="text-center mt-6">
            <Link
                to="/register"
                className="text-xs text-amber-600 hover:text-amber-700 transition-colors"
            >
              {t('login.registerLink')}
            </Link>
          </div>
        </div>
      </div>
  )
}