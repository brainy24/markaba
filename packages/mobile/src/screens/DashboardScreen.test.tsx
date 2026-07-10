import React from 'react';
import { render } from '@testing-library/react-native';
import { DashboardScreen } from './DashboardScreen';
import { fetchMyApplications } from '../api/client';
import type { RootStackParamList } from '../navigation/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

jest.mock('../api/client');
const mockFetchMyApplications = fetchMyApplications as jest.MockedFunction<
  typeof fetchMyApplications
>;

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

function renderScreen(phoneNumber = '+2348000000001') {
  const route = { params: { phoneNumber } } as Props['route'];
  return render(<DashboardScreen navigation={{} as Props['navigation']} route={route} />);
}

describe('DashboardScreen', () => {
  it('shows the empty state when the customer has no applications', async () => {
    mockFetchMyApplications.mockResolvedValueOnce([]);
    const { findByTestId } = renderScreen();
    expect(await findByTestId('dashboard-empty')).toBeTruthy();
  });

  it('renders each application returned by the API', async () => {
    mockFetchMyApplications.mockResolvedValueOnce([
      {
        id: 'app-1',
        state: 'UNDERWRITING',
        product: 'IJARAH',
        financedAmount: 3_000_000,
      },
    ]);
    const { findByTestId } = renderScreen();
    expect(await findByTestId('application-row-app-1')).toBeTruthy();
  }, 15_000);

  it('shows an error state when the API call fails', async () => {
    mockFetchMyApplications.mockRejectedValueOnce(new Error('network down'));
    const { findByTestId } = renderScreen();
    expect(await findByTestId('dashboard-error')).toBeTruthy();
  });
});
