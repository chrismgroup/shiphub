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
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const { reason } = useLocalSearchParams<{ reason?: string }>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/(tabs)');
    } catch (err: unknown) {
      Alert.alert('Login failed', err instanceof Error ? err.message : 'Unknown error');
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
        { paddingTop: topInset + 48, paddingBottom: insets.bottom + 40 },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      {/* Logo / header */}
      <View style={styles.header}>
        {/* Icon with glow ring */}
        <View style={styles.iconOuter}>
          <View style={[styles.iconGlow, { backgroundColor: colors.primary }]} />
          <View style={[styles.iconWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Feather name="anchor" size={32} color={colors.primary} />
          </View>
        </View>

        <Text style={[styles.brand, { color: colors.primary }]}>ShipHub</Text>
        <Text style={[styles.appName, { color: colors.foreground }]}>Charterer App</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Sign in to your account
        </Text>
      </View>

      {reason === 'owner' && (
        <View style={[styles.notice, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Feather name="info" size={16} color={colors.accent} />
          <Text style={[styles.noticeText, { color: colors.secondaryForeground }]}>
            Owner and admin accounts use the ShipHub Owner app.
          </Text>
        </View>
      )}

      {/* Form */}
      <View style={styles.form}>
        <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.muted }]}>
          <Feather name="mail" size={17} color={colors.mutedForeground} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="Email address"
            placeholderTextColor={colors.mutedForeground}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>

        <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.muted }]}>
          <Feather name="lock" size={17} color={colors.mutedForeground} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="Password"
            placeholderTextColor={colors.mutedForeground}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete="password"
          />
          <Pressable onPress={() => setShowPassword((p) => !p)} style={styles.eyeBtn}>
            <Feather
              name={showPassword ? 'eye-off' : 'eye'}
              size={17}
              color={colors.mutedForeground}
            />
          </Pressable>
        </View>

        <Pressable
          onPress={handleLogin}
          disabled={loading}
          style={({ pressed }) => [
            styles.loginBtn,
            { backgroundColor: colors.primary, opacity: pressed || loading ? 0.75 : 1 },
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={styles.loginBtnInner}>
              <Text style={styles.loginBtnText}>Sign In</Text>
              <Feather name="arrow-right" size={16} color="#fff" />
            </View>
          )}
        </Pressable>
      </View>

      {/* Register link */}
      <Pressable onPress={() => router.push('/auth/register')} style={styles.registerLink}>
        <Text style={[styles.registerText, { color: colors.mutedForeground }]}>
          Don't have an account?{' '}
          <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>
            Register
          </Text>
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 24 },
  header: { alignItems: 'center', marginBottom: 36 },
  iconOuter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.12,
  },
  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  appName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    letterSpacing: -0.6,
    marginBottom: 6,
  },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  noticeText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 18 },
  form: { gap: 12 },
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
    fontSize: 15,
    height: '100%',
  },
  eyeBtn: { padding: 4 },
  loginBtn: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  loginBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loginBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#fff',
  },
  registerLink: { marginTop: 28, alignItems: 'center' },
  registerText: { fontFamily: 'Inter_400Regular', fontSize: 14 },
});
