import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { getTranslations } from '../i18n';
import { fetchMyApplications, type ApplicationSummary } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export function DashboardScreen({ route }: Props) {
  const t = getTranslations('en');
  const { phoneNumber } = route.params;
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    fetchMyApplications(phoneNumber)
      .then((result) => {
        if (!cancelled) {
          setApplications(result);
          setStatus('ready');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [phoneNumber]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t.dashboard.title}</Text>
      {status === 'loading' && <Text testID="dashboard-loading">{t.common.loading}</Text>}
      {status === 'error' && <Text testID="dashboard-error">{t.common.error}</Text>}
      {status === 'ready' && applications.length === 0 && (
        <Text testID="dashboard-empty">{t.dashboard.empty}</Text>
      )}
      {status === 'ready' && applications.length > 0 && (
        <FlatList
          data={applications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.row} testID={`application-row-${item.id}`}>
              <Text style={styles.rowTitle}>{item.id}</Text>
              <Text>
                {t.dashboard.statusLabel}: {item.state}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  row: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  rowTitle: { fontWeight: '600' },
});
