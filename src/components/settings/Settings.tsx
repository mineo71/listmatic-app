// src/components/settings/Settings.tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Globe,
  // Moon,
  // Bell,
  // Volume2,
  // Shield,
  Database,
  Trash2
} from 'lucide-react';

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

  const sections: SettingsSection[] = [
    { key: 'general',       icon: Globe,    title: t('settings.sections.general') },
    // { key: 'notifications', icon: Bell,     title: t('settings.sections.notifications') },
    // { key: 'appearance',    icon: Moon,     title: t('settings.sections.appearance') },
    // { key: 'sound',         icon: Volume2,  title: t('settings.sections.sound') },
    // { key: 'privacy',       icon: Shield,   title: t('settings.sections.privacy') },
    { key: 'data',          icon: Database, title: t('settings.sections.data') },
  ];

  // Change UI language
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
    localStorage.setItem('language', e.target.value);
  };

  // --- Section renderers ---
  const renderGeneralSettings = () => (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('settings.language')}</h3>
          <select
              value={i18n.language}
              onChange={handleLanguageChange}
              className="mt-1 block w-full rounded-md border-gray-300 focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="en">English</option>
            <option value="uk">Українська</option>
          </select>
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
