// src/i18n/config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import locales
import en from './locales/en.json';
import uk from './locales/uk.json';
import es from './locales/es.json';
import it from './locales/it.json';
import de from './locales/de.json';
import pl from './locales/pl.json';

export const defaultNS = 'translation';
export const resources = {
  en: {
    translation: en,
  },
  uk: {
    translation: uk,
  },
  es: {
    translation: es,
  },
  it: {
    translation: it,
  },
  de: {
    translation: de,
  },
  pl: {
    translation: pl,
  },
} as const;

// Language options for the UI
export const languageOptions = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська' },
];

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