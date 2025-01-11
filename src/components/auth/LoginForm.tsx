'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export const LoginForm = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    login('dummy-token')
    navigate('/')
  }

  return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-white">
        <div className="max-w-[400px] w-full bg-gradient-to-b from-white to-amber-50 rounded-[40px] p-[25px_35px] border-[5px] border-white shadow-[0_30px_30px_-20px_rgba(133,189,215,0.88)] m-5">
          <div className="text-center font-black text-3xl text-amber-600">
            {t('auth.login.title')}
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="space-y-4">
              <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border-none py-4 px-5 rounded-[20px] shadow-[0_10px_10px_-5px_#fff3e0] border-x-2 border-transparent focus:outline-none focus:border-x-2 focus:border-amber-400 transition-all"
                  placeholder={t('auth.login.email')}
              />
              <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border-none py-4 px-5 rounded-[20px] shadow-[0_10px_10px_-5px_#fff3e0] border-x-2 border-transparent focus:outline-none focus:border-x-2 focus:border-amber-400 transition-all"
                  placeholder={t('auth.login.password')}
              />
            </div>

            <div className="text-right">
              <Link
                  to="/forgot-password"
                  className="text-xs text-amber-600 hover:text-amber-700 transition-colors"
              >
                {t('auth.login.forgotPassword')}
              </Link>
            </div>

            <button
                type="submit"
                className="w-full font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-white py-4 px-4 rounded-[20px] shadow-[0_20px_10px_-15px_rgba(133,189,215,0.88)] border-none transition-all hover:scale-[1.03] hover:shadow-[0_23px_10px_-20px_rgba(133,189,215,0.88)] active:scale-95 active:shadow-[0_15px_10px_-10px_rgba(133,189,215,0.88)]"
            >
              {t('auth.login.submit')}
            </button>
          </form>

          <div className="text-center mt-6">
            <Link
                to="/register"
                className="text-xs text-amber-600 hover:text-amber-700 transition-colors"
            >
              {t('auth.login.registerLink')}
            </Link>
          </div>
        </div>
      </div>
  )
}

