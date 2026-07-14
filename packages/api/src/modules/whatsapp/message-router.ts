export type WhatsAppIntent = 'education' | 'start_application' | 'check_status' | 'unknown';

const START_KEYWORDS = ['apply', 'start', 'start application'];
const STATUS_KEYWORDS = ['status', 'check status'];
const EDUCATION_KEYWORDS = [
  'faq',
  'help',
  'menu',
  'ijarah',
  'murabaha',
  'sharia',
  'loan',
  'down payment',
  'term',
  'gps',
  'tracker',
  'takaful',
  'insurance',
  'document',
  'pay off',
  'early',
  'miss a payment',
  'late payment',
  'guarantor',
  'hausa',
  'language',
  'end of the term',
  'ownership',
  'kano',
  'abuja',
  'operate',
  'referral',
  'refer',
];

/**
 * Pure keyword router — no I/O, no credit logic, no PII handling. Just decides
 * which handler an inbound message text should be dispatched to.
 */
export function routeIntent(text: string): WhatsAppIntent {
  const normalized = text.trim().toLowerCase();

  if (START_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return 'start_application';
  }
  if (STATUS_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return 'check_status';
  }
  if (EDUCATION_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return 'education';
  }
  return 'unknown';
}
