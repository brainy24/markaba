import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { LoginScreen } from './LoginScreen';
import type { RootStackParamList } from '../navigation/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

function renderScreen() {
  const navigation = { replace: jest.fn() } as unknown as Props['navigation'];
  const utils = render(<LoginScreen navigation={navigation} route={{} as Props['route']} />);
  return { ...utils, navigation };
}

describe('LoginScreen', () => {
  it('signs in and navigates to Dashboard for a valid phone number', async () => {
    const { getByTestId, navigation } = renderScreen();

    fireEvent.changeText(getByTestId('phone-input'), '+2348000000001');
    fireEvent.press(getByTestId('login-submit'));

    await waitFor(() =>
      expect(navigation.replace).toHaveBeenCalledWith('Dashboard', {
        phoneNumber: '+2348000000001',
      }),
    );
  }, 15_000);

  it('shows an error and does not navigate for an invalid phone number', async () => {
    const { getByTestId, navigation, findByTestId } = renderScreen();

    fireEvent.changeText(getByTestId('phone-input'), 'not-a-phone');
    fireEvent.press(getByTestId('login-submit'));

    expect(await findByTestId('login-error')).toBeTruthy();
    expect(navigation.replace).not.toHaveBeenCalled();
  });
});
