// src/components/settings/Profile.tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera } from 'lucide-react';

export const Profile = () => {
  const { t } = useTranslation();
  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    avatar: '/api/placeholder/100/100'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle profile update
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('profile.title')}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center space-x-6">
          <div className="relative">
            <img
              src={profile.avatar}
              alt={profile.name}
              className="h-24 w-24 rounded-full object-cover"
            />
            <button
              type="button"
              className="absolute bottom-0 right-0 rounded-full bg-white p-2 shadow-lg border border-gray-200 hover:bg-gray-50"
            >
              <Camera size={16} className="text-gray-600" />
            </button>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">{profile.name}</h3>
            <p className="text-sm text-gray-500">{profile.email}</p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              {t('profile.name')}
            </label>
            <input
              type="text"
              id="name"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              {t('profile.email')}
            </label>
            <input
              type="email"
              id="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            >
              {t('profile.save')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};