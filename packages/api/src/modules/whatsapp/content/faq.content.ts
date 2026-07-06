// TODO: SSB-approved copy. Every answer below is placeholder wording written for
// scaffolding purposes only — none of it has been reviewed or approved by the
// Sharia Supervisory Board. Do not treat this as compliant customer-facing copy
// (CLAUDE.md §2.1). Replace wholesale once the SSB signs off.

export interface FaqEntry {
  key: string;
  question: string;
  answer: string;
}

export const FAQ_CONTENT: readonly FaqEntry[] = [
  {
    key: 'what_is_ijarah',
    question: 'What is Ijarah?',
    answer:
      '[PLACEHOLDER — TODO: SSB-approved copy] Ijarah is a lease-to-own arrangement: ' +
      'Markaba buys the vehicle first, then leases it to you with ownership transferring ' +
      'at the end of the term.',
  },
  {
    key: 'what_is_murabaha',
    question: 'What is Murabaha?',
    answer:
      '[PLACEHOLDER — TODO: SSB-approved copy] Murabaha is a cost-plus sale: Markaba buys ' +
      'the vehicle and sells it to you at a disclosed, fixed markup, repaid in instalments.',
  },
  {
    key: 'is_this_sharia_compliant',
    question: 'Is Markaba Sharia-compliant?',
    answer:
      '[PLACEHOLDER — TODO: SSB-approved copy] Markaba is designed against Sharia ' +
      'principles and is being reviewed by a Sharia Supervisory Board (SSB).',
  },
  {
    key: 'how_to_apply',
    question: 'How do I apply?',
    answer:
      '[PLACEHOLDER — TODO: SSB-approved copy] Reply "apply" to start an application. ' +
      "We'll ask a few questions and guide you through the next steps.",
  },
];

export const FAQ_MENU_TEXT =
  'Ask me about: ' + FAQ_CONTENT.map((entry) => `"${entry.question}"`).join(', ');
