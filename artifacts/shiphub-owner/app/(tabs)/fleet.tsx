import React from 'react';
import { ActivityIndicator, FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import type { Vessel } from '@/lib/types';
import { api } from '@/lib/api';

export default function Fleet() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const query = useQuery({ queryKey: ['my-vessels', user?.id], queryFn: api.vessels.list, enabled: !!user });
  const data = (query.data ?? []).filter((v) => user?.role === 'admin' || v.ownerId === user?.id);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: (Platform.OS === 'web' ? 67 : insets.top) + 16 }]}>
        <View><Text style={[styles.title, { color: colors.foreground }]}>Fleet</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{data.length} managed vessels</Text></View>
        <Pressable testID="add-vessel" accessibilityLabel="Add vessel" onPress={() => router.push('/vessel/add')}><Feather name="plus-circle" size={30} color={colors.primary} /></Pressable>
      </View>
      {query.isLoading ? <View style={styles.center}><ActivityIndicator color={colors.primary} /></View> : (
        <FlatList
          data={data}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: (Platform.OS === 'web' ? 84 : insets.bottom + 80) }}
          ListEmptyComponent={<Text style={[styles.empty, { color: colors.mutedForeground }]}>No vessels yet. Add your first ship to publish it to the marketplace.</Text>}
          renderItem={({ item }) => <VesselRow vessel={item} colors={colors} />}
        />
      )}
    </View>
  );
}

function VesselRow({ vessel, colors }: { vessel: Vessel; colors: ReturnType<typeof useColors> }) {
  return <Pressable onPress={() => router.push(`/vessel/edit/${vessel.id}`)} style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={[styles.icon, { backgroundColor: colors.secondary }]}><Feather name="anchor" size={20} color={colors.primary} /></View>
    <View style={{ flex: 1 }}><Text style={[styles.name, { color: colors.foreground }]}>{vessel.name}</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{vessel.vesselType}{vessel.flag ? ` · ${vessel.flag}` : ''}</Text></View>
    <Text style={[styles.status, { color: vessel.status === 'available' ? colors.primary : colors.mutedForeground }]}>{vessel.status.replace('_', ' ')}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: 'Inter_700Bold', fontSize: 27 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 3 },
  row: { padding: 13, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 11 },
  icon: { height: 44, width: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  status: { fontFamily: 'Inter_600SemiBold', fontSize: 12, textTransform: 'capitalize' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, textAlign: 'center', paddingTop: 60 },
});