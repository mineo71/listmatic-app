// src/components/settings/Profile.tsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import { Camera, LogOut, Menu } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

type ContextType = {
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
};

export const Profile = () => {
  const { t } = useTranslation();
  const { isSidebarOpen, onToggleSidebar } = useOutletContext<ContextType>();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    firstName: '',
    lastName: '',
    avatar: '/LogoBeeTask.ico'
  });

  // Check if user signed in with OAuth
  const isOAuthUser = user?.app_metadata?.provider !== 'email';
  const oauthProvider = user?.app_metadata?.provider;

  // Load user data when component mounts
  useEffect(() => {
    if (user) {
      // For OAuth users, Google provides name differently
      let firstName = '';
      let lastName = '';
      let fullName = '';

      if (isOAuthUser && oauthProvider === 'google') {
        // Google OAuth provides full_name and sometimes given_name/family_name
        firstName = user.user_metadata?.given_name || user.user_metadata?.first_name || '';
        lastName = user.user_metadata?.family_name || user.user_metadata?.last_name || '';
        fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
        
        // If we don't have first/last name, try to split full name
        if (!firstName && !lastName && fullName) {
          const nameParts = fullName.split(' ');
          firstName = nameParts[0] || '';
          lastName = nameParts.slice(1).join(' ') || '';
        }
      } else {
        // Email signup users
        firstName = user.user_metadata?.first_name || '';
        lastName = user.user_metadata?.last_name || '';
        fullName = firstName && lastName ? `${firstName} ${lastName}` : '';
      }
      
      setProfile({
        name: fullName || user.email || '',
        email: user.email || '',
        firstName,
        lastName,
        avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture || '/LogoBeeTask.ico'
      });
    }
  }, [user, isOAuthUser, oauthProvider]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // For OAuth users, we typically can't update their profile data
      // as it's managed by the OAuth provider
      if (isOAuthUser) {
        toast(t('profile.oauthUpdateWarning', { provider: oauthProvider }), {
          icon: 'ℹ️',
          style: {
            background: '#3b82f6',
            color: '#fff'
          }
        });
      }
      
      // You can implement profile update logic here if needed
      // For now, just show a success message
      toast.success(t('messages.profileUpdated'));
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(t('profile.updateError'));
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error(t('profile.logoutError'));
    }
  };

  const getProviderDisplayName = (provider: string) => {
    return provider ? provider.charAt(0).toUpperCase() + provider.slice(1) : t('profile.unknown');
  };

  return (
    <div className="px-6 py-4 max-w-2xl mx-auto relative">
      {/* Menu button - show when sidebar is closed */}
      {!isSidebarOpen && onToggleSidebar && (
        <button
          onClick={onToggleSidebar}
          className="fixed top-4 left-4 z-50 p-3 bg-white rounded-lg shadow-lg border border-gray-200 transition-all duration-200 hover:bg-gray-50"
          aria-label={t('actions.openSidebar')}
        >
          <Menu size={20} className="text-gray-700" />
        </button>
      )}
      
      <h1 className="text-2xl font-bold text-gray-900 ml-12 mb-6">{t('profile.title')}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center space-x-6">
          <div className="relative">
            <img
              src={profile.avatar}
              alt={profile.name}
              className="h-24 w-24 rounded-full object-cover"
            />
            {!isOAuthUser && (
              <button
                type="button"
                className="absolute bottom-0 right-0 rounded-full bg-white p-2 shadow-lg border border-gray-200 hover:bg-gray-50"
              >
                <Camera size={16} className="text-gray-600" />
              </button>
            )}
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">{profile.name}</h3>
            <p className="text-sm text-gray-500">{profile.email}</p>
            {user?.email_confirmed_at && (
              <p className="text-xs text-green-600">✓ {t('profile.emailVerified')}</p>
            )}
            {isOAuthUser && (
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-blue-600">
                  {t('profile.signedInWith', { provider: getProviderDisplayName(oauthProvider || '') })}
                </span>
                {oauthProvider === 'google' && (
                  <svg width="12" height="12" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Form Fields */}
        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          {isOAuthUser && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>{t('profile.note')}:</strong> {t('profile.oauthNote', { 
                  provider: getProviderDisplayName(oauthProvider || '')
                })}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                {t('register.firstName')}
              </label>
              <input
                type="text"
                id="firstName"
                value={profile.firstName}
                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                disabled={isOAuthUser}
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                {t('register.lastName')}
              </label>
              <input
                type="text"
                id="lastName"
                value={profile.lastName}
                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                disabled={isOAuthUser}
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              {t('profile.email')}
            </label>
            <input
              type="email"
              id="email"
              value={profile.email}
              readOnly
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-500 sm:text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">{t('profile.emailNote')}</p>
          </div>

          {!isOAuthUser && (
            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
              >
                {t('profile.save')}
              </button>
            </div>
          )}
        </div>

        {/* User Metadata Info */}
        {user && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">{t('profile.accountInfo')}</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p>{t('profile.userId')}: {user.id}</p>
              <p>{t('profile.provider')}: {oauthProvider || 'email'}</p>
              <p>{t('profile.created')}: {new Date(user.created_at).toLocaleDateString()}</p>
              <p>{t('profile.lastSignIn')}: {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : t('profile.never')}</p>
              {user.email_confirmed_at && (
                <p>{t('profile.emailConfirmed')}: {new Date(user.email_confirmed_at).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        )}
      </form>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50
        rounded-md transition-colors mt-4"
      >
        <LogOut size={20} />
        {t('navigation.logout')}
      </button>
    </div>
  );
};