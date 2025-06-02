/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/auth/ForgotPasswordForm.tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        toast.error(error.message || 'Failed to send reset email');
      } else {
        setSent(true);
        toast.success('Password reset email sent! Check your inbox.');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-white">
        <div className="max-w-[400px] w-full bg-gradient-to-b from-white to-amber-50 rounded-[40px] p-[25px_35px] border-[5px] border-white shadow-[0_30px_30px_-20px_rgba(133,189,215,0.88)] m-5">
          <div className="text-center">
            <div className="text-3xl font-black text-amber-600 mb-4">
              Check Your Email
            </div>
            <p className="text-gray-600 mb-6">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <div className="space-y-4">
              <button
                onClick={() => {
                  setSent(false);
                  setEmail('');
                }}
                className="w-full font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-white py-4 px-4 rounded-[20px] shadow-[0_20px_10px_-15px_rgba(133,189,215,0.88)] border-none transition-all hover:scale-[1.03] hover:shadow-[0_23px_10px_-20px_rgba(133,189,215,0.88)] active:scale-95 active:shadow-[0_15px_10px_-10px_rgba(133,189,215,0.88)]"
              >
                Send Another Email
              </button>
              <Link
                to="/login"
                className="block text-center text-xs text-amber-600 hover:text-amber-700 transition-colors"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-white">
      <div className="max-w-[400px] w-full bg-gradient-to-b from-white to-amber-50 rounded-[40px] p-[25px_35px] border-[5px] border-white shadow-[0_30px_30px_-20px_rgba(133,189,215,0.88)] m-5">
        <div className="text-center font-black text-3xl text-amber-600">
          Reset Password
        </div>

        <p className="text-center text-gray-600 text-sm mt-4 mb-6">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white border-none py-4 px-5 rounded-[20px] shadow-[0_10px_10px_-5px_#fff3e0] border-x-2 border-transparent focus:outline-none focus:border-x-2 focus:border-amber-400 transition-all"
            placeholder="Enter your email"
            disabled={loading}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-white py-4 px-4 rounded-[20px] shadow-[0_20px_10px_-15px_rgba(133,189,215,0.88)] border-none transition-all hover:scale-[1.03] hover:shadow-[0_23px_10px_-20px_rgba(133,189,215,0.88)] active:scale-95 active:shadow-[0_15px_10px_-10px_rgba(133,189,215,0.88)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send Reset Email'}
          </button>

          <div className="text-center">
            <Link
              to="/login"
              className="text-xs text-amber-600 hover:text-amber-700 transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};