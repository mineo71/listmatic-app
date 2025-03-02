// src/components/settings/Settings.tsx
import { useState } from 'react';
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
  icon: typeof Globe;
  title: string;
}

export const Settings = () => {
  const { t, i18n } = useTranslation();
  const [activeSection, setActiveSection] = useState<string>('general');
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
    { key: 'general', icon: Globe, title: t('settings.sections.general') },
    // { key: 'notifications', icon: Bell, title: t('settings.sections.notifications') },
    // { key: 'appearance', icon: Moon, title: t('settings.sections.appearance') },
    // { key: 'sound', icon: Volume2, title: t('settings.sections.sound') },
    // { key: 'privacy', icon: Shield, title: t('settings.sections.privacy') },
    { key: 'data', icon: Database, title: t('settings.sections.data') },
  ];

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = event.target.value;
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{t('settings.language')}</h3>
        <select
          value={i18n.language}
          onChange={handleLanguageChange}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-amber-500 focus:border-amber-500 rounded-md"
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
              onChange={(e) => setNotificationSettings(prev => ({
                ...prev,
                emailNotifications: e.target.checked
              }))}
              className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
            />
            <span className="ml-3 text-gray-700">{t('settings.notifications.email')}</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={notificationSettings.pushNotifications}
              onChange={(e) => setNotificationSettings(prev => ({
                ...prev,
                pushNotifications: e.target.checked
              }))}
              className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
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
              onChange={(e) => setThemeSettings(prev => ({
                ...prev,
                theme: e.target.value
              }))}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-amber-500 focus:border-amber-500 rounded-md"
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
              onChange={(e) => setThemeSettings(prev => ({
                ...prev,
                compactMode: e.target.checked
              }))}
              className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
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
            onClick={() => {
              if (window.confirm(t('settings.data.confirmExport'))) {
                // Handle data export
              }
            }}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            {t('settings.data.exportData')}
          </button>
          <button
            onClick={() => {
              if (window.confirm(t('settings.data.confirmDelete'))) {
                // Handle data deletion
              }
            }}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {t('settings.data.deleteData')}
          </button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'general':
        return renderGeneralSettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'appearance':
        return renderAppearanceSettings();
      case 'data':
        return renderDataSettings();
      default:
        return renderGeneralSettings();
    }
  };

      return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Settings Navigation */}
      <div className="w-64 border-r border-gray-200 bg-white">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900">{t('settings.title')}</h2>
          <p className="mt-1 text-sm text-gray-500">{t('settings.description')}</p>
        </div>
        <nav className="space-y-1 px-2">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.key}
                onClick={() => setActiveSection(section.key)}
                className={`flex items-center w-full px-4 py-2 text-sm rounded-md
                  ${activeSection === section.key
                    ? 'bg-amber-50 text-amber-700'
                    : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <Icon
                  className={`mr-3 h-5 w-5 ${
                    activeSection === section.key
                      ? 'text-amber-500'
                      : 'text-gray-400'
                  }`}
                />
                {section.title}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Settings Content */}
      <div className="flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};