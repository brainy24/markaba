/** Read-only mock data (CLAUDE.md §3 — "read-only mock data"). No real customer PII. */
export interface MockApplicationRow {
  id: string;
  customerName: string;
  financeType: 'IJARAH' | 'MURABAHA';
  requestedAmountNaira: number;
  state: string;
  submittedAt: string;
}

export const MOCK_APPLICATIONS: readonly MockApplicationRow[] = [
  {
    id: 'APP-1001',
    customerName: 'Amina Yusuf',
    financeType: 'IJARAH',
    requestedAmountNaira: 4_200_000,
    state: 'UNDERWRITING',
    submittedAt: '2026-06-28',
  },
  {
    id: 'APP-1002',
    customerName: 'Chidi Okafor',
    financeType: 'MURABAHA',
    requestedAmountNaira: 3_100_000,
    state: 'KYC_PENDING',
    submittedAt: '2026-06-30',
  },
  {
    id: 'APP-1003',
    customerName: 'Fatima Bello',
    financeType: 'IJARAH',
    requestedAmountNaira: 5_000_000,
    state: 'APPROVED',
    submittedAt: '2026-07-01',
  },
  {
    id: 'APP-1004',
    customerName: 'Tunde Adebayo',
    financeType: 'IJARAH',
    requestedAmountNaira: 2_800_000,
    state: 'REFERRED',
    submittedAt: '2026-07-02',
  },
  {
    id: 'APP-1005',
    customerName: 'Ngozi Eze',
    financeType: 'MURABAHA',
    requestedAmountNaira: 3_600_000,
    state: 'VEHICLE_SOURCING',
    submittedAt: '2026-07-03',
  },
];
