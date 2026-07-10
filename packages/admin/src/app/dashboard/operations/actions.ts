'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '../../../auth';
import { OPERATIONS_VIEW_ROLES } from '../../../lib/auth';
import { applyMockTransition, recordVehiclePurchase } from '../../../lib/mock-data';

async function requireOperationsActor(): Promise<string> {
  const session = await auth();
  const role = session?.user?.role;
  if (!role || !OPERATIONS_VIEW_ROLES.includes(role)) {
    throw new Error('Only an Operations or CEO session may act on vehicle sourcing.');
  }
  return session?.user?.name ?? session?.user?.email ?? 'unknown';
}

/** APPROVED -> VEHICLE_SOURCING. Not a credit decision — no approval token needed. */
export async function startSourcing(applicationId: string): Promise<void> {
  const actor = await requireOperationsActor();
  applyMockTransition(applicationId, 'VEHICLE_SOURCING', actor);
  revalidatePath('/dashboard/operations');
}

/**
 * Records the purchase receipt and moves VEHICLE_SOURCING -> PURCHASE_CONFIRMED
 * (PRD A.2.1, A.3 rule 1 — Markaba must own the vehicle before any lease/sale
 * agreement). Evidence-recording, not itself Sharia-critical (CLAUDE.md §2.1) —
 * the SSB gate is the separate PURCHASE_CONFIRMED -> CONTRACT_SIGNED step.
 */
export async function confirmPurchase(applicationId: string, formData: FormData): Promise<void> {
  const actor = await requireOperationsActor();
  const purchaseReceiptRef = String(formData.get('purchaseReceiptRef') ?? '').trim();
  if (!purchaseReceiptRef) {
    throw new Error('A purchase receipt reference is required to confirm a purchase.');
  }
  recordVehiclePurchase(applicationId, purchaseReceiptRef, actor);
  revalidatePath('/dashboard/operations');
}
