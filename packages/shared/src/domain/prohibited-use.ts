/**
 * Vehicle-use screening (PRD A.6, Sharia rule 4 in PRD A.3). This is a
 * deterministic denylist lookup, not Sharia-interpretive judgment, so it is
 * explicitly not blocked by CLAUDE.md §2.1. A match must route to a
 * `ShariaComplianceQuery` for human review, never an auto-decline.
 *
 * Phase 1 ships this as a hardcoded list. It should become an admin-editable
 * data set in a later sprint — do not build that CRUD screen yet, just the field,
 * storage, and check (PRD A.6).
 */
export const PROHIBITED_VEHICLE_USES: readonly string[] = [
  'alcohol_distribution',
  'gambling_operations',
  'nightclub_transport',
  'interest_based_lending_collateral',
  'pork_products_distribution',
];

export function isProhibitedUse(declaredVehicleUse: string): boolean {
  return PROHIBITED_VEHICLE_USES.includes(declaredVehicleUse.trim().toLowerCase());
}
