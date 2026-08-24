import React from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';

const ROLE_LABELS: Record<string, string> = {
  client: 'Client / Charterer',
  broker: 'Ship Broker',
};

type PolicyKey = 'about' | 'use' | 'privacy' | 'support';

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [expandedPolicy, setExpandedPolicy] = useState<PolicyKey | null>(null);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  function confirmLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/auth/login');
        },
      },
    ]);
  }

  if (!user) return null;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topInset + 10, paddingBottom: Platform.OS === 'web' ? 84 + 24 : insets.bottom + 96 },
      ]}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>My Profile</Text>

      {/* Avatar card */}
      <View style={[styles.avatarCard, { backgroundColor: colors.muted, borderColor: colors.border, borderWidth: 1 }]}>
        <View style={[styles.avatarCircle, { backgroundColor: `${colors.primary}22`, borderColor: colors.primary }]}>
          <Text style={[styles.avatarInitials, { color: colors.primary }]}>
            {user.name.slice(0, 2).toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.avatarName, { color: colors.foreground }]}>{user.name}</Text>
        <View style={[styles.rolePill, { backgroundColor: `${colors.primary}22`, borderColor: `${colors.primary}44` }]}>
          <Text style={[styles.rolePillText, { color: colors.primary }]}>
            {ROLE_LABELS[user.role] ?? user.role}
          </Text>
        </View>
      </View>

      {/* Details */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <InfoRow icon="mail" label="Email" value={user.email} colors={colors} />
        {user.company ? (
          <InfoRow icon="briefcase" label="Company" value={user.company} colors={colors} />
        ) : null}
        {user.phone ? (
          <InfoRow icon="phone" label="Phone" value={user.phone} colors={colors} />
        ) : null}
        <InfoRow
          icon="calendar"
          label="Member since"
          value={new Date(user.createdAt).toLocaleDateString('en-GB', {
            month: 'long',
            year: 'numeric',
          })}
          colors={colors}
          last
        />
      </View>

      <View style={styles.policyIntro}>
        <Text style={[styles.sectionEyebrow, { color: colors.primary }]}>SHIPHUB INFORMATION</Text>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your account, clearly explained</Text>
        <Text style={[styles.sectionDescription, { color: colors.mutedForeground }]}>
          ShipHub is operated for Chrism Group (UK) Limited to support trusted vessel discovery and charter enquiries.
        </Text>
      </View>

      <View style={styles.policyList}>
        <PolicyCard
          icon="info"
          title="About ShipHub"
          summary="What the app does and who it is for."
          expanded={expandedPolicy === 'about'}
          onPress={() => setExpandedPolicy(expandedPolicy === 'about' ? null : 'about')}
          colors={colors}
        >
          <PolicyParagraph colors={colors}>
            ShipHub is a maritime chartering marketplace for ship owners, brokers, and charterers. It helps users discover vessel availability, review vessel information, and start or manage charter enquiries in one place.
          </PolicyParagraph>
          <PolicyParagraph colors={colors}>
            Chrism Group (UK) Limited operates this service for professional business use. Vessel information and enquiry status are provided through the ShipHub platform and may change as owners update their listings.
          </PolicyParagraph>
        </PolicyCard>

        <PolicyCard
          icon="check-circle"
          title="User policy"
          summary="The standards expected when using ShipHub."
          expanded={expandedPolicy === 'use'}
          onPress={() => setExpandedPolicy(expandedPolicy === 'use' ? null : 'use')}
          colors={colors}
        >
          <PolicyBullet colors={colors}>Use ShipHub for legitimate maritime and commercial chartering activity.</PolicyBullet>
          <PolicyBullet colors={colors}>Keep your account details accurate and protect your sign-in credentials.</PolicyBullet>
          <PolicyBullet colors={colors}>Do not misrepresent a vessel, company, cargo requirement, rate, or charter enquiry.</PolicyBullet>
          <PolicyBullet colors={colors}>Treat owner, broker, and charterer information as confidential business information.</PolicyBullet>
          <PolicyBullet colors={colors}>Do not attempt to access another user’s account or interfere with the service.</PolicyBullet>
        </PolicyCard>

        <PolicyCard
          icon="shield"
          title="Data privacy"
          summary="How account and enquiry information is used."
          expanded={expandedPolicy === 'privacy'}
          onPress={() => setExpandedPolicy(expandedPolicy === 'privacy' ? null : 'privacy')}
          colors={colors}
        >
          <PolicyParagraph colors={colors}>
            ShipHub uses your account details to authenticate you, operate the marketplace, communicate about your enquiries, and provide relevant vessel and charter information.
          </PolicyParagraph>
          <PolicyParagraph colors={colors}>
            Information connected to an enquiry may be shared with the relevant owner, broker, or charterer so the enquiry can be reviewed and managed. ShipHub does not use your information for unrelated purposes or sell it as a mailing list.
          </PolicyParagraph>
          <PolicyParagraph colors={colors}>
            Access to account and enquiry data is restricted by role. We apply reasonable technical and organisational safeguards, but you should also use a unique password and sign out of shared devices.
          </PolicyParagraph>
          <Text style={[styles.legalNote, { color: colors.mutedForeground }]}>
            This in-app summary is general information and does not replace the full privacy notice or any applicable agreement with Chrism Group (UK) Limited.
          </Text>
        </PolicyCard>

        <PolicyCard
          icon="help-circle"
          title="Help and support"
          summary="Need help with an account or charter enquiry?"
          expanded={expandedPolicy === 'support'}
          onPress={() => setExpandedPolicy(expandedPolicy === 'support' ? null : 'support')}
          colors={colors}
        >
          <PolicyParagraph colors={colors}>
            For account, vessel, or charter enquiry support, contact your Chrism Group (UK) Limited relationship or operations contact. Include the relevant vessel name or enquiry reference, but never send your password or an access token.
          </PolicyParagraph>
        </PolicyCard>
      </View>

      {/* Logout */}
      <Pressable
        onPress={confirmLogout}
        style={({ pressed }) => [
          styles.logoutBtn,
          { borderColor: colors.destructive, opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <Feather name="log-out" size={18} color={colors.destructive} />
        <Text style={[styles.logoutText, { color: colors.destructive }]}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

function PolicyCard({
  icon,
  title,
  summary,
  expanded,
  onPress,
  colors,
  children,
}: {
  icon: string;
  title: string;
  summary: string;
  expanded: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.policyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={onPress}
        style={({ pressed }) => [styles.policyHeader, { opacity: pressed ? 0.72 : 1 }]}
      >
        <View style={[styles.policyIcon, { backgroundColor: `${colors.primary}1A` }]}>
          <Feather name={icon as any} size={18} color={colors.primary} />
        </View>
        <View style={styles.policyHeading}>
          <Text style={[styles.policyTitle, { color: colors.foreground }]}>{title}</Text>
          <Text style={[styles.policySummary, { color: colors.mutedForeground }]}>{summary}</Text>
        </View>
        <Feather
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.mutedForeground}
        />
      </Pressable>
      {expanded ? <View style={[styles.policyBody, { borderTopColor: colors.border }]}>{children}</View> : null}
    </View>
  );
}

function PolicyParagraph({
  colors,
  children,
}: {
  colors: ReturnType<typeof useColors>;
  children: React.ReactNode;
}) {
  return <Text style={[styles.policyParagraph, { color: colors.secondaryForeground }]}>{children}</Text>;
}

function PolicyBullet({
  colors,
  children,
}: {
  colors: ReturnType<typeof useColors>;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.bulletRow}>
      <Feather name="check" size={15} color={colors.primary} />
      <Text style={[styles.bulletText, { color: colors.secondaryForeground }]}>{children}</Text>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  colors,
  last,
}: {
  icon: string;
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.infoRow,
        !last && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
    >
      <Feather name={icon as any} size={16} color={colors.mutedForeground} />
      <View style={styles.infoContent}>
        <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.foreground }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 14 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 24, marginBottom: 4 },
  avatarCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
  },
  avatarName: { fontFamily: 'Inter_700Bold', fontSize: 20 },
  rolePill: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
  },
  rolePillText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  section: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  infoContent: { flex: 1 },
  infoLabel: { fontFamily: 'Inter_400Regular', fontSize: 12, marginBottom: 2 },
  infoValue: { fontFamily: 'Inter_500Medium', fontSize: 15 },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  policyIntro: { gap: 5, marginTop: 4 },
  sectionEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.2 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  sectionDescription: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 },
  policyList: { gap: 10 },
  policyCard: { borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  policyHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  policyIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  policyHeading: { flex: 1, gap: 2 },
  policyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  policySummary: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17 },
  policyBody: { borderTopWidth: 1, padding: 14, gap: 11 },
  policyParagraph: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  bulletText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 },
  legalNote: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 17, fontStyle: 'italic' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  logoutText: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
});
