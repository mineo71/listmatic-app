/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/settings/Settings.tsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Globe,
  // Moon,
  // Bell,
  // Volume2,
  // Shield,
  Database,
  Trash2,
  Save,
  Check
} from 'lucide-react';
import { updateUserLanguage, getUserProfile } from '@/services/database';
import toast from 'react-hot-toast';

interface SettingsSection {
  key: string;
  icon: React.FC<{ className?: string }>;
  title: string;
}

export const Settings = () => {
  const { t, i18n } = useTranslation();
  const [activeSection, setActiveSection] = useState<'general' | 'notifications' | 'appearance' | 'sound' | 'privacy' | 'data'>('general');
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    soundEnabled: true,
  });
  const [themeSettings, setThemeSettings] = useState({
    theme: 'light',
    sidebar: true,
    compactMode: false,
  });

  // Language settings state
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const [savedLanguage, setSavedLanguage] = useState(i18n.language);
  const [languageSaving, setLanguageSaving] = useState(false);
  const [languageChanged, setLanguageChanged] = useState(false);

  const sections: SettingsSection[] = [
    { key: 'general',       icon: Globe,    title: t('settings.sections.general') },
    // { key: 'notifications', icon: Bell,     title: t('settings.sections.notifications') },
    // { key: 'appearance',    icon: Moon,     title: t('settings.sections.appearance') },
    // { key: 'sound',         icon: Volume2,  title: t('settings.sections.sound') },
    // { key: 'privacy',       icon: Shield,   title: t('settings.sections.privacy') },
    { key: 'data',          icon: Database, title: t('settings.sections.data') },
  ];

  // Load user's saved language preference
  useEffect(() => {
    const loadUserProfile = async () => {
      const { data, error } = await getUserProfile();
      if (data && data.language) {
        setSavedLanguage(data.language);
        setCurrentLanguage(data.language);
        i18n.changeLanguage(data.language);
      }
    };
    
    loadUserProfile();
  }, [i18n]);

  // Check if language has changed
  useEffect(() => {
    setLanguageChanged(currentLanguage !== savedLanguage);
  }, [currentLanguage, savedLanguage]);

  // Change UI language immediately but don't save yet
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value;
    setCurrentLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  // Save language to database
  const handleSaveLanguage = async () => {
    setLanguageSaving(true);
    
    try {
      const { error } = await updateUserLanguage(currentLanguage);
      
      if (error) {
        throw error;
      }
      
      setSavedLanguage(currentLanguage);
      setLanguageChanged(false);
      toast.success(t('settings.messages.languageSaved'));
    } catch (error) {
      console.error('Error saving language:', error);
      toast.error(t('settings.messages.languageSaveError'));
    } finally {
      setLanguageSaving(false);
    }
  };

  // --- Section renderers ---
  const renderGeneralSettings = () => (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('settings.language')}</h3>
          
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <select
                  value={currentLanguage}
                  onChange={handleLanguageChange}
                  className="block w-full rounded-md border-gray-300 focus:ring-amber-500 focus:border-amber-500 p-3"
              >
                <option value="en">English</option>
                <option value="uk">Українська</option>
              </select>
            </div>
            
            {languageChanged && (
              <button
                onClick={handleSaveLanguage}
                disabled={languageSaving}
                className="flex items-center gap-2 px-4 py-3 bg-amber-600 text-white rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {languageSaving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {languageSaving ? t('settings.saving') : t('settings.save')}
              </button>
            )}
            
            {!languageChanged && savedLanguage === currentLanguage && (
              <div className="flex items-center gap-2 text-green-600">
                <Check size={16} />
                <span className="text-sm">{t('settings.saved')}</span>
              </div>
            )}
          </div>
          
          <p className="text-sm text-gray-500 mt-2">
            {t('settings.languageDescription')}
          </p>
        </div>
      </div>
  );

  const renderNotificationSettings = () => (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('settings.notifications.title')}</h3>
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                  type="checkbox"
                  checked={notificationSettings.emailNotifications}
                  onChange={e => setNotificationSettings(s => ({ ...s, emailNotifications: e.target.checked }))}
                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="ml-3 text-gray-700">{t('settings.notifications.email')}</span>
            </label>
            <label className="flex items-center">
              <input
                  type="checkbox"
                  checked={notificationSettings.pushNotifications}
                  onChange={e => setNotificationSettings(s => ({ ...s, pushNotifications: e.target.checked }))}
                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="ml-3 text-gray-700">{t('settings.notifications.push')}</span>
            </label>
          </div>
        </div>
      </div>
  );

  const renderAppearanceSettings = () => (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('settings.appearance.title')}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('settings.appearance.theme')}
              </label>
              <select
                  value={themeSettings.theme}
                  onChange={e => setThemeSettings(s => ({ ...s, theme: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="light">{t('settings.appearance.themes.light')}</option>
                <option value="dark">{t('settings.appearance.themes.dark')}</option>
                <option value="system">{t('settings.appearance.themes.system')}</option>
              </select>
            </div>
            <label className="flex items-center">
              <input
                  type="checkbox"
                  checked={themeSettings.compactMode}
                  onChange={e => setThemeSettings(s => ({ ...s, compactMode: e.target.checked }))}
                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="ml-3 text-gray-700">{t('settings.appearance.compactMode')}</span>
            </label>
          </div>
        </div>
      </div>
  );

  const renderDataSettings = () => (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('settings.data.title')}</h3>
          <div className="space-y-4">
            <button
                onClick={() => window.confirm(t('settings.data.confirmExport'))}
                className="w-full py-2 rounded-md bg-amber-600 text-white hover:bg-amber-700"
            >
              {t('settings.data.exportData')}
            </button>
            <button
                onClick={() => window.confirm(t('settings.data.confirmDelete'))}
                className="w-full py-2 rounded-md bg-red-600 text-white hover:bg-red-700 flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {t('settings.data.deleteData')}
            </button>
          </div>
        </div>
      </div>
  );

  // choose which panel to render
  const renderContent = () => {
    switch (activeSection) {
      case 'notifications': return renderNotificationSettings();
      case 'appearance':   return renderAppearanceSettings();
      case 'data':         return renderDataSettings();
      default:              return renderGeneralSettings();
    }
  };

  return (
      <div className="flex min-h-screen bg-gray-50">
        {/* desktop sidebar */}
        <aside className="hidden sm:flex sm:flex-col w-64 bg-white border-r border-gray-200">
          <div className="pt-10 px-6">
            <h2 className="text-xl font-semibold">{t('settings.title')}</h2>
            <p className="mt-1 text-sm text-gray-500">{t('settings.description')}</p>
          </div>
          <nav className="flex-1 px-2 mt-4 space-y-1">
            {sections.map(({ key, icon: Icon, title }) => (
                <button
                    key={key}
                    onClick={() => setActiveSection(key as any)}
                    className={`w-full flex items-center gap-2 px-4 py-3 text-sm rounded-md
                ${activeSection === key
                        ? 'bg-amber-50 text-amber-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <Icon className={activeSection === key ? 'text-amber-500 w-5 h-5' : 'text-gray-400 w-5 h-5'} />
                  {title}
                </button>
            ))}
          </nav>
        </aside>

        {/* main content area */}
        <main className="flex-1 p-6 pt-14 sm:pt-6">
          <div className="max-w-2xl mx-auto">
            {renderContent()}
          </div>
        </main>

        {/* mobile bottom navigation */}
        <footer className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex">
          {sections.map(({ key, icon: Icon, title }) => (
              <button
                  key={key}
                  onClick={() => setActiveSection(key as any)}
                  className="flex-1 flex flex-col items-center justify-center py-3"
              >
                <Icon
                    className={`w-5 h-5 mb-1 ${
                        activeSection === key ? 'text-amber-600' : 'text-gray-400'
                    }`}
                />
                <span className={`text-xs ${
                    activeSection === key ? 'text-amber-700' : 'text-gray-600'
                }`}>
              {title}
            </span>
              </button>
          ))}
        </footer>
      </div>
  );
};