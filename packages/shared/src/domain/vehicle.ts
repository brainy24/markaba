/**
 * Vehicle — the asset underlying an Ijarah (lease-to-own) or Murabaha (cost-plus
 * sale) contract. The finance product (`IJARAH`/`MURABAHA`) is a property of the
 * `Application`, not the vehicle itself — the same vehicle could in principle be
 * financed either way, so `FinanceProduct` lives in `application.ts`.
 *
 * `purchaseReceiptRef` is the verified proof-of-purchase record. Its presence is
 * the precondition the state machine checks before any lease/sale contract may be
 * generated — Markaba may never lease or sell a vehicle it has not yet bought
 * (CLAUDE.md §2.1). Recording a receipt here does not itself perform a purchase;
 * that is a human-accountable, out-of-band action this record merely reflects.
 */
export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  mileage: number;
  /**
   * Inspection partner's condition grade (Cars45/Autochek). Not integrated in
   * Phase 1 (PRD A.8) — entered manually by Operations until then.
   */
  inspectionGrade?: string;
  marketValuation: number;
  status: VehicleStatus;
  /** Set only once a verified purchase receipt has been recorded. */
  purchaseReceiptRef?: string;
  purchaseConfirmedAt?: Date;
  /** Set once a GPS tracker is fitted at possession (mock Initrack adapter). */
  gpsImei?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type VehicleStatus =
  'SOURCING' | 'RESERVED' | 'PURCHASE_CONFIRMED' | 'ALLOCATED' | 'IN_SERVICE' | 'REPOSSESSED';
