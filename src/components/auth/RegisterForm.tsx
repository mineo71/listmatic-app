// src/components/auth/RegisterForm.tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

export const RegisterForm = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [errors, setErrors] = useState<Partial<RegisterFormData>>({});
  const navigate = useNavigate();
  const { t } = useTranslation();

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterFormData> = {};

    if (!formData.email) {
      newErrors.email = t('register.errors.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('register.errors.emailInvalid');
    }

    if (!formData.password) {
      newErrors.password = t('register.errors.passwordRequired');
    } else if (formData.password.length < 8) {
      newErrors.password = t('register.errors.passwordLength');
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('register.errors.confirmPasswordRequired');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('register.errors.passwordsDoNotMatch');
    }

    if (!formData.firstName) {
      newErrors.firstName = t('register.errors.firstNameRequired');
    }

    if (!formData.lastName) {
      newErrors.lastName = t('register.errors.lastNameRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof RegisterFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Add your registration API call here
      console.log('Registration data:', formData);
      
      // On successful registration, navigate to login
      navigate('/login', { state: { registered: true } });
    } catch (error) {
      console.error('Registration error:', error);
      // Handle registration error
    }
  };

  const inputClasses = "appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm";
  const errorClasses = "text-red-500 text-xs mt-1";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('register.title')}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <input
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                className={inputClasses}
                placeholder={t('register.firstName')}
              />
              {errors.firstName && <p className={errorClasses}>{errors.firstName}</p>}
            </div>

            <div>
              <input
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                className={inputClasses}
                placeholder={t('register.lastName')}
              />
              {errors.lastName && <p className={errorClasses}>{errors.lastName}</p>}
            </div>

            <div>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={inputClasses}
                placeholder={t('register.email')}
              />
              {errors.email && <p className={errorClasses}>{errors.email}</p>}
            </div>

            <div>
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className={inputClasses}
                placeholder={t('register.password')}
              />
              {errors.password && <p className={errorClasses}>{errors.password}</p>}
            </div>

            <div>
              <input
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={inputClasses}
                placeholder={t('register.confirmPassword')}
              />
              {errors.confirmPassword && <p className={errorClasses}>{errors.confirmPassword}</p>}
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              {t('register.submit')}
            </button>
          </div>

          <div className="text-center">
            <Link 
              to="/login" 
              className="text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              {t('register.loginLink')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};