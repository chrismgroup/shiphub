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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { api } from '@/lib/api';
import type { VesselNotification } from '@/lib/types';

const TYPE_ICONS: Record<string, string> = {
  enquiry_received: 'inbox',
  terms_updated: 'edit-2',
  party_confirmed: 'check-circle',
  charter_active: 'anchor',
  charter_declined: 'x-circle',
  charter_terminated: 'slash',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.notifications.list(),
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });

  const markAllMutation = useMutation({
    mutationFn: () => api.notifications.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => api.notifications.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unreadCount = data?.filter((n) => !n.read).length ?? 0;
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
        <View style={styles.titleRow}>
          <View style={styles.titleWrap}>
            <Text style={[styles.title, { color: colors.foreground }]}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          {unreadCount > 0 && (
            <Pressable
              onPress={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
              style={styles.markAllBtn}
            >
              <Text style={[styles.markAllText, { color: colors.accent }]}>
                Mark all read
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {isError && (
        <View style={styles.center}>
          <Feather name="alert-circle" size={32} color={colors.destructive} />
          <Text style={[{ color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>
            Failed to load notifications
          </Text>
          <Pressable onPress={() => refetch()} style={[styles.retryBtn, { borderColor: colors.border }]}>
            <Text style={{ color: colors.foreground, fontFamily: 'Inter_500Medium' }}>Retry</Text>
          </Pressable>
        </View>
      )}

      <FlatList<VesselNotification>
        data={data ?? []}
        keyExtractor={(n) => String(n.id)}
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
              <Feather name="bell" size={36} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                No notifications
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
                You're all caught up!
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item: n }) => (
          <Pressable
            onPress={() => {
              if (!n.read) markReadMutation.mutate(n.id);
            }}
            style={[
              styles.notifCard,
              {
                backgroundColor: n.read ? colors.card : colors.secondary,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: n.read ? colors.muted : colors.primary + '22' },
              ]}
            >
              <Feather
                name={(TYPE_ICONS[n.type] ?? 'bell') as any}
                size={18}
                color={n.read ? colors.mutedForeground : colors.primary}
              />
            </View>
            <View style={styles.notifBody}>
              <Text style={[styles.notifTitle, { color: colors.foreground }]}>
                {n.title}
              </Text>
              <Text style={[styles.notifMsg, { color: colors.mutedForeground }]} numberOfLines={2}>
                {n.message}
              </Text>
              <Text style={[styles.notifTime, { color: colors.mutedForeground }]}>
                {timeAgo(n.createdAt)}
              </Text>
            </View>
            {!n.read && (
              <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
            )}
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 24 },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 11 },
  markAllBtn: { padding: 4 },
  markAllText: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  retryBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  list: { padding: 16, gap: 10 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  emptySubtitle: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBody: { flex: 1, gap: 3 },
  notifTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  notifMsg: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  notifTime: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 2 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
});
