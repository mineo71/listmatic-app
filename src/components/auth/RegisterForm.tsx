'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

interface RegisterFormData {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
}

export const RegisterForm = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  })
  const [errors, setErrors] = useState<Partial<RegisterFormData>>({})
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const { signUp, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterFormData> = {}

    if (!formData.email) {
      newErrors.email = t('register.errors.emailRequired')
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('register.errors.emailInvalid')
    }

    if (!formData.password) {
      newErrors.password = t('register.errors.passwordRequired')
    } else if (formData.password.length < 8) {
      newErrors.password = t('register.errors.passwordLength')
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('register.errors.confirmPasswordRequired')
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('register.errors.passwordsDoNotMatch')
    }

    if (!formData.firstName) {
      newErrors.firstName = t('register.errors.firstNameRequired')
    }

    if (!formData.lastName) {
      newErrors.lastName = t('register.errors.lastNameRequired')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name as keyof RegisterFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const { error } = await signUp(
        formData.email, 
        formData.password, 
        {
          firstName: formData.firstName,
          lastName: formData.lastName
        }
      )

      if (error) {
        if (error.message.includes('User already registered')) {
          toast.error('An account with this email already exists')
        } else if (error.message.includes('Password should be at least')) {
          toast.error('Password should be at least 6 characters long')
        } else {
          toast.error(error.message || 'An error occurred during registration')
        }
      } else {
        toast.success('Registration successful! Please check your email to confirm your account.')
        navigate('/login', { state: { registered: true } })
      }
    } catch (error) {
      console.error('Registration error:', error)
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
            {t('register.title')}
          </div>

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
              <div>
                <input
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full bg-white border-none py-4 px-5 rounded-[20px] shadow-[0_10px_10px_-5px_#fff3e0] border-x-2 border-transparent focus:outline-none focus:border-x-2 focus:border-amber-400 transition-all"
                    placeholder={t('register.firstName')}
                    disabled={loading || googleLoading}
                />
                {errors.firstName && (
                    <p className="text-amber-600 text-xs mt-2 ml-2">{errors.firstName}</p>
                )}
              </div>

              <div>
                <input
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full bg-white border-none py-4 px-5 rounded-[20px] shadow-[0_10px_10px_-5px_#fff3e0] border-x-2 border-transparent focus:outline-none focus:border-x-2 focus:border-amber-400 transition-all"
                    placeholder={t('register.lastName')}
                    disabled={loading || googleLoading}
                />
                {errors.lastName && (
                    <p className="text-amber-600 text-xs mt-2 ml-2">{errors.lastName}</p>
                )}
              </div>

              <div>
                <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-white border-none py-4 px-5 rounded-[20px] shadow-[0_10px_10px_-5px_#fff3e0] border-x-2 border-transparent focus:outline-none focus:border-x-2 focus:border-amber-400 transition-all"
                    placeholder={t('register.email')}
                    disabled={loading || googleLoading}
                />
                {errors.email && (
                    <p className="text-amber-600 text-xs mt-2 ml-2">{errors.email}</p>
                )}
              </div>

              <div>
                <input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-white border-none py-4 px-5 rounded-[20px] shadow-[0_10px_10px_-5px_#fff3e0] border-x-2 border-transparent focus:outline-none focus:border-x-2 focus:border-amber-400 transition-all"
                    placeholder={t('register.password')}
                    disabled={loading || googleLoading}
                />
                {errors.password && (
                    <p className="text-amber-600 text-xs mt-2 ml-2">{errors.password}</p>
                )}
              </div>

              <div>
                <input
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full bg-white border-none py-4 px-5 rounded-[20px] shadow-[0_10px_10px_-5px_#fff3e0] border-x-2 border-transparent focus:outline-none focus:border-x-2 focus:border-amber-400 transition-all"
                    placeholder={t('register.confirmPassword')}
                    disabled={loading || googleLoading}
                />
                {errors.confirmPassword && (
                    <p className="text-amber-600 text-xs mt-2 ml-2">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-white py-4 px-4 rounded-[20px] shadow-[0_20px_10px_-15px_rgba(133,189,215,0.88)] border-none transition-all hover:scale-[1.03] hover:shadow-[0_23px_10px_-20px_rgba(133,189,215,0.88)] active:scale-95 active:shadow-[0_15px_10px_-10px_rgba(133,189,215,0.88)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : t('register.submit')}
            </button>

            <div className="text-center">
              <Link
                  to="/login"
                  className="text-xs text-amber-600 hover:text-amber-700 transition-colors"
              >
                {t('register.loginLink')}
              </Link>
            </div>
          </form>
        </div>
      </div>
  )
}