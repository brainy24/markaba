import type { ApplicationState } from './application';
import { TERMINAL_STATES } from './application';

/**
 * Thrown by Sharia-gated transition bodies that require SSB-certified contract
 * templates which do not yet exist (CLAUDE.md §2.1). This is not a bug — it is the
 * intended behavior until the SSB signs off.
 */
export class NotImplementedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotImplementedError';
  }
}

/** The legal application-state transition table (states only — no side effects). */
const TRANSITIONS: Readonly<Record<ApplicationState, readonly ApplicationState[]>> = {
  SUBMITTED: ['KYC_PENDING'],
  KYC_PENDING: ['OPEN_BANKING_CONSENT', 'DECLINED'],
  OPEN_BANKING_CONSENT: ['UNDERWRITING', 'DECLINED'],
  UNDERWRITING: ['APPROVED', 'REFERRED', 'DECLINED'],
  REFERRED: ['UNDERWRITING', 'DECLINED'],
  APPROVED: ['VEHICLE_SOURCING'],
  VEHICLE_SOURCING: ['PURCHASE_CONFIRMED'],
  PURCHASE_CONFIRMED: ['CONTRACT_SIGNED'],
  CONTRACT_SIGNED: ['ACTIVE'],
  ACTIVE: ['COMPLETED', 'DEFAULTED'],
  DECLINED: [],
  COMPLETED: [],
  DEFAULTED: [],
};

/**
 * Pure check: is `from -> to` a legal transition in the application state machine?
 * This says nothing about whether the transition's *body* is implemented yet —
 * see `applyTransition` for the PURCHASE_CONFIRMED -> CONTRACT_SIGNED SSB gate.
 */
export function canTransition(from: ApplicationState, to: ApplicationState): boolean {
  if (TERMINAL_STATES.has(from)) return false;
  return TRANSITIONS[from].includes(to);
}

/** All states reachable from `from` in exactly one legal transition. */
export function legalNextStates(from: ApplicationState): readonly ApplicationState[] {
  return TRANSITIONS[from];
}

/**
 * Pure state-transition function. Returns the next state, or throws.
 *
 * PURCHASE_CONFIRMED -> CONTRACT_SIGNED is legal in the table (it is the correct
 * next step of the origination flow) but its body must not run yet: contract
 * generation is Sharia-critical IP and must be built with the Sharia Supervisory
 * Board against SSB-certified templates that do not yet exist.
 *
 * TODO: requires SSB certification — do not implement the contract-generation body.
 */
export function applyTransition(
  from: ApplicationState,
  to: ApplicationState,
): ApplicationState {
  if (!canTransition(from, to)) {
    throw new Error(`Illegal application state transition: ${from} -> ${to}`);
  }

  if (from === 'PURCHASE_CONFIRMED' && to === 'CONTRACT_SIGNED') {
    // HUMAN-CHECKPOINT: contract generation requires SSB-certified templates.
    throw new NotImplementedError(
      'CONTRACT_SIGNED transition is gated on SSB-certified contract templates ' +
        'and is not implemented in this phase (CLAUDE.md §2.1).',
    );
  }

  return to;
}
