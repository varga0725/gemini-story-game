import { translations } from '../localization/translations';

// A simple hook to return the correct set of translations based on the selected language.
export const useTranslations = (language: 'en' | 'hu') => {
  return translations[language];
};