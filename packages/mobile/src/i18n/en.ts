export interface TranslationShape {
  onboarding: {
    title: string;
    subtitle: string;
    getStarted: string;
  };
  login: {
    title: string;
    phoneLabel: string;
    submit: string;
    mockNotice: string;
  };
  dashboard: {
    title: string;
    empty: string;
    statusLabel: string;
  };
  common: {
    loading: string;
    error: string;
  };
}

export const en: TranslationShape = {
  onboarding: {
    title: 'Welcome to Markaba',
    subtitle: 'Sharia-compliant vehicle financing, fully digital.',
    getStarted: 'Get started',
  },
  login: {
    title: 'Sign in',
    phoneLabel: 'Phone number',
    submit: 'Continue',
    mockNotice: 'Mock sign-in for Phase 1 — no real KYC or liveness check yet.',
  },
  dashboard: {
    title: 'Your applications',
    empty: 'You have no applications yet.',
    statusLabel: 'Status',
  },
  common: {
    loading: 'Loading…',
    error: 'Something went wrong. Please try again.',
  },
};
