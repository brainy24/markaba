import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { getTranslations } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export function OnboardingScreen({ navigation }: Props) {
  const t = getTranslations('en');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t.onboarding.title}</Text>
      <Text style={styles.subtitle}>{t.onboarding.subtitle}</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Login')}
        testID="get-started-button"
      >
        <Text style={styles.buttonText}>{t.onboarding.getStarted}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 15, color: '#555' },
  button: {
    marginTop: 24,
    backgroundColor: '#1f2a6d',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontWeight: '600' },
});
