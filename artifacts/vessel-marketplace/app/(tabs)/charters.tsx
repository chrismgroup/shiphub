import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBadge } from '@/components/StatusBadge';
import { useColors } from '@/hooks/useColors';
import { useCharterSocket } from '@/hooks/useCharterSocket';
import { api } from '@/lib/api';
import type { CharterParty } from '@/lib/types';

function formatDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function ChartersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['charter-parties'],
    queryFn: () => api.charters.list(),
  });

  // Live updates via WebSocket — invalidates the query whenever the server
  // pushes a charter change, so no polling needed.
  useCharterSocket();

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: topInset + 8, backgroundColor: colors.background },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Charters</Text>
      </View>

      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {isError && (
        <View style={styles.center}>
          <Feather name="alert-circle" size={32} color={colors.destructive} />
          <Text style={[styles.errorText, { color: colors.foreground }]}>
            Failed to load charters
          </Text>
          <Pressable onPress={() => refetch()} style={[styles.retryBtn, { borderColor: colors.border }]}>
            <Text style={{ color: colors.foreground, fontFamily: 'Inter_500Medium' }}>Retry</Text>
          </Pressable>
        </View>
      )}

      <FlatList<CharterParty>
        data={data ?? []}
        keyExtractor={(cp) => String(cp.id)}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={[
          styles.list,
          { paddingBottom: Platform.OS === 'web' ? 84 + 16 : insets.bottom + 96 },
        ]}
        ListEmptyComponent={
          !isLoading && !isError ? (
            <View style={styles.empty}>
              <Feather name="file-text" size={36} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                No charters yet
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
                Browse vessels to submit an enquiry
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item: cp }) => (
          <Pressable
            onPress={() => router.push(`/charter/${cp.id}`)}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.vesselName, { color: colors.foreground }]} numberOfLines={1}>
                {cp.vesselName ?? `Vessel #${cp.vesselId}`}
              </Text>
              <StatusBadge status={cp.status} size="sm" />
            </View>

            <View style={styles.cardBody}>
              {cp.rate ? (
                <View style={styles.row}>
                  <Feather name="dollar-sign" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.detail, { color: colors.foreground }]}>
                    {cp.rate} {cp.rateCurrency}
                    {cp.rateBasis ? ` / ${cp.rateBasis}` : ''}
                  </Text>
                </View>
              ) : null}

              {cp.laycanEarliest ? (
                <View style={styles.row}>
                  <Feather name="calendar" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.detail, { color: colors.foreground }]}>
                    {formatDate(cp.laycanEarliest)}
                    {cp.laycanLatest ? ` – ${formatDate(cp.laycanLatest)}` : ''}
                  </Text>
                </View>
              ) : null}

              {cp.durationDays ? (
                <View style={styles.row}>
                  <Feather name="clock" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.detail, { color: colors.foreground }]}>
                    {cp.durationDays} days
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.cardFooter}>
              <Text style={[styles.partyLabel, { color: colors.mutedForeground }]}>
                {cp.chartererName && `Charterer: ${cp.chartererName}`}
              </Text>
              <Text style={[styles.dateLabel, { color: colors.mutedForeground }]}>
                {formatDate(cp.updatedAt)}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: { fontFamily: 'Inter_700Bold', fontSize: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  errorText: { fontFamily: 'Inter_500Medium', fontSize: 15 },
  retryBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  list: { padding: 16, gap: 12 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  emptySubtitle: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
     shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  vesselName: { fontFamily: 'Inter_700Bold', fontSize: 15, flex: 1, marginRight: 8 },
  cardBody: { gap: 5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detail: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  partyLabel: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  dateLabel: { fontFamily: 'Inter_400Regular', fontSize: 12 },
});
