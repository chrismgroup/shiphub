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
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';

const ROLES = [
  { value: 'client', label: 'Client / Charterer' },
  { value: 'broker', label: 'Ship Broker' },
];

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<string>('client');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Missing fields', 'Name, email and password are required.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        company: company.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      router.replace('/(tabs)');
    } catch (err: unknown) {
      Alert.alert('Registration failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topInset + 24, paddingBottom: insets.bottom + 40 },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Create Account</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Join the Nigerian Vessel Marketplace
        </Text>
      </View>

      <View style={styles.form}>
        {/* Name */}
        <LabeledInput
          label="Full Name"
          icon="user"
          value={name}
          onChangeText={setName}
          placeholder="John Doe"
          colors={colors}
        />

        {/* Email */}
        <LabeledInput
          label="Email"
          icon="mail"
          value={email}
          onChangeText={setEmail}
          placeholder="john@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          colors={colors}
        />

        {/* Password */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
          <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.muted }]}>
            <Feather name="lock" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="Min 6 characters"
              placeholderTextColor={colors.mutedForeground}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <Pressable onPress={() => setShowPassword((p) => !p)}>
              <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </View>

        {/* Role */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.foreground }]}>I am a…</Text>
          <View style={styles.roleRow}>
            {ROLES.map((r) => (
              <Pressable
                key={r.value}
                onPress={() => setRole(r.value)}
                style={[
                  styles.roleBtn,
                  {
                    borderColor: role === r.value ? colors.primary : colors.border,
                    backgroundColor: role === r.value ? colors.primary : colors.card,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.roleBtnText,
                    { color: role === r.value ? '#fff' : colors.foreground },
                  ]}
                >
                  {r.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Company */}
        <LabeledInput
          label="Company (optional)"
          icon="briefcase"
          value={company}
          onChangeText={setCompany}
          placeholder="Your company"
          colors={colors}
        />

        {/* Phone */}
        <LabeledInput
          label="Phone (optional)"
          icon="phone"
          value={phone}
          onChangeText={setPhone}
          placeholder="+234 000 000 0000"
          keyboardType="phone-pad"
          colors={colors}
        />

        <Pressable
          onPress={handleRegister}
          disabled={loading}
          style={({ pressed }) => [
            styles.submitBtn,
            { backgroundColor: colors.primary, opacity: pressed || loading ? 0.8 : 1 },
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Create Account</Text>
          )}
        </Pressable>
      </View>

      <Pressable onPress={() => router.back()} style={styles.loginLink}>
        <Text style={[styles.loginText, { color: colors.mutedForeground }]}>
          Already have an account?{' '}
          <Text style={{ color: colors.accent, fontFamily: 'Inter_600SemiBold' }}>
            Sign In
          </Text>
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function LabeledInput({
  label,
  icon,
  colors,
  ...props
}: {
  label: string;
  icon: string;
  colors: ReturnType<typeof useColors>;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences';
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Feather name={icon as any} size={18} color={colors.mutedForeground} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { color: colors.foreground }]}
          placeholderTextColor={colors.mutedForeground}
          {...props}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 24 },
  header: { marginBottom: 28 },
  backBtn: { marginBottom: 16, alignSelf: 'flex-start', padding: 4 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 26, marginBottom: 4 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  form: { gap: 14 },
  field: { gap: 6 },
  label: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    height: '100%',
  },
  roleRow: { gap: 8 },
  roleBtn: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  roleBtnText: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  submitBtn: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#fff' },
  loginLink: { marginTop: 24, alignItems: 'center' },
  loginText: { fontFamily: 'Inter_400Regular', fontSize: 14 },
});
