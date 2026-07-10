'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { decodeSession, OPERATIONS_VIEW_ROLES, SESSION_COOKIE } from '../../../lib/auth';
import { applyMockTransition, recordVehiclePurchase } from '../../../lib/mock-data';

function requireOperationsSession() {
  const session = decodeSession(cookies().get(SESSION_COOKIE)?.value);
  if (!session || !OPERATIONS_VIEW_ROLES.includes(session.role)) {
    throw new Error('Only an Operations or CEO session may act on vehicle sourcing.');
  }
  return session;
}

/** APPROVED -> VEHICLE_SOURCING. Not a credit decision — no approval token needed. */
export async function startSourcing(applicationId: string): Promise<void> {
  const session = requireOperationsSession();
  applyMockTransition(applicationId, 'VEHICLE_SOURCING', session.name);
  revalidatePath('/dashboard/operations');
}

/**
 * Records the purchase receipt and moves VEHICLE_SOURCING -> PURCHASE_CONFIRMED
 * (PRD A.2.1, A.3 rule 1 — Markaba must own the vehicle before any lease/sale
 * agreement). Evidence-recording, not itself Sharia-critical (CLAUDE.md §2.1) —
 * the SSB gate is the separate PURCHASE_CONFIRMED -> CONTRACT_SIGNED step.
 */
export async function confirmPurchase(applicationId: string, formData: FormData): Promise<void> {
  const session = requireOperationsSession();
  const purchaseReceiptRef = String(formData.get('purchaseReceiptRef') ?? '').trim();
  if (!purchaseReceiptRef) {
    throw new Error('A purchase receipt reference is required to confirm a purchase.');
  }
  recordVehiclePurchase(applicationId, purchaseReceiptRef, session.name);
  revalidatePath('/dashboard/operations');
}
