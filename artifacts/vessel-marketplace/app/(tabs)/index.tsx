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
import { NavigationMap } from '@/components/NavigationMap';
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
  const [selectedVesselId, setSelectedVesselId] = useState<number | null>(null);

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
  const selectedVessel =
    data?.find((vessel) => vessel.id === selectedVesselId) ?? data?.[0] ?? null;

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
      <FlatList<Vessel>
        data={data ?? []}
        keyExtractor={(v) => String(v.id)}
        testID="vessel-market-list"
        renderItem={({ item }) => (
          <VesselCard vessel={item} onPress={() => router.push(`/vessel/${item.id}`)} />
        )}
        ListHeaderComponent={
          <View style={[styles.header, { paddingTop: topInset + 10 }]}>
            <View style={styles.topRow}>
              <View style={[styles.brandMark, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <Feather name="anchor" size={18} color={colors.primary} />
              </View>
              <View style={styles.brandCopy}>
                <Text style={[styles.subtitle, { color: colors.primary }]}>ShipHub Charterer</Text>
                <Text style={[styles.title, { color: colors.foreground }]}>Find the next move.</Text>
              </View>
              <Pressable
                accessibilityLabel="Toggle vessel filters"
                accessibilityState={{ expanded: showFilters }}
                testID="toggle-vessel-filters"
                onPress={() => setShowFilters((value) => !value)}
                style={({ pressed }) => [
                  styles.filterToggle,
                  {
                    backgroundColor: showFilters ? colors.primary : colors.card,
                    borderColor: showFilters ? colors.primary : colors.border,
                    opacity: pressed ? 0.76 : 1,
                  },
                ]}
              >
                <Feather name="sliders" size={17} color={showFilters ? colors.primaryForeground : colors.primary} />
              </Pressable>
            </View>

            <Text style={[styles.routeCaption, { color: colors.mutedForeground }]}>
              Live availability across the routes that matter.
            </Text>

            <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="search" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.searchInput, { color: colors.foreground }]}
                placeholder="Search vessel, owner or route"
                placeholderTextColor={colors.mutedForeground}
                value={search}
                onChangeText={setSearch}
                returnKeyType="search"
                accessibilityLabel="Search vessels"
                testID="vessel-search"
              />
              {search ? (
                <Pressable accessibilityLabel="Clear vessel search" onPress={() => setSearch('')}>
                  <Feather name="x" size={16} color={colors.mutedForeground} />
                </Pressable>
              ) : null}
            </View>

            {showFilters ? (
              <View style={[styles.filtersSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>Vessel type</Text>
                <View style={styles.verticalChipList}>
                  {VESSEL_TYPE_FILTERS.map((item) => {
                    const selected = vesselType === item;
                    return (
                      <Pressable
                        key={item}
                        onPress={() => setVesselType(item)}
                        style={[
                          styles.chip,
                          styles.verticalChip,
                          {
                            backgroundColor: selected ? colors.primary : colors.muted,
                            borderColor: selected ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Text style={[styles.chipText, { color: selected ? colors.primaryForeground : colors.mutedForeground }]}>
                          {item}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Text style={[styles.filterLabel, { color: colors.mutedForeground, marginTop: 12 }]}>Availability</Text>
                <View style={styles.verticalChipList}>
                  {STATUSES.map((item) => {
                    const selected = status === item;
                    return (
                      <Pressable
                        key={item}
                        onPress={() => setStatus(item)}
                        style={[
                          styles.chip,
                          styles.verticalChip,
                          {
                            backgroundColor: selected ? colors.accent : colors.muted,
                            borderColor: selected ? colors.accent : colors.border,
                          },
                        ]}
                      >
                        <Text style={[styles.chipText, { color: selected ? colors.accentForeground : colors.mutedForeground }]}>
                          {STATUS_LABELS[item] ?? item}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            <NavigationMap
              vessels={data ?? []}
              selectedVesselId={selectedVessel?.id ?? null}
              onSelectVessel={(vessel) => setSelectedVesselId(vessel.id)}
              title="Live availability"
            />

            {selectedVessel ? (
              <Pressable
                accessibilityLabel={`Open details for ${selectedVessel.name}`}
                onPress={() => router.push(`/vessel/${selectedVessel.id}`)}
                style={({ pressed }) => [
                  styles.selectedPanel,
                  {
                    backgroundColor: colors.secondary,
                    borderColor: colors.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <View style={[styles.selectedIcon, { backgroundColor: selectedVessel.status === 'on_hire' ? colors.mapMarkerOnHire : colors.mapMarker }]}>
                  <Feather
                    name="anchor"
                    size={16}
                    color={selectedVessel.status === 'on_hire' ? colors.mapMarkerOnHireForeground : colors.mapMarkerForeground}
                  />
                </View>
                <View style={styles.selectedCopy}>
                  <Text numberOfLines={1} style={[styles.selectedName, { color: colors.foreground }]}>{selectedVessel.name}</Text>
                  <Text numberOfLines={1} style={[styles.selectedMeta, { color: colors.mutedForeground }]}>
                    {selectedVessel.vesselType} · {selectedVessel.tradingArea || 'Route details available'}
                  </Text>
                </View>
                <Feather name="arrow-up-right" size={17} color={colors.primary} />
              </Pressable>
            ) : null}

            <View style={[styles.statsStrip, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>{isLoading ? '—' : total}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Listings</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.statusAvailable }]}>{isLoading ? '—' : available}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Available</Text>
              </View>
              <View style={[styles.statItem, styles.statsUpdated]}>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Updated</Text>
                <Text style={[styles.updatedText, { color: colors.foreground }]}>Just now</Text>
              </View>
            </View>

            <View style={styles.listHeading}>
              <Text style={[styles.listTitle, { color: colors.foreground }]}>Vessels in view</Text>
              <Text style={[styles.listCount, { color: colors.mutedForeground }]}>{total} shown</Text>
            </View>
          </View>
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: (Platform.OS === 'web' ? 84 : insets.bottom + 80) + 16 },
        ]}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        ListEmptyComponent={renderEmpty()}
        showsVerticalScrollIndicator={false}
        scrollEnabled
      />
      {isLoading ? (
        <View style={[styles.loadingCenter, { backgroundColor: colors.background + 'A8' }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 14 },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandCopy: { flex: 1, marginLeft: 10 },
  routeCaption: { fontFamily: 'Inter_400Regular', fontSize: 13, marginBottom: 14 },
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
    marginTop: 14,
    marginBottom: 16,
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
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
  },
  searchInput: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 15 },
  filtersSection: { marginTop: 10, marginBottom: 12, padding: 12, borderWidth: 1, borderRadius: 16 },
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
  verticalChipList: { gap: 7 },
  verticalChip: { width: '100%', minHeight: 38, justifyContent: 'center' },
  selectedPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 16,
    padding: 11,
    marginTop: 12,
  },
  selectedIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  selectedCopy: { flex: 1 },
  selectedName: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  selectedMeta: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 2 },
  statsUpdated: { alignItems: 'flex-end', flex: 1.3 },
  updatedText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, marginTop: 2 },
  listHeading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 },
  listTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, letterSpacing: -0.25 },
  listCount: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  listContent: { paddingHorizontal: 16 },
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
