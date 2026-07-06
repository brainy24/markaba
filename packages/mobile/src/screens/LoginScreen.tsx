import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { getTranslations } from '../i18n';
import { mockSignIn } from '../auth/mockAuth';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const t = getTranslations('en');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    try {
      const session = await mockSignIn(phoneNumber);
      setError(null);
      navigation.replace('Dashboard', { phoneNumber: session.phoneNumber });
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t.login.title}</Text>
      <Text style={styles.notice}>{t.login.mockNotice}</Text>
      <TextInput
        testID="phone-input"
        style={styles.input}
        placeholder={t.login.phoneLabel}
        keyboardType="phone-pad"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
      />
      {error && (
        <Text style={styles.error} testID="login-error">
          {error}
        </Text>
      )}
      <TouchableOpacity style={styles.button} onPress={handleSubmit} testID="login-submit">
        <Text style={styles.buttonText}>{t.login.submit}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 22, fontWeight: '700' },
  notice: { fontSize: 13, color: '#888' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  error: { color: '#c0392b', fontSize: 13 },
  button: {
    marginTop: 12,
    backgroundColor: '#1f2a6d',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontWeight: '600' },
});
