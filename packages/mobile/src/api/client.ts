/**
 * Points at the Markaba API (`@markaba/api`). Local/sandbox only in this phase —
 * a later sprint should wire this through real per-environment config instead of
 * a hardcoded constant.
 */
const API_BASE_URL = 'http://localhost:3000';

export interface ApplicationSummary {
  id: string;
  state: string;
  financeType: string;
  requestedAmountNaira: number;
}

export async function fetchMyApplications(phoneNumber: string): Promise<ApplicationSummary[]> {
  const response = await fetch(
    `${API_BASE_URL}/applications?phoneNumber=${encodeURIComponent(phoneNumber)}`,
  );
  if (!response.ok) {
    throw new Error(`Failed to load applications (${response.status})`);
  }
  return (await response.json()) as ApplicationSummary[];
}
