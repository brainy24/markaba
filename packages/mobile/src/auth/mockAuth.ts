import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Mock auth only (CLAUDE.md §3 — "Auth screens (against mock auth)"). No real
 * BVN, liveness check, or credential verification happens here.
 */
const SESSION_KEY = 'markaba.mockSession';

export interface MockSession {
  phoneNumber: string;
  signedInAt: string;
}

export function isValidPhoneNumber(phoneNumber: string): boolean {
  return /^\+?\d{10,15}$/.test(phoneNumber.trim());
}

export async function mockSignIn(phoneNumber: string): Promise<MockSession> {
  if (!isValidPhoneNumber(phoneNumber)) {
    throw new Error('Enter a valid phone number to continue.');
  }
  const session: MockSession = {
    phoneNumber: phoneNumber.trim(),
    signedInAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function getSession(): Promise<MockSession | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MockSession;
  } catch {
    return null;
  }
}

export async function mockSignOut(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
}
