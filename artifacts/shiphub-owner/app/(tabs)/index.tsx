import React from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { api } from '@/lib/api';

export default function Home() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const vessels = useQuery({ queryKey: ['my-vessels', user?.id], queryFn: api.vessels.list, enabled: !!user });
  const requests = useQuery({ queryKey: ['owner-charters', user?.id], queryFn: api.charters.list, enabled: !!user });
  const fleet = (vessels.data ?? []).filter((v) => user?.role === 'admin' || v.ownerId === user?.id);
  const openRequests = (requests.data ?? []).filter((x) => x.ownerId === user?.id && ['enquiry', 'negotiating'].includes(x.status));
  const top = (Platform.OS === 'web' ? 67 : insets.top) + 18;

  if (vessels.isLoading || requests.isLoading) {
    return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} /></View>;
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: top, paddingHorizontal: 16, paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 96, gap: 14 }}
    >
      <Text style={[styles.eyebrow, { color: colors.primary }]}>SHIPHUB OWNERS</Text>
      <View style={styles.headingRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>Good day, {user?.name.split(' ')[0] ?? 'Owner'}.</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Keep your fleet ready for the next charter.</Text>
        </View>
        <Pressable accessibilityLabel="Sign out" onPress={() => logout()} hitSlop={12}>
          <Feather name="log-out" size={20} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <View style={styles.metrics}>
        <Metric colors={colors} value={fleet.length} label="Fleet" />
        <Metric colors={colors} value={openRequests.length} label="Open" />
        <Metric colors={colors} value={fleet.filter((v) => v.status === 'on_hire').length} label="On hire" />
      </View>

      <Pressable
        testID="home-add-vessel"
        onPress={() => router.push('/vessel/add')}
        style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
      >
        <Feather name="plus" color={colors.primaryForeground} size={18} />
        <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Add vessel</Text>
      </Pressable>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your fleet</Text>
        <Pressable onPress={() => router.push('/fleet')}><Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>View all</Text></Pressable>
      </View>
      {fleet.slice(0, 3).map((vessel) => (
        <Pressable
          key={vessel.id}
          onPress={() => router.push(`/vessel/edit/${vessel.id}`)}
          style={[styles.vesselRow, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={[styles.vesselIcon, { backgroundColor: colors.secondary }]}><Feather name="anchor" color={colors.primary} size={19} /></View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.vesselName, { color: colors.foreground }]}>{vessel.name}</Text>
            <Text style={[styles.small, { color: colors.mutedForeground }]}>{vessel.vesselType}{vessel.flag ? ` · ${vessel.flag}` : ''}</Text>
          </View>
          <Text style={[styles.status, { color: vessel.status === 'available' ? colors.primary : colors.mutedForeground }]}>{vessel.status.replace('_', ' ')}</Text>
        </Pressable>
      ))}
      {!fleet.length && <Text style={[styles.empty, { color: colors.mutedForeground }]}>Your fleet is empty. Add your first vessel to publish it to brokers and charterers.</Text>}
    </ScrollView>
  );
}

function Metric({ colors, value, label }: { colors: ReturnType<typeof useColors>; value: number; label: string }) {
  return <View style={[styles.metric, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.metricValue, { color: colors.primary }]}>{value}</Text><Text style={[styles.small, { color: colors.mutedForeground }]}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.5 },
  headingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 27, letterSpacing: -0.5 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, marginTop: 5 },
  metrics: { flexDirection: 'row', gap: 8, marginVertical: 6 },
  metric: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 12 },
  metricValue: { fontFamily: 'Inter_700Bold', fontSize: 26 },
  primaryButton: { height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  primaryButtonText: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  vesselRow: { borderWidth: 1, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  vesselIcon: { height: 42, width: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  vesselName: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  small: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 3 },
  status: { fontFamily: 'Inter_600SemiBold', fontSize: 12, textTransform: 'capitalize' },
  empty: { textAlign: 'center', fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, paddingTop: 28 },
});
