import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import type { Vessel } from '@/lib/types';
import { StatusBadge } from './StatusBadge';
import { vesselPhotoUrl } from '@/lib/api';

interface Props {
  vessel: Vessel;
  onPress: () => void;
}

export function VesselCard({ vessel, onPress }: Props) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.88 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
    >
      {/* Photo / placeholder */}
      <View style={[styles.photoContainer, { backgroundColor: colors.secondary }]}>
        {vessel.firstPhotoPath ? (
          <Image
            source={{ uri: vesselPhotoUrl(vessel.firstPhotoPath) }}
            style={styles.photo}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.photoPlaceholder, { backgroundColor: colors.secondary }]}>
            {/* Subtle radial glow */}
            <View style={[styles.glowOrb, { backgroundColor: colors.primary }]} />
            <Feather name="anchor" size={28} color={colors.primary} style={{ opacity: 0.5 }} />
          </View>
        )}

        {/* Status badge — top left */}
        <View style={styles.statusOverlay}>
          <StatusBadge status={vessel.status} size="sm" />
        </View>

        {/* IMO + type pill — bottom left */}
        <View style={[styles.typePill, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
          <Text style={styles.typePillText}>
            {vessel.flag ? `${vessel.flag} ` : ''}{vessel.vesselType}
          </Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.info}>
        {/* Name row */}
        <Text
          style={[styles.name, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {vessel.name}
        </Text>

        {/* Specs row */}
        <View style={[styles.specsRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          {vessel.dwt ? (
            <View style={styles.specItem}>
              <Text style={[styles.specLabel, { color: colors.mutedForeground }]}>DWT</Text>
              <Text style={[styles.specValue, { color: colors.foreground }]}>
                {Number(vessel.dwt).toLocaleString()}
              </Text>
            </View>
          ) : null}
          {vessel.grt ? (
            <View style={[styles.specItem, styles.specItemBordered, { borderColor: colors.border }]}>
              <Text style={[styles.specLabel, { color: colors.mutedForeground }]}>GRT</Text>
              <Text style={[styles.specValue, { color: colors.foreground }]}>
                {Number(vessel.grt).toLocaleString()}
              </Text>
            </View>
          ) : null}
          {vessel.yearBuilt ? (
            <View style={[styles.specItem, styles.specItemBordered, { borderColor: colors.border }]}>
              <Text style={[styles.specLabel, { color: colors.mutedForeground }]}>Built</Text>
              <Text style={[styles.specValue, { color: colors.foreground }]}>{vessel.yearBuilt}</Text>
            </View>
          ) : null}
        </View>

        {/* Footer row */}
        <View style={styles.footerRow}>
          {vessel.ownerName ? (
            <View style={styles.ownerRow}>
              <Feather name="user" size={11} color={colors.mutedForeground} />
              <Text style={[styles.ownerName, { color: colors.mutedForeground }]} numberOfLines={1}>
                {vessel.ownerName}
              </Text>
            </View>
          ) : (
            <View />
          )}
          <View style={[styles.ctaChip, { backgroundColor: colors.primary }]}>
            <Text style={styles.ctaText}>Details</Text>
            <Feather name="arrow-right" size={11} color={colors.primaryForeground} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  photoContainer: {
    height: 150,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOrb: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.08,
  },
  statusOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  typePill: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  typePillText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.2,
  },
  info: {
    padding: 12,
    gap: 8,
  },
  name: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    letterSpacing: -0.3,
  },
  specsRow: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  specItem: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 10,
    gap: 2,
  },
  specItemBordered: {
    borderLeftWidth: 1,
  },
  specLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  specValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  ownerName: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    flex: 1,
  },
  ctaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  ctaText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: '#111111',
  },
});
