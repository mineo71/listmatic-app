// src/i18n/config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import locales
import en from './locales/en.json';
import uk from './locales/uk.json';

export const defaultNS = 'translation';
export const resources = {
  en: {
    translation: en,
  },
  uk: {
    translation: uk,
  },
} as const;

i18n.use(initReactI18next).init({
  resources,
  defaultNS,
  lng: localStorage.getItem('language') || 'en', // Default language
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: true,
  },
});

export default i18n;