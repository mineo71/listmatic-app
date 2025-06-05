// src/components/settings/LanguageSelector.tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Check } from 'lucide-react';
import { updateUserLanguage } from '@/services/database';
import toast from 'react-hot-toast';

// Language options with flags and native names
export const languageOptions = [
    { 
        code: 'uk', 
        name: 'Ukrainian', 
        nativeName: 'Українська',
        flag: '🇺🇦'
      },
  { 
    code: 'en', 
    name: 'English', 
    nativeName: 'English',
    flag: '🇺🇸'
  },
  { 
    code: 'es', 
    name: 'Spanish', 
    nativeName: 'Español',
    flag: '🇪🇸'
  },
  { 
    code: 'it', 
    name: 'Italian', 
    nativeName: 'Italiano',
    flag: '🇮🇹'
  },
  { 
    code: 'de', 
    name: 'German', 
    nativeName: 'Deutsch',
    flag: '🇩🇪'
  },
  { 
    code: 'pl', 
    name: 'Polish', 
    nativeName: 'Polski',
    flag: '🇵🇱'
  },
];

interface LanguageSelectorProps {
  className?: string;
}

export const LanguageSelector = ({ className = '' }: LanguageSelectorProps) => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const currentLanguage = languageOptions.find(lang => lang.code === i18n.language) || languageOptions[0];

  const handleLanguageChange = async (languageCode: string) => {
    if (languageCode === i18n.language || isChanging) return;

    setIsChanging(true);
    setIsOpen(false);

    try {
      // Change language in i18n
      await i18n.changeLanguage(languageCode);
      
      // Save to localStorage
      localStorage.setItem('language', languageCode);
      
      // Save to database if user is authenticated
      try {
        await updateUserLanguage(languageCode);
      } catch (dbError) {
        console.warn('Could not save language preference to database:', dbError);
        // Don't show error to user since language change still worked locally
      }

      // Show success message
      toast.success(t('settings.messages.languageSaved'));
    } catch (error) {
      console.error('Language change error:', error);
      toast.error(t('settings.messages.languageSaveError'));
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Language Selector Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isChanging}
        className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
            {isChanging ? (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-amber-600 rounded-full animate-spin" />
            ) : (
              <span className="text-lg">{currentLanguage.flag}</span>
            )}
          </div>
          <div className="text-left">
            <div className="font-medium text-gray-900">
              {currentLanguage.nativeName}
            </div>
            <div className="text-sm text-gray-500">
              {currentLanguage.name}
            </div>
          </div>
        </div>
        <ChevronDown 
          size={20} 
          className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Content */}
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
            {languageOptions.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                disabled={isChanging}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed first:rounded-t-lg last:rounded-b-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{language.flag}</span>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">
                      {language.nativeName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {language.name}
                    </div>
                  </div>
                </div>
                {language.code === i18n.language && (
                  <Check size={16} className="text-amber-600" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};