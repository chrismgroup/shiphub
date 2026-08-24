import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { api } from '@/lib/api';
import type { VesselFormData, VesselStatus } from '@/lib/types';
import { VESSEL_STATUSES, VESSEL_TYPES } from '@/lib/types';

export default function EditVessel() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const vessel = useQuery({ queryKey: ['vessel', id], queryFn: () => api.vessels.get(Number(id)), enabled: !!id });
  const [form, setForm] = useState<VesselFormData | null>(null);
  const current = form ?? (vessel.data ? { name: vessel.data.name, vesselType: vessel.data.vesselType, imoNumber: vessel.data.imoNumber ?? '', flag: vessel.data.flag ?? '', tradingArea: vessel.data.tradingArea ?? '', description: vessel.data.description ?? '', status: vessel.data.status } : null);
  const save = useMutation({ mutationFn: () => api.vessels.update(Number(id), current!), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vessel', id] }); queryClient.invalidateQueries({ queryKey: ['my-vessels'] }); router.back(); }, onError: (error: Error) => Alert.alert('Could not save changes', error.message) });
  const remove = useMutation({ mutationFn: () => api.vessels.delete(Number(id)), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['my-vessels'] }); router.replace('/fleet'); }, onError: (error: Error) => Alert.alert('Could not delete vessel', error.message) });
  if (vessel.isLoading || !current) return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} /></View>;
  if (user?.role !== 'admin' && vessel.data?.ownerId !== user?.id) return <View style={[styles.center, { backgroundColor: colors.background }]}><Text style={{ color: colors.foreground }}>You cannot manage this vessel.</Text></View>;
  const set = (key: keyof VesselFormData, value: string) => setForm((previous) => ({ ...(previous ?? current), [key]: value }));
  const confirmDelete = () => {
    const message = `This removes ${current.name} from the marketplace. This cannot be undone.`;
    if (Platform.OS === 'web') { if (globalThis.confirm(message)) remove.mutate(); return; }
    Alert.alert('Delete vessel?', message, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete vessel', style: 'destructive', onPress: () => remove.mutate() }]);
  };
  return <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingTop: (Platform.OS === 'web' ? 67 : insets.top) + 12, paddingHorizontal: 16, paddingBottom: 40, gap: 15 }}>
    <View style={styles.header}><Pressable onPress={() => router.back()}><Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>Back</Text></Pressable><Text style={[styles.title, { color: colors.foreground }]}>Edit vessel</Text><Pressable onPress={() => save.mutate()} disabled={save.isPending}>{save.isPending ? <ActivityIndicator color={colors.primary} /> : <Text style={{ color: colors.primary, fontFamily: 'Inter_700Bold' }}>Save</Text>}</Pressable></View>
    <Field colors={colors} label="Vessel name" value={current.name} onChangeText={(value) => set('name', value)} />
    <Text style={[styles.label, { color: colors.mutedForeground }]}>Vessel type</Text>
    <View style={styles.types}>{VESSEL_TYPES.map((type) => <Pressable key={type} onPress={() => set('vesselType', type)} style={[styles.chip, { borderColor: current.vesselType === type ? colors.primary : colors.border, backgroundColor: current.vesselType === type ? colors.primary : colors.card }]}><Text style={{ color: current.vesselType === type ? colors.primaryForeground : colors.foreground, fontFamily: 'Inter_500Medium', fontSize: 12 }}>{type}</Text></Pressable>)}</View>
    <Field colors={colors} label="IMO number" value={current.imoNumber ?? ''} onChangeText={(value) => set('imoNumber', value)} />
    <Field colors={colors} label="Flag" value={current.flag ?? ''} onChangeText={(value) => set('flag', value)} />
    <Field colors={colors} label="Trading area" value={current.tradingArea ?? ''} onChangeText={(value) => set('tradingArea', value)} />
    <Field colors={colors} label="Description" value={current.description ?? ''} onChangeText={(value) => set('description', value)} multiline />
    <Text style={[styles.label, { color: colors.mutedForeground }]}>Listing status</Text>
    <View style={styles.types}>{VESSEL_STATUSES.map((status) => <Pressable key={status} onPress={() => setForm((previous) => ({ ...(previous ?? current), status }))} style={[styles.chip, { borderColor: current.status === status ? colors.primary : colors.border, backgroundColor: current.status === status ? colors.primary : colors.card }]}><Text style={{ color: current.status === status ? colors.primaryForeground : colors.foreground, fontFamily: 'Inter_500Medium', fontSize: 12 }}>{status.replace('_', ' ')}</Text></Pressable>)}</View>
    <Pressable testID="delete-vessel" onPress={confirmDelete} disabled={remove.isPending} style={[styles.delete, { borderColor: colors.destructive, opacity: remove.isPending ? 0.6 : 1 }]}><Text style={{ color: colors.destructive, fontFamily: 'Inter_700Bold' }}>{remove.isPending ? 'Deleting…' : 'Delete vessel from marketplace'}</Text></Pressable>
  </ScrollView>;
}

function Field({ colors, label, multiline, ...props }: { colors: ReturnType<typeof useColors>; label: string; multiline?: boolean } & React.ComponentProps<typeof TextInput>) {
  return <View style={{ gap: 6 }}><Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text><TextInput {...props} multiline={multiline} placeholderTextColor={colors.mutedForeground} style={[styles.input, multiline && { height: 92, textAlignVertical: 'top' }, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} /></View>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: 'Inter_700Bold', fontSize: 20 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 12, textTransform: 'uppercase' },
  input: { height: 49, borderWidth: 1, borderRadius: 10, paddingHorizontal: 13, fontFamily: 'Inter_400Regular', fontSize: 15 },
  types: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 11, paddingVertical: 8 },
  delete: { minHeight: 48, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
});