import { Injectable } from '@nestjs/common';
import type { Application, Vehicle } from '@markaba/shared';
import { NotImplementedError } from '@markaba/shared';
import type { ContractDraft, ShariaComplianceEngine } from './sharia.types';

/**
 * HUMAN-CHECKPOINT: every method here is a stub. This module exists only to
 * scaffold the interface and be wired into the app graph — see CLAUDE.md §2.1.
 * None of these bodies may be implemented until the SSB is constituted and has
 * certified the corresponding contract templates / compliance rules.
 */
@Injectable()
export class ShariaService implements ShariaComplianceEngine {
  // TODO: requires SSB certification.
  generateIjarahContract(_application: Application, _vehicle: Vehicle): Promise<ContractDraft> {
    throw new NotImplementedError(
      'Ijarah contract generation requires SSB-certified templates (CLAUDE.md §2.1).',
    );
  }

  // TODO: requires SSB certification.
  generateMurabahaContract(_application: Application, _vehicle: Vehicle): Promise<ContractDraft> {
    throw new NotImplementedError(
      'Murabaha contract generation requires SSB-certified templates (CLAUDE.md §2.1).',
    );
  }

  // TODO: requires SSB certification.
  evaluateComplianceRules(_application: Application): Promise<boolean> {
    throw new NotImplementedError(
      'The Sharia compliance rules engine requires SSB sign-off (CLAUDE.md §2.1).',
    );
  }

  // TODO: requires SSB certification.
  transferOwnership(_application: Application, _vehicle: Vehicle): Promise<void> {
    throw new NotImplementedError(
      'Ownership-transfer (hiba) logic requires SSB certification (CLAUDE.md §2.1).',
    );
  }
}
