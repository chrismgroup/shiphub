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
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';

const ROLE_LABELS: Record<string, string> = {
  client: 'Client / Charterer',
  broker: 'Ship Broker',
};

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

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
      <Text style={[styles.title, { color: colors.foreground }]}>Profile</Text>

      {/* Avatar card */}
      <View style={[styles.avatarCard, { backgroundColor: colors.muted, borderColor: colors.border, borderWidth: 1 }]}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitials}>
            {user.name.slice(0, 2).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.avatarName}>{user.name}</Text>
        <View style={[styles.rolePill, { backgroundColor: '#ffffff22' }]}>
          <Text style={styles.rolePillText}>
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

      {/* Quick links */}
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
    backgroundColor: '#B8EB4222',
    borderWidth: 2,
    borderColor: '#B8EB42',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: '#B8EB42',
  },
  avatarName: { fontFamily: 'Inter_700Bold', fontSize: 20, color: '#F7F7F2' },
  rolePill: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: '#B8EB4222',
    borderWidth: 1,
    borderColor: '#B8EB4244',
  },
  rolePillText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#B8EB42',
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
  linkText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 15 },
  chevron: { marginLeft: 'auto' },
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
