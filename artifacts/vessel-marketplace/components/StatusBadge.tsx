import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import type { CharterStatus, VesselStatus } from '@/lib/types';

type Status = VesselStatus | CharterStatus;

const LABELS: Record<Status, string> = {
  available: 'Available',
  on_hire: 'On Hire',
  laid_up: 'Laid Up',
  decommissioned: 'Decommissioned',
  enquiry: 'Enquiry',
  negotiating: 'Negotiating',
  active: 'Active',
  confirmed: 'Confirmed',
  declined: 'Declined',
  terminated: 'Terminated',
};

// Glowing dot colors per status (independent of theme)
interface Props {
  status: Status;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: Props) {
  const colors = useColors();

  const colorMap: Record<Status, { text: string; bg: string }> = {
    available: { text: colors.statusAvailable, bg: colors.statusAvailableBg },
    on_hire: { text: colors.statusOnHire, bg: colors.statusOnHireBg },
    laid_up: { text: colors.statusLaidUp, bg: colors.statusLaidUpBg },
    decommissioned: { text: colors.statusDecommissioned, bg: colors.statusDecommissionedBg },
    enquiry: { text: colors.statusEnquiry, bg: colors.statusEnquiryBg },
    negotiating: { text: colors.statusNegotiating, bg: colors.statusNegotiatingBg },
    active: { text: colors.statusActive, bg: colors.statusActiveBg },
    confirmed: { text: colors.statusConfirmed, bg: colors.statusConfirmedBg },
    declined: { text: colors.statusDeclined, bg: colors.statusDeclinedBg },
    terminated: { text: colors.statusTerminated, bg: colors.statusTerminatedBg },
  };

  const { text, bg } = colorMap[status] ?? { text: colors.mutedForeground, bg: colors.muted };
  const isSmall = size === 'sm';
  const dotColor = text;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          paddingHorizontal: isSmall ? 7 : 9,
          paddingVertical: isSmall ? 3 : 4,
          gap: isSmall ? 4 : 5,
        },
      ]}
    >
      <View
        style={[
          styles.dot,
          {
            backgroundColor: dotColor,
            width: isSmall ? 5 : 6,
            height: isSmall ? 5 : 6,
            borderRadius: isSmall ? 2.5 : 3,
          },
        ]}
      />
      <Text
        style={[
          styles.text,
          { color: text, fontSize: isSmall ? 10 : 11 },
        ]}
      >
        {LABELS[status] ?? status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {},
  text: {
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.2,
  },
});
