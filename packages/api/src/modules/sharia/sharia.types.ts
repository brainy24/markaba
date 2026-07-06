/**
 * Sharia-compliance interfaces — Phase 1 scaffold only.
 *
 * Do NOT implement these bodies. Contract generation, the compliance rules
 * engine, and ownership-transfer (hiba) logic are Markaba's core Sharia IP and
 * must be built with the Sharia Supervisory Board against SSB-certified contract
 * templates that do not yet exist (CLAUDE.md §2.1).
 *
 * TODO: requires SSB certification.
 */
import type { Application, Vehicle } from '@markaba/shared';

export interface ContractDraft {
  applicationId: string;
  vehicleId: string;
  templateVersion: string;
  generatedAt: Date;
}

export interface ShariaComplianceEngine {
  /** TODO: requires SSB certification — do not implement. */
  generateIjarahContract(application: Application, vehicle: Vehicle): Promise<ContractDraft>;

  /** TODO: requires SSB certification — do not implement. */
  generateMurabahaContract(application: Application, vehicle: Vehicle): Promise<ContractDraft>;

  /** TODO: requires SSB certification — do not implement. */
  evaluateComplianceRules(application: Application): Promise<boolean>;

  /** TODO: requires SSB certification — do not implement. */
  transferOwnership(application: Application, vehicle: Vehicle): Promise<void>;
}
