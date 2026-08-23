import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VesselCard } from '@/components/VesselCard';
import { useColors } from '@/hooks/useColors';
import { api } from '@/lib/api';
import type { Vessel } from '@/lib/types';
import { VESSEL_TYPES } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';

const STATUSES = ['All', 'available', 'on_hire', 'laid_up', 'decommissioned'];
const VESSEL_TYPE_FILTERS = ['All', ...VESSEL_TYPES];

const STATUS_LABELS: Record<string, string> = {
  All: 'All',
  available: 'Available',
  on_hire: 'On Hire',
  laid_up: 'Laid Up',
  decommissioned: 'Decommissioned',
};

export default function BrowseScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [vesselType, setVesselType] = useState('All');
  const [status, setStatus] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['vessels', search, vesselType, status],
    queryFn: () =>
      api.vessels.list({
        search: search || undefined,
        vesselType,
        status,
      }),
    enabled: !!user,
  });

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const total = data?.length ?? 0;
  const available = data?.filter((v: Vessel) => v.status === 'available').length ?? 0;

  function renderEmpty() {
    if (isLoading) return null;
    if (isError)
      return (
        <View style={styles.emptyState}>
          <Feather name="alert-circle" size={36} color={colors.destructive} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Failed to load vessels
          </Text>
          <Pressable
            onPress={() => refetch()}
            style={[styles.retryBtn, { borderColor: colors.primary, backgroundColor: colors.muted }]}
          >
            <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>
              Retry
            </Text>
          </Pressable>
        </View>
      );
    return (
      <View style={styles.emptyState}>
        <Feather name="anchor" size={36} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No vessels found</Text>
        <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
          Try adjusting your filters
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 8, backgroundColor: colors.background }]}>
        {/* Title row */}
        <View style={styles.titleRow}>
          <View>
            <Text style={[styles.subtitle, { color: colors.primary }]}>ShipHub</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>Vessel Market</Text>
          </View>
          <Pressable
            onPress={() => setShowFilters((f) => !f)}
            style={[
              styles.filterToggle,
              {
                backgroundColor: showFilters ? colors.primary : colors.muted,
                borderColor: showFilters ? colors.primary : colors.border,
              },
            ]}
          >
            <Feather
              name="sliders"
              size={16}
              color={showFilters ? '#fff' : colors.mutedForeground}
            />
          </Pressable>
        </View>

        {/* Stats strip */}
        {total > 0 && (
          <View style={[styles.statsStrip, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            {[
              [String(total), 'Listings'],
              [String(available), 'Available'],
            ].map(([val, lbl]) => (
              <View key={lbl} style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>{val}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{lbl}</Text>
              </View>
            ))}
            <View style={[styles.statItem, { flex: 2, alignItems: 'flex-end' as const }]}>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Updated just now</Text>
            </View>
          </View>
        )}

        {/* Search bar */}
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.muted, borderColor: colors.border },
          ]}
        >
          <Feather name="search" size={15} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search vessels…"
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search ? (
            <Pressable onPress={() => setSearch('')}>
              <Feather name="x" size={15} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
        </View>

        {/* Filters */}
        {showFilters && (
          <View style={styles.filtersSection}>
            <Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>Type</Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={VESSEL_TYPE_FILTERS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => setVesselType(item)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: vesselType === item ? colors.primary : colors.muted,
                      borderColor: vesselType === item ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: vesselType === item ? '#fff' : colors.mutedForeground },
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              )}
              contentContainerStyle={{ gap: 6, paddingVertical: 4 }}
            />
            <Text style={[styles.filterLabel, { color: colors.mutedForeground, marginTop: 8 }]}>
              Status
            </Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={STATUSES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => setStatus(item)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: status === item ? colors.accent : colors.muted,
                      borderColor: status === item ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: status === item ? '#fff' : colors.mutedForeground },
                    ]}
                  >
                    {STATUS_LABELS[item] ?? item}
                  </Text>
                </Pressable>
              )}
              contentContainerStyle={{ gap: 6, paddingVertical: 4 }}
            />
          </View>
        )}
      </View>

      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {/* List */}
      <FlatList<Vessel>
        data={data ?? []}
        keyExtractor={(v) => String(v.id)}
        renderItem={({ item }) => (
          <VesselCard vessel={item} onPress={() => router.push(`/vessel/${item.id}`)} />
        )}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: (Platform.OS === 'web' ? 84 : insets.bottom + 80) + 16 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={renderEmpty()}
        showsVerticalScrollIndicator={false}
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 26,
    letterSpacing: -0.8,
    lineHeight: 30,
  },
  filterToggle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'flex-start',
  },
  statValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    lineHeight: 20,
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 15 },
  filtersSection: { marginTop: 8 },
  filterLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  chipText: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  listContent: { paddingHorizontal: 16, paddingTop: 12 },
  loadingCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 10,
  },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  emptySubtitle: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  retryBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginTop: 4,
  },
});
