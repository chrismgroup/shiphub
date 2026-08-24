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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { DatePickerField } from '@/components/DatePickerField';
import { useCharterSocket } from '@/hooks/useCharterSocket';
import { api } from '@/lib/api';
import type { CharterFormData, CharterParty } from '@/lib/types';

function fmt(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function InfoRow({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

export default function CharterDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const qc = useQueryClient();
  const charterId = parseInt(id ?? '0', 10);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<CharterFormData>({});

  const { data: cp, isLoading, isError, refetch } = useQuery({
    queryKey: ['charter', charterId],
    queryFn: () => api.charters.get(charterId),
    enabled: charterId > 0,
  });

  // Live updates via WebSocket — invalidates this charter whenever the server
  // pushes an update for it, so no polling needed.
  useCharterSocket(charterId);

  useFocusEffect(
    React.useCallback(() => {
      if (charterId > 0) refetch();
    }, [charterId, refetch]),
  );

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['charter', charterId] });
    qc.invalidateQueries({ queryKey: ['charter-parties'] });
  }

  const confirmMutation = useMutation({
    mutationFn: () => api.charters.confirm(charterId),
    onSuccess: invalidate,
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const declineMutation = useMutation({
    mutationFn: () => api.charters.decline(charterId),
    onSuccess: invalidate,
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const terminateMutation = useMutation({
    mutationFn: () => api.charters.terminate(charterId),
    onSuccess: invalidate,
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const activateMutation = useMutation({
    mutationFn: () => api.charters.activate(charterId),
    onSuccess: invalidate,
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (data: CharterFormData) => api.charters.update(charterId, data),
    onSuccess: () => {
      invalidate();
      setEditing(false);
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  function startEdit(cp: CharterParty) {
    setEditForm({
      rate: cp.rate ?? '',
      rateCurrency: cp.rateCurrency,
      rateBasis: cp.rateBasis ?? '',
      laycanEarliest: cp.laycanEarliest
        ? new Date(cp.laycanEarliest).toISOString().slice(0, 10)
        : '',
      laycanLatest: cp.laycanLatest
        ? new Date(cp.laycanLatest).toISOString().slice(0, 10)
        : '',
      durationDays: cp.durationDays ? String(cp.durationDays) : '',
      cargoPurpose: cp.cargoPurpose ?? '',
      terms: cp.terms ?? '',
    });
    setEditing(true);
  }

  function confirmAction(title: string, msg: string, action: () => void) {
    Alert.alert(title, msg, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', style: 'destructive', onPress: action },
    ]);
  }

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError || !cp) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[{ color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>Charter not found</Text>
        <Pressable onPress={() => router.back()} style={[styles.retryBtn, { borderColor: colors.border }]}>
          <Text style={{ color: colors.foreground }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const isOwner = user?.id === cp.ownerId || user?.role === 'admin';
  const isCharterer = user?.id === cp.chartererId;
  const isOpen = ['enquiry', 'negotiating'].includes(cp.status);
  const canEdit = (isOwner || isCharterer) && isOpen;
  const canConfirm =
    isOpen &&
    ((isOwner && !cp.ownerConfirmedAt) ||
      (isCharterer && !!cp.ownerConfirmedAt && !cp.chartererConfirmedAt));
  const canDecline = (isOwner || isCharterer) && ['enquiry', 'negotiating'].includes(cp.status);
  const canActivate = isOwner && cp.status === 'confirmed';
  const canTerminate = isOwner && cp.status === 'active';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: topInset + 10, backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerMid}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
            {cp.vesselName ?? `Charter #${cp.id}`}
          </Text>
          <StatusBadge status={cp.status} size="sm" />
        </View>
        {canEdit && !editing && (
          <Pressable onPress={() => startEdit(cp)} style={styles.editBtn}>
            <Feather name="edit-2" size={18} color={colors.accent} />
          </Pressable>
        )}
        {editing && (
          <Pressable onPress={() => setEditing(false)} style={styles.editBtn}>
            <Feather name="x" size={20} color={colors.foreground} />
          </Pressable>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Platform.OS === 'web' ? 34 + 20 : insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {editing ? (
          <EditForm
            form={editForm}
            setForm={setEditForm}
            colors={colors}
            onSave={() => updateMutation.mutate(editForm)}
            saving={updateMutation.isPending}
          />
        ) : (
          <>
            {/* Parties */}
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Parties</Text>
              <InfoRow label="Charterer" value={cp.chartererName ?? `User #${cp.chartererId}`} colors={colors} />
              <InfoRow label="Owner" value={cp.ownerName ?? `User #${cp.ownerId}`} colors={colors} />
            </View>

            {/* Charter terms */}
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Terms</Text>
              {cp.rate && (
                <InfoRow
                  label="Rate"
                  value={`${cp.rate} ${cp.rateCurrency}${cp.rateBasis ? ` / ${cp.rateBasis}` : ''}`}
                  colors={colors}
                />
              )}
              {cp.laycanEarliest && (
                <InfoRow label="Laycan Earliest" value={fmt(cp.laycanEarliest)} colors={colors} />
              )}
              {cp.laycanLatest && (
                <InfoRow label="Laycan Latest" value={fmt(cp.laycanLatest)} colors={colors} />
              )}
              {cp.durationDays && (
                <InfoRow label="Duration" value={`${cp.durationDays} days`} colors={colors} />
              )}
              {cp.cargoPurpose && (
                <InfoRow label="Cargo" value={cp.cargoPurpose} colors={colors} />
              )}
              {cp.terms && (
                <View style={styles.termsWrap}>
                  <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Additional Terms</Text>
                  <Text style={[styles.termsText, { color: colors.foreground }]}>{cp.terms}</Text>
                </View>
              )}
            </View>

            {/* Hire info */}
            {(cp.hireStart || cp.hireEnd) && (
              <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Hire Period</Text>
                {cp.hireStart && <InfoRow label="Start" value={fmt(cp.hireStart)} colors={colors} />}
                {cp.hireEnd && <InfoRow label="End" value={fmt(cp.hireEnd)} colors={colors} />}
              </View>
            )}

            {/* Confirmation status */}
            {cp.status === 'enquiry' && (
              <View style={[styles.confirmStatus, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <Feather name="send" size={14} color={colors.accent} />
                <Text style={[styles.confirmText, { color: colors.foreground }]}>
                  {isOwner
                    ? 'New enquiry received. Review the terms and confirm or decline this request.'
                    : 'Enquiry sent to the ship owner. Waiting for the owner to review and respond.'}
                </Text>
              </View>
            )}
            {cp.status === 'negotiating' && (
              <View style={[styles.confirmStatus, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <Feather name="info" size={14} color={colors.accent} />
                <Text style={[styles.confirmText, { color: colors.foreground }]}>
                  {isCharterer && !cp.ownerConfirmedAt
                    ? 'Waiting for the ship owner to review and respond.'
                    : `Owner confirmed: ${cp.ownerConfirmedAt ? '✓' : 'Pending'}  Charterer confirmed: ${
                        cp.chartererConfirmedAt ? '✓' : 'Pending'
                      }`}
                </Text>
              </View>
            )}
            {cp.status === 'confirmed' && (
              <View style={[styles.confirmStatus, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <Feather name="check-circle" size={14} color={colors.statusActive} />
                <Text style={[styles.confirmText, { color: colors.foreground }]}>
                  Both parties confirmed the terms. {isOwner ? 'You can now start the hire.' : 'Waiting for the owner to start the hire.'}
                </Text>
              </View>
            )}

            {/* Actions */}
            {(canConfirm || canDecline || canActivate || canTerminate) && (
              <View style={styles.actions}>
                {canConfirm && (
                  <ActionBtn
                    icon="check"
                    label="Confirm"
                    color={colors.statusActive}
                    bg={colors.statusActiveBg}
                    loading={confirmMutation.isPending}
                    onPress={() =>
                      confirmAction('Confirm Charter', 'Confirm your acceptance of these terms?', () =>
                        confirmMutation.mutate(),
                      )
                    }
                  />
                )}
                {canDecline && (
                  <ActionBtn
                    icon="x"
                    label="Decline"
                    color={colors.statusDeclined}
                    bg={colors.statusDeclinedBg}
                    loading={declineMutation.isPending}
                    onPress={() =>
                      confirmAction('Decline Charter', 'Decline this charter enquiry?', () =>
                        declineMutation.mutate(),
                      )
                    }
                  />
                )}
                {canActivate && (
                  <ActionBtn
                    icon="play"
                    label="Start Hire"
                    color={colors.statusActive}
                    bg={colors.statusActiveBg}
                    loading={activateMutation.isPending}
                    onPress={() =>
                      confirmAction('Start Hire', 'Activate this confirmed charter and mark the vessel as on hire?', () =>
                        activateMutation.mutate(),
                      )
                    }
                  />
                )}
                {canTerminate && (
                  <ActionBtn
                    icon="slash"
                    label="Terminate"
                    color={colors.statusTerminated}
                    bg={colors.statusTerminatedBg}
                    loading={terminateMutation.isPending}
                    onPress={() =>
                      confirmAction('Terminate Charter', 'Terminate this active charter?', () =>
                        terminateMutation.mutate(),
                      )
                    }
                  />
                )}
              </View>
            )}

            <View style={styles.timestamps}>
              <Text style={[styles.ts, { color: colors.mutedForeground }]}>
                Created {fmt(cp.createdAt)}
              </Text>
              <Text style={[styles.ts, { color: colors.mutedForeground }]}>
                Updated {fmt(cp.updatedAt)}
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function ActionBtn({
  icon,
  label,
  color,
  bg,
  loading,
  onPress,
}: {
  icon: string;
  label: string;
  color: string;
  bg: string;
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.actionBtn,
        { backgroundColor: bg, opacity: pressed || loading ? 0.8 : 1 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} size="small" />
      ) : (
        <Feather name={icon as any} size={18} color={color} />
      )}
      <Text style={[styles.actionBtnText, { color }]}>{label}</Text>
    </Pressable>
  );
}

function EditForm({
  form,
  setForm,
  colors,
  onSave,
  saving,
}: {
  form: CharterFormData;
  setForm: React.Dispatch<React.SetStateAction<CharterFormData>>;
  colors: ReturnType<typeof useColors>;
  onSave: () => void;
  saving: boolean;
}) {
  function update(key: keyof CharterFormData, val: string) {
    setForm((f) => {
      const next = { ...f, [key]: val };
      if (key === 'laycanEarliest' && next.laycanLatest && next.laycanLatest < val) {
        next.laycanLatest = undefined;
      }
      return next;
    });
  }

  return (
    <View style={styles.editFormWrap}>
      <Text style={[styles.editTitle, { color: colors.foreground }]}>Update Terms</Text>

      {([
        ['Rate', 'rate', 'numeric'],
        ['Rate Currency', 'rateCurrency', 'default'],
         ['Rate Basis', 'rateBasis', 'default'],
        ['Duration (days)', 'durationDays', 'numeric'],
        ['Cargo Purpose', 'cargoPurpose', 'default'],
      ] as [string, keyof CharterFormData, 'default' | 'numeric'][]).map(([label, key, kb]) => (
        <View key={key} style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{label}</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground }]}
            value={form[key] ?? ''}
            onChangeText={(v) => update(key, v)}
            keyboardType={kb}
            placeholderTextColor={colors.mutedForeground}
          />
        </View>
      ))}

      <View style={styles.dateStack}>
        <DatePickerField
          label="Earliest laycan"
          value={form.laycanEarliest}
          onChange={(value) => update('laycanEarliest', value)}
          testID="edit-laycan-earliest"
        />
        <DatePickerField
          label="Latest laycan"
          value={form.laycanLatest}
          minimumDate={form.laycanEarliest}
          onChange={(value) => update('laycanLatest', value)}
          testID="edit-laycan-latest"
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Additional Terms</Text>
        <TextInput
          style={[
            styles.input,
            styles.textarea,
            { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground },
          ]}
          value={form.terms ?? ''}
          onChangeText={(v) => update('terms', v)}
          multiline
          numberOfLines={4}
          placeholderTextColor={colors.mutedForeground}
          textAlignVertical="top"
        />
      </View>

      <Pressable
        onPress={onSave}
        disabled={saving}
        style={({ pressed }) => [
          styles.saveBtn,
          { backgroundColor: colors.primary, opacity: pressed || saving ? 0.8 : 1 },
        ]}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveBtnText}>Save Changes</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  retryBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  backBtn: { padding: 4 },
  headerMid: { flex: 1, gap: 4 },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 17 },
  editBtn: { padding: 4 },
  content: { padding: 16, gap: 14 },
  section: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  sectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15, marginBottom: 4 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  infoLabel: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  infoValue: { fontFamily: 'Inter_500Medium', fontSize: 13, flex: 1, textAlign: 'right' },
  termsWrap: { gap: 4 },
  termsText: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 },
  confirmStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  confirmText: { fontFamily: 'Inter_400Regular', fontSize: 13, flex: 1 },
  actions: { gap: 10 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 12,
  },
  actionBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  timestamps: { gap: 4, alignItems: 'center' },
  ts: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  editFormWrap: { gap: 12 },
  editTitle: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  field: { gap: 6 },
  dateStack: { gap: 12 },
  fieldLabel: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 46,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
  },
  textarea: { height: 88, paddingTop: 12 },
  saveBtn: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#fff' },
});
