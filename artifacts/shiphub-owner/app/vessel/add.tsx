import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { api } from '@/lib/api';
import type { VesselFormData } from '@/lib/types';
import { VESSEL_TYPES } from '@/lib/types';

export default function AddVessel() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<VesselFormData>({ name: '', vesselType: VESSEL_TYPES[0] });
  const save = useMutation({
    mutationFn: () => api.vessels.create(form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['my-vessels'] }); router.replace('/fleet'); },
    onError: (error: Error) => Alert.alert('Could not save vessel', error.message),
  });
  const set = (key: keyof VesselFormData, value: string) => setForm((current) => ({ ...current, [key]: value }));

  return <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingTop: (Platform.OS === 'web' ? 67 : insets.top) + 12, paddingHorizontal: 16, paddingBottom: 40, gap: 16 }}>
    <View style={styles.header}><Pressable onPress={() => router.back()}><Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>Cancel</Text></Pressable><Text style={[styles.title, { color: colors.foreground }]}>New vessel</Text><Pressable testID="save-vessel" onPress={() => { if (!form.name.trim()) return Alert.alert('Missing name', 'Enter a vessel name.'); save.mutate(); }} disabled={save.isPending}>{save.isPending ? <ActivityIndicator color={colors.primary} /> : <Text style={{ color: colors.primary, fontFamily: 'Inter_700Bold' }}>Save</Text>}</Pressable></View>
    <Text style={[styles.intro, { color: colors.mutedForeground }]}>This listing will be visible to brokers and charterers in ShipHub.</Text>
    <Field colors={colors} label="Vessel name *" value={form.name} onChangeText={(value) => set('name', value)} placeholder="e.g. Arch Michail" />
    <Text style={[styles.label, { color: colors.mutedForeground }]}>Vessel type</Text>
    <View style={styles.types}>{VESSEL_TYPES.map((type) => <Pressable key={type} onPress={() => setForm((current) => ({ ...current, vesselType: type }))} style={[styles.chip, { borderColor: form.vesselType === type ? colors.primary : colors.border, backgroundColor: form.vesselType === type ? colors.primary : colors.card }]}><Text style={{ color: form.vesselType === type ? colors.primaryForeground : colors.foreground, fontFamily: 'Inter_500Medium', fontSize: 12 }}>{type}</Text></Pressable>)}</View>
    <Field colors={colors} label="IMO number" value={form.imoNumber ?? ''} onChangeText={(value) => set('imoNumber', value)} keyboardType="numeric" placeholder="Optional" />
    <Field colors={colors} label="Flag" value={form.flag ?? ''} onChangeText={(value) => set('flag', value)} placeholder="Optional" />
    <Field colors={colors} label="Trading area" value={form.tradingArea ?? ''} onChangeText={(value) => set('tradingArea', value)} placeholder="Optional" />
    <Field colors={colors} label="Description" value={form.description ?? ''} onChangeText={(value) => set('description', value)} placeholder="Optional" multiline />
  </ScrollView>;
}

function Field({ colors, label, multiline, ...props }: { colors: ReturnType<typeof useColors>; label: string; multiline?: boolean } & React.ComponentProps<typeof TextInput>) {
  return <View style={{ gap: 6 }}><Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text><TextInput {...props} multiline={multiline} placeholderTextColor={colors.mutedForeground} style={[styles.input, multiline && { height: 92, textAlignVertical: 'top' }, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} /></View>;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: 'Inter_700Bold', fontSize: 20 },
  intro: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 12, textTransform: 'uppercase' },
  input: { height: 49, borderWidth: 1, borderRadius: 10, paddingHorizontal: 13, fontFamily: 'Inter_400Regular', fontSize: 15 },
  types: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 11, paddingVertical: 8 },
});