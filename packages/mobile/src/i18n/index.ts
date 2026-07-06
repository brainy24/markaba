import { en } from './en';
import { ha } from './ha';

export type Locale = 'en' | 'ha';

const TRANSLATIONS = { en, ha };

export function getTranslations(locale: Locale) {
  return TRANSLATIONS[locale];
}

export const SUPPORTED_LOCALES: readonly Locale[] = ['en', 'ha'];
