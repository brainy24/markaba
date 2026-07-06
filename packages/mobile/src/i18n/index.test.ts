import { getTranslations, SUPPORTED_LOCALES } from './index';

describe('i18n', () => {
  it('supports English and Hausa', () => {
    expect(SUPPORTED_LOCALES).toEqual(['en', 'ha']);
  });

  it('returns matching shapes for every supported locale', () => {
    const en = getTranslations('en');
    const ha = getTranslations('ha');
    expect(Object.keys(en)).toEqual(Object.keys(ha));
    expect(Object.keys(en.onboarding)).toEqual(Object.keys(ha.onboarding));
  });

  it('has real (non-placeholder) English copy', () => {
    const en = getTranslations('en');
    expect(en.onboarding.title).toBe('Welcome to Markaba');
  });

  it('marks Hausa copy as a placeholder', () => {
    const ha = getTranslations('ha');
    expect(ha.onboarding.title).toContain('[HA]');
  });
});
