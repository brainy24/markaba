// TODO: SSB-approved copy. Every answer below is placeholder wording written for
// scaffolding purposes only — none of it has been reviewed or approved by the
// Sharia Supervisory Board. Do not treat this as compliant customer-facing copy
// (CLAUDE.md §2.1). Replace wholesale once the SSB signs off.
//
// Content sourced from PRD.md (§2, §5, §8, §10) — describes product mechanics
// and process only. Deliberately avoids making any Sharia ruling or ninewa
// theological claim beyond what the PRD itself states; this is a scaffold for
// the *shape* of the FAQ layer, not approved religious guidance.

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
  {
    key: 'how_is_this_different_from_a_bank_loan',
    question: 'How is this different from a loan?',
    answer:
      '[PLACEHOLDER — TODO: SSB-approved copy] There is no interest charged, ever. Ijarah ' +
      'is a rental with a fixed monthly amount agreed upfront; Murabaha is a sale at a ' +
      'fixed, disclosed mark-up. Neither changes based on time or a benchmark rate.',
  },
  {
    key: 'how_much_is_the_down_payment',
    question: 'How much is the down payment?',
    answer:
      '[PLACEHOLDER — TODO: SSB-approved copy] For Ijarah: minimum 20% for personal use, ' +
      '15% for commercial fleet. For Murabaha: minimum 25%. Exact amount depends on the ' +
      "vehicle you choose.",
  },
  {
    key: 'what_terms_are_available',
    question: 'What terms are available?',
    answer:
      '[PLACEHOLDER — TODO: SSB-approved copy] 12, 18, 24, 36, or 48 months. Your monthly ' +
      'rental or instalment is fixed for the whole term — disclosed before you sign anything.',
  },
  {
    key: 'why_is_there_a_gps_tracker',
    question: 'Why is there a GPS tracker?',
    answer:
      '[PLACEHOLDER — TODO: SSB-approved copy] Every financed vehicle has a GPS tracker ' +
      "fitted as standard. It protects Markaba's ownership stake during the term (Ijarah) " +
      "or the financed asset (Murabaha) — it is not used to monitor your daily movements.",
  },
  {
    key: 'what_is_takaful',
    question: 'What is Takaful?',
    answer:
      '[PLACEHOLDER — TODO: SSB-approved copy] Takaful is Islamic (non-conventional) motor ' +
      'insurance, included automatically on every financed vehicle through a licensed ' +
      'Takaful partner — not a regular insurance policy.',
  },
  {
    key: 'what_documents_do_i_need',
    question: 'What documents do I need?',
    answer:
      '[PLACEHOLDER — TODO: SSB-approved copy] Your BVN, a quick liveness check (a selfie ' +
      "video), and consent to securely link your bank account so we can verify your income " +
      "— no paper statements needed.",
  },
  {
    key: 'can_i_pay_off_early',
    question: 'Can I pay off early?',
    answer:
      '[PLACEHOLDER — TODO: SSB-approved copy] You can ask to settle early. Any rebate on ' +
      'the remaining amount is at Markaba’s discretion, not a guaranteed right — this ' +
      'keeps the structure Sharia-compliant.',
  },
  {
    key: 'what_if_i_miss_a_payment',
    question: 'What if I miss a payment?',
    answer:
      '[PLACEHOLDER — TODO: SSB-approved copy] We will never charge interest or a ' +
      'time-based penalty on a late payment. If any late fee applies, it is directed to ' +
      'charity, never kept as Markaba income.',
  },
  {
    key: 'do_i_need_a_guarantor',
    question: 'Do I need a guarantor?',
    answer:
      '[PLACEHOLDER — TODO: SSB-approved copy] Some applications require a guarantor, ' +
      "depending on your income and the vehicle value. We'll tell you during your " +
      'application if one is needed.',
  },
  {
    key: 'is_this_available_in_hausa',
    question: 'Is this available in Hausa?',
    answer:
      '[PLACEHOLDER — TODO: SSB-approved copy] Hausa language support is in progress. ' +
      'English is fully supported today.',
  },
  {
    key: 'what_happens_at_the_end_of_the_term',
    question: 'What happens at the end of the term?',
    answer:
      '[PLACEHOLDER — TODO: SSB-approved copy] For Ijarah, ownership of the vehicle ' +
      'transfers to you at the end of the term, documented separately from the lease ' +
      'agreement. For Murabaha, you already own the vehicle from day one.',
  },
  {
    key: 'where_do_you_operate',
    question: 'Where do you operate?',
    answer:
      '[PLACEHOLDER — TODO: SSB-approved copy] Markaba is currently piloting in Kano and ' +
      'Abuja.',
  },
  {
    key: 'do_you_have_a_referral_program',
    question: 'Do you have a referral program?',
    answer:
      '[PLACEHOLDER — TODO: SSB-approved copy] Yes — refer someone who completes an ' +
      'application, and you get a rental credit once their vehicle is activated. Ask us ' +
      'for details when you apply.',
  },
];

export const FAQ_MENU_TEXT =
  'Ask me about: ' + FAQ_CONTENT.map((entry) => `"${entry.question}"`).join(', ');
