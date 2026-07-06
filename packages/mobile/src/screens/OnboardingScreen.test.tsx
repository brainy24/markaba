import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { OnboardingScreen } from './OnboardingScreen';
import type { RootStackParamList } from '../navigation/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

function renderScreen() {
  const navigation = { navigate: jest.fn() } as unknown as Props['navigation'];
  const utils = render(
    <OnboardingScreen navigation={navigation} route={{} as Props['route']} />,
  );
  return { ...utils, navigation };
}

describe('OnboardingScreen', () => {
  it('renders the welcome copy', () => {
    const { getByText } = renderScreen();
    expect(getByText('Welcome to Markaba')).toBeTruthy();
  });

  it('navigates to Login when "Get started" is pressed', () => {
    const { getByTestId, navigation } = renderScreen();
    fireEvent.press(getByTestId('get-started-button'));
    expect(navigation.navigate).toHaveBeenCalledWith('Login');
  });
});
