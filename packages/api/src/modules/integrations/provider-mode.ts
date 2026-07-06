/**
 * Every integration adapter is selected by this single env-driven switch
 * (CLAUDE.md §2.4 — no live CBN/bank/KYC/payment/telematics endpoint may be wired
 * until OBR/NIFI registration and real credentials exist).
 */
export type ProviderMode = 'mock' | 'live';

export function getProviderMode(): ProviderMode {
  const mode = process.env.PROVIDER_MODE ?? 'mock';
  if (mode !== 'mock' && mode !== 'live') {
    throw new Error(`Invalid PROVIDER_MODE "${mode}" — expected "mock" or "live".`);
  }
  return mode;
}

/**
 * HUMAN-CHECKPOINT: live provider wiring requires credentials + registration.
 * Call this from every adapter module's live-mode branch instead of implementing
 * one — see CLAUDE.md §2.2 and §2.4.
 */
export function throwLiveModeNotImplemented(providerName: string): never {
  throw new Error(
    `${providerName}: live mode is not implemented in this phase. ` +
      'HUMAN-CHECKPOINT: live provider wiring requires credentials + registration ' +
      '(CLAUDE.md §2.2, §2.4). Set PROVIDER_MODE=mock.',
  );
}
