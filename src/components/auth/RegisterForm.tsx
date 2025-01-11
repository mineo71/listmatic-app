'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, Link } from 'react-router-dom'

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
  const navigate = useNavigate()
  const { t } = useTranslation()

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterFormData> = {}

    if (!formData.email) {
      newErrors.email = t('auth.register.errors.emailRequired')
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('auth.register.errors.emailInvalid')
    }

    if (!formData.password) {
      newErrors.password = t('auth.register.errors.passwordRequired')
    } else if (formData.password.length < 8) {
      newErrors.password = t('auth.register.errors.passwordLength')
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.register.errors.confirmPasswordRequired')
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.register.errors.passwordsDoNotMatch')
    }

    if (!formData.firstName) {
      newErrors.firstName = t('auth.register.errors.firstNameRequired')
    }

    if (!formData.lastName) {
      newErrors.lastName = t('auth.register.errors.lastNameRequired')
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

    try {
      console.log('Registration data:', formData)
      navigate('/login', { state: { registered: true } })
    } catch (error) {
      console.error('Registration error:', error)
    }
  }

  return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-white">
        <div className="max-w-[400px] w-full bg-gradient-to-b from-white to-amber-50 rounded-[40px] p-[25px_35px] border-[5px] border-white shadow-[0_30px_30px_-20px_rgba(133,189,215,0.88)] m-5">
          <div className="text-center font-black text-3xl text-amber-600">
            {t('auth.register.title')}
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="space-y-4">
              <div>
                <input
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full bg-white border-none py-4 px-5 rounded-[20px] shadow-[0_10px_10px_-5px_#fff3e0] border-x-2 border-transparent focus:outline-none focus:border-x-2 focus:border-amber-400 transition-all"
                    placeholder={t('auth.register.firstName')}
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
                    placeholder={t('auth.register.lastName')}
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
                    placeholder={t('auth.register.email')}
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
                    placeholder={t('auth.register.password')}
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
                    placeholder={t('auth.register.confirmPassword')}
                />
                {errors.confirmPassword && (
                    <p className="text-amber-600 text-xs mt-2 ml-2">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <button
                type="submit"
                className="w-full font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-white py-4 px-4 rounded-[20px] shadow-[0_20px_10px_-15px_rgba(133,189,215,0.88)] border-none transition-all hover:scale-[1.03] hover:shadow-[0_23px_10px_-20px_rgba(133,189,215,0.88)] active:scale-95 active:shadow-[0_15px_10px_-10px_rgba(133,189,215,0.88)]"
            >
              {t('auth.register.submit')}
            </button>

            <div className="text-center">
              <Link
                  to="/login"
                  className="text-xs text-amber-600 hover:text-amber-700 transition-colors"
              >
                {t('auth.register.loginLink')}
              </Link>
            </div>
          </form>
        </div>
      </div>
  )
}

