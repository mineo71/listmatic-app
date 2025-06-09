// src/components/settings/Settings.tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import { 
  Settings as SettingsIcon, 
  Globe,
  Menu
} from 'lucide-react';
import { LanguageSelector } from '../shared/LanguageSelector';

type SettingsSection = 'general' | 'notifications' | 'appearance' | 'privacy' | 'data';

type ContextType = {
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
};

export const Settings = () => {
  const { t } = useTranslation();
  const { isSidebarOpen, onToggleSidebar } = useOutletContext<ContextType>();
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');

  const sections = [
    {
      id: 'general' as const,
      name: t('settings.sections.general'),
      icon: SettingsIcon,
      description: 'Language and basic preferences'
    },
    // {
    //   id: 'notifications' as const,
    //   name: t('settings.sections.notifications'),
    //   icon: Bell,
    //   description: 'Manage how you receive updates'
    // },
    // {
    //   id: 'appearance' as const,
    //   name: t('settings.sections.appearance'),
    //   icon: Palette,
    //   description: 'Customize the look and feel'
    // },
    // {
    //   id: 'privacy' as const,
    //   name: t('settings.sections.privacy'),
    //   icon: Shield,
    //   description: 'Control your privacy settings'
    // },
    // {
    //   id: 'data' as const,
    //   name: t('settings.sections.data'),
    //   icon: Database,
    //   description: 'Export and manage your data'
    // },
  ];

  const renderGeneralSection = () => (
    <div className="space-y-6">
      {/* Language Selection */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Globe size={20} className="text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            {t('settings.language')}
          </h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          {t('settings.languageDescription')}
        </p>
        <LanguageSelector />
      </div>
    </div>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'general':
        return renderGeneralSection();
      default:
        return renderGeneralSection();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-4 relative">
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
      
    <h1 className="text-2xl font-bold text-gray-900 ml-12 mb-6">{t('settings.title')}</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                    activeSection === section.id
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={20} />
                  <div>
                    <div className="font-medium">{section.name}</div>
                    <div className="text-xs text-gray-500 hidden lg:block">
                      {section.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {renderSectionContent()}
          </div>
        </div>
      </div>
    </div>
  );
};