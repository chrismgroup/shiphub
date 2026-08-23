import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { api } from '@/lib/api';
import type { CharterFormData } from '@/lib/types';
import { CHARTER_CURRENCIES, RATE_BASES } from '@/lib/types';

export default function NewCharterScreen() {
  const { vesselId } = useLocalSearchParams<{ vesselId: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const [form, setForm] = useState<CharterFormData>({
    rateCurrency: 'USD',
    rateBasis: 'Per Day',
  });

  function update(key: keyof CharterFormData, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  const mutation = useMutation({
    mutationFn: (data: CharterFormData) =>
      api.charters.create(parseInt(vesselId ?? '0', 10), data),
    onSuccess: (cp) => {
      qc.invalidateQueries({ queryKey: ['charter-parties'] });
      router.replace(`/charter/${cp.id}`);
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  function handleSubmit() {
    mutation.mutate(form);
  }

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topInset + 10, backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Charter Enquiry</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Platform.OS === 'web' ? 34 + 20 : insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Rate */}
        <Section title="Rate" colors={colors}>
          <View style={styles.row3}>
            <View style={{ flex: 2 }}>
              <Field label="Rate Amount" colors={colors}>
                <StyledInput
                  value={form.rate ?? ''}
                  onChangeText={(v) => update('rate', v)}
                  placeholder="e.g. 5000"
                  keyboardType="numeric"
                  colors={colors}
                />
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Currency" colors={colors}>
                <View style={styles.selectWrap}>
                  {CHARTER_CURRENCIES.map((c) => (
                    <Pressable
                      key={c}
                      onPress={() => update('rateCurrency', c)}
                      style={[
                        styles.selectChip,
                        {
                          backgroundColor: form.rateCurrency === c ? colors.primary : colors.muted,
                          borderColor: form.rateCurrency === c ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.selectChipText,
                          { color: form.rateCurrency === c ? '#fff' : colors.foreground },
                        ]}
                      >
                        {c}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </Field>
            </View>
          </View>

          <Field label="Rate Basis" colors={colors}>
            <View style={styles.chipRow}>
              {RATE_BASES.map((b) => (
                <Pressable
                  key={b}
                  onPress={() => update('rateBasis', b)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: form.rateBasis === b ? colors.primary : colors.muted,
                      borderColor: form.rateBasis === b ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: form.rateBasis === b ? '#fff' : colors.foreground },
                    ]}
                  >
                    {b}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Field>
        </Section>

        {/* Laycan */}
        <Section title="Laycan Period" colors={colors}>
          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <Field label="Earliest (YYYY-MM-DD)" colors={colors}>
                <StyledInput
                  value={form.laycanEarliest ?? ''}
                  onChangeText={(v) => update('laycanEarliest', v)}
                  placeholder="2025-08-01"
                  colors={colors}
                />
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Latest (YYYY-MM-DD)" colors={colors}>
                <StyledInput
                  value={form.laycanLatest ?? ''}
                  onChangeText={(v) => update('laycanLatest', v)}
                  placeholder="2025-08-15"
                  colors={colors}
                />
              </Field>
            </View>
          </View>

          <Field label="Duration (days)" colors={colors}>
            <StyledInput
              value={form.durationDays ?? ''}
              onChangeText={(v) => update('durationDays', v)}
              placeholder="e.g. 30"
              keyboardType="numeric"
              colors={colors}
            />
          </Field>
        </Section>

        {/* Cargo */}
        <Section title="Cargo Details" colors={colors}>
          <Field label="Cargo Purpose" colors={colors}>
            <StyledInput
              value={form.cargoPurpose ?? ''}
              onChangeText={(v) => update('cargoPurpose', v)}
              placeholder="e.g. Petroleum products, grain, containers…"
              colors={colors}
            />
          </Field>
        </Section>

        {/* Terms */}
        <Section title="Terms & Notes" colors={colors}>
          <Field label="Additional Terms" colors={colors}>
            <StyledInput
              value={form.terms ?? ''}
              onChangeText={(v) => update('terms', v)}
              placeholder="Any special requirements or terms…"
              multiline
              numberOfLines={4}
              colors={colors}
            />
          </Field>
        </Section>

        {/* Submit */}
        <Pressable
          onPress={handleSubmit}
          disabled={mutation.isPending}
          style={({ pressed }) => [
            styles.submitBtn,
            { backgroundColor: colors.primary, opacity: pressed || mutation.isPending ? 0.8 : 1 },
          ]}
        >
          {mutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather name="send" size={18} color="#fff" />
              <Text style={styles.submitBtnText}>Submit Enquiry</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Section({
  title,
  children,
  colors,
}: {
  title: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{title.toUpperCase()}</Text>
      <View style={[styles.sectionBody, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

function Field({
  label,
  children,
  colors,
}: {
  label: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{label}</Text>
      {children}
    </View>
  );
}

function StyledInput({
  colors,
  multiline,
  numberOfLines,
  ...props
}: {
  colors: ReturnType<typeof useColors>;
  multiline?: boolean;
  numberOfLines?: number;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric';
}) {
  return (
    <TextInput
      style={[
        styles.input,
        {
          borderColor: colors.border,
          backgroundColor: colors.background,
          color: colors.foreground,
          height: multiline ? undefined : 46,
          textAlignVertical: multiline ? 'top' : 'center',
          paddingTop: multiline ? 12 : undefined,
          minHeight: multiline ? 88 : undefined,
        },
      ]}
      placeholderTextColor={colors.mutedForeground}
      multiline={multiline}
      numberOfLines={numberOfLines}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: { padding: 4 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 20, flex: 1 },
  content: { padding: 16, gap: 16 },
  section: { gap: 6 },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.8,
  },
  sectionBody: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  field: { gap: 6 },
  fieldLabel: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
  },
  row2: { flexDirection: 'row', gap: 10 },
  row3: { flexDirection: 'row', gap: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  selectWrap: { gap: 6 },
  selectChip: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  selectChipText: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 12,
    marginTop: 4,
  },
  submitBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#fff' },
});
