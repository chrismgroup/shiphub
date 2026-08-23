import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { api, vesselPhotoUrl } from '@/lib/api';
import type { VesselPhoto } from '@/lib/types';

function formatSpec(label: string, value: string | number | null | undefined, unit = '') {
  if (!value) return null;
  return { label, value: `${Number(value).toLocaleString()}${unit}` };
}

export default function VesselDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [photoIndex, setPhotoIndex] = useState(0);

  const vesselId = parseInt(id ?? '0', 10);

  const { data: vessel, isLoading, isError } = useQuery({
    queryKey: ['vessel', vesselId],
    queryFn: () => api.vessels.get(vesselId),
    enabled: !isNaN(vesselId) && vesselId > 0,
  });

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError || !vessel) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="alert-circle" size={32} color={colors.destructive} />
        <Text style={[styles.errorText, { color: colors.foreground }]}>Vessel not found</Text>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { borderColor: colors.border }]}>
          <Text style={{ color: colors.foreground, fontFamily: 'Inter_500Medium' }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const canCharter =
    user &&
    vessel.status === 'available' &&
    user.id !== vessel.ownerId &&
    ['client', 'broker'].includes(user.role);

  const photos: VesselPhoto[] = vessel.photos ?? [];
  const currentPhoto = photos[photoIndex];

  const specs = [
    formatSpec('DWT', vessel.dwt, ' MT'),
    formatSpec('GRT', vessel.grt, ' GT'),
    formatSpec('LOA', vessel.loa, ' m'),
    formatSpec('Beam', vessel.beam, ' m'),
    formatSpec('Draft', vessel.draft, ' m'),
    vessel.yearBuilt ? { label: 'Built', value: String(vessel.yearBuilt) } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Photo */}
        <View style={[styles.photoWrap, { backgroundColor: colors.muted }]}>
          {currentPhoto ? (
            <Image
              source={{ uri: vesselPhotoUrl(currentPhoto.objectPath) }}
              style={styles.photo}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.photoPlaceholder, { backgroundColor: colors.secondary }]}>
              <Feather name="anchor" size={48} color={colors.primary} style={{ opacity: 0.4 }} />
            </View>
          )}

          {/* Nav bar overlay */}
          <View style={[styles.navBar, { paddingTop: topInset + 8 }]}>
            <Pressable
              onPress={() => router.back()}
              style={[styles.navBtn, { backgroundColor: '#00000055' }]}
            >
              <Feather name="arrow-left" size={20} color="#fff" />
            </Pressable>
          </View>

          {/* Photo dots */}
          {photos.length > 1 && (
            <View style={styles.photoDots}>
              {photos.map((_, i) => (
                <Pressable
                  key={i}
                  onPress={() => setPhotoIndex(i)}
                  style={[
                    styles.dot,
                    { backgroundColor: i === photoIndex ? '#fff' : '#ffffff88' },
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.vesselHeader}>
            <View style={styles.nameRow}>
              <Text style={[styles.vesselName, { color: colors.foreground }]}>
                {vessel.name}
              </Text>
              <StatusBadge status={vessel.status} />
            </View>
            <Text style={[styles.vesselType, { color: colors.accent }]}>
              {vessel.vesselType}
              {vessel.flag ? ` · ${vessel.flag}` : ''}
            </Text>
            {vessel.imoNumber ? (
              <Text style={[styles.imo, { color: colors.mutedForeground }]}>
                IMO {vessel.imoNumber}
              </Text>
            ) : null}
          </View>

          {/* Specs */}
          {specs.length > 0 && (
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Specifications</Text>
              <View style={styles.specsGrid}>
                {specs.map((s) => (
                  <View key={s.label} style={styles.specCell}>
                    <Text style={[styles.specLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
                    <Text style={[styles.specValue, { color: colors.foreground }]}>{s.value}</Text>
                  </View>
                ))}
              </View>
              {vessel.classificationSociety ? (
                <View style={[styles.metaRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>Class</Text>
                  <Text style={[styles.metaValue, { color: colors.foreground }]}>
                    {vessel.classificationSociety}
                  </Text>
                </View>
              ) : null}
              {vessel.tradingArea ? (
                <View style={[styles.metaRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>
                    Trading Area
                  </Text>
                  <Text style={[styles.metaValue, { color: colors.foreground }]}>
                    {vessel.tradingArea}
                  </Text>
                </View>
              ) : null}
            </View>
          )}

          {/* Description */}
          {vessel.description ? (
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Description</Text>
              <Text style={[styles.description, { color: colors.foreground }]}>
                {vessel.description}
              </Text>
            </View>
          ) : null}

          {/* Owner */}
          {vessel.ownerName ? (
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Owner</Text>
              <View style={styles.ownerRow}>
                <View style={[styles.ownerAvatar, { backgroundColor: colors.primary }]}>
                  <Text style={styles.ownerAvatarText}>
                    {vessel.ownerName.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.ownerName, { color: colors.foreground }]}>
                  {vessel.ownerName}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Contacts (only if logged in) */}
          {user && vessel.contacts && vessel.contacts.length > 0 ? (
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Contacts</Text>
              {vessel.contacts.map((c) => (
                <View
                  key={c.id}
                  style={[styles.contactRow, { borderTopColor: colors.border }]}
                >
                  <Text style={[styles.contactName, { color: colors.foreground }]}>
                    {c.contactName}
                  </Text>
                  {c.phone ? (
                    <Text style={[styles.contactDetail, { color: colors.mutedForeground }]}>
                      📞 {c.phone}
                    </Text>
                  ) : null}
                  {c.email ? (
                    <Text style={[styles.contactDetail, { color: colors.mutedForeground }]}>
                      ✉️ {c.email}
                    </Text>
                  ) : null}
                  {c.address ? (
                    <Text style={[styles.contactDetail, { color: colors.mutedForeground }]}>
                      📍 {c.address}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}

          <View style={{ height: Platform.OS === 'web' ? 84 + 100 : insets.bottom + 100 }} />
        </View>
      </ScrollView>

      {/* Charter CTA */}
      {canCharter && (
        <View
          style={[
            styles.ctaBar,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 8,
            },
          ]}
        >
          <Pressable
            onPress={() => router.push(`/charter/new/${vessel.id}`)}
            style={({ pressed }) => [
              styles.charterBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Feather name="anchor" size={18} color="#fff" />
            <Text style={styles.charterBtnText}>Request Charter</Text>
          </Pressable>
        </View>
      )}

      {/* Login prompt for guests */}
      {!user && vessel.status === 'available' && (
        <View
          style={[
            styles.ctaBar,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 8,
            },
          ]}
        >
          <Pressable
            onPress={() => router.push('/auth/login')}
            style={({ pressed }) => [
              styles.charterBtn,
              { backgroundColor: colors.secondary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={[styles.charterBtnText, { color: colors.foreground }]}>
              Sign in to charter
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  errorText: { fontFamily: 'Inter_500Medium', fontSize: 16 },
  backBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  photoWrap: { height: 280, position: 'relative' },
  photo: { width: '100%', height: '100%' },
  photoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoDots: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  content: { padding: 16, gap: 14 },
  vesselHeader: { gap: 4 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  vesselName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    flex: 1,
  },
  vesselType: { fontFamily: 'Inter_500Medium', fontSize: 15 },
  imo: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  section: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 12 },
  sectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15, marginBottom: 4 },
  specsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  specCell: { width: '28%' },
  specLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  specValue: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  metaLabel: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  metaValue: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  description: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 22 },
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ownerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerAvatarText: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#fff' },
  ownerName: { fontFamily: 'Inter_500Medium', fontSize: 15 },
  contactRow: { borderTopWidth: 1, paddingTop: 10, gap: 3 },
  contactName: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  contactDetail: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  ctaBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    padding: 16,
    paddingTop: 12,
  },
  charterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 14,
  },
  charterBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#fff',
  },
});
