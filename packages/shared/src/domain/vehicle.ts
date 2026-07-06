/**
 * Vehicle — the asset underlying an Ijarah (lease-to-own) or Murabaha (cost-plus
 * sale) contract.
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
  financeType: VehicleFinanceType;
  priceNaira: number;
  status: VehicleStatus;
  /** Set only once a verified purchase receipt has been recorded. */
  purchaseReceiptRef?: string;
  purchaseConfirmedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type VehicleFinanceType = 'IJARAH' | 'MURABAHA';

export type VehicleStatus =
  | 'SOURCING'
  | 'RESERVED'
  | 'PURCHASE_CONFIRMED'
  | 'ALLOCATED'
  | 'IN_SERVICE'
  | 'REPOSSESSED';
