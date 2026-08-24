import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
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
import { NavigationMap } from '@/components/NavigationMap';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import * as LocalAuthentication from 'expo-local-authentication';

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login, biometricLogin, hasBiometricLogin } = useAuth();
  const { reason } = useLocalSearchParams<{ reason?: string }>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [biometricLabel, setBiometricLabel] = useState('Use Face ID or fingerprint');

  React.useEffect(() => {
    if (Platform.OS === 'web') return;
    LocalAuthentication.supportedAuthenticationTypesAsync().then((types) => {
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricLabel('Use Face ID');
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricLabel('Use fingerprint');
      }
    }).catch(() => {});
  }, []);

  async function handleBiometricLogin() {
    setValidationMessage(null);
    setLoading(true);
    try {
      await biometricLogin();
      router.replace('/(tabs)');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Biometric sign-in was not completed.';
      setValidationMessage(message);
      Alert.alert('Biometric sign-in failed', message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    if (!email.trim() || !password) {
      const message = 'Please enter your email and password.';
      setValidationMessage(message);
      Alert.alert('Missing fields', message);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      const message = 'Please enter a valid email address.';
      setValidationMessage(message);
      Alert.alert('Invalid email', message);
      return;
    }
    setValidationMessage(null);
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/(tabs)');
    } catch (err: unknown) {
      const serverMessage = err instanceof Error ? err.message : '';
      const message = /invalid credentials|incorrect/i.test(serverMessage)
        ? 'Your email or password is incorrect.'
        : serverMessage || 'We could not sign you in. Please check your details and try again.';
      setValidationMessage(message);
      Alert.alert('Login failed', message);
    } finally {
      setLoading(false);
    }
  }

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topInset + 18, paddingBottom: insets.bottom + 34 },
      ]}
      bottomOffset={60}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
    >
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={[styles.iconWrap, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Feather name="anchor" size={21} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.brand, { color: colors.primary }]}>ShipHub</Text>
            <Text style={[styles.deskLabel, { color: colors.mutedForeground }]}>Chaterers Desk</Text>
          </View>
        </View>
        <Text style={[styles.welcomeTitle, { color: colors.foreground }]}>Welcome aboard.</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Sign in and pick up your next charter route.</Text>
      </View>

      <NavigationMap compact title="Your charter route" />

      {reason === 'owner' ? (
        <View style={[styles.notice, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Feather name="info" size={16} color={colors.accent} />
          <Text style={[styles.noticeText, { color: colors.secondaryForeground }]}>
            Owner and admin accounts use the ShipHub Owner app.
          </Text>
        </View>
      ) : null}

      <View style={[styles.formPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.formHeading}>
          <Text style={[styles.formTitle, { color: colors.foreground }]}>Sign in</Text>
          <Text style={[styles.formHint, { color: colors.mutedForeground }]}>Your market desk is ready.</Text>
        </View>
        {validationMessage ? (
          <View
            accessibilityLiveRegion="polite"
            testID="login-validation-message"
            style={[styles.validationNotice, { backgroundColor: colors.statusDeclinedBg, borderColor: colors.statusDeclined }]}
          >
            <Feather name="alert-circle" size={15} color={colors.statusDeclined} />
            <Text style={[styles.validationText, { color: colors.statusDeclined }]}>{validationMessage}</Text>
          </View>
        ) : null}
        <View style={styles.form}>
          <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.muted }]}>
            <Feather name="mail" size={17} color={colors.mutedForeground} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="Email address"
              placeholderTextColor={colors.mutedForeground}
              value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  setValidationMessage(null);
                }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              accessibilityLabel="Email address"
              testID="login-email"
            />
          </View>

          <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.muted }]}>
            <Feather name="lock" size={17} color={colors.mutedForeground} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="Password"
              placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  setValidationMessage(null);
                }}
              secureTextEntry={!showPassword}
              autoComplete="password"
              accessibilityLabel="Password"
              testID="login-password"
            />
            <Pressable
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              onPress={() => setShowPassword((value) => !value)}
              style={styles.eyeBtn}
            >
              <Feather name={showPassword ? 'eye-off' : 'eye'} size={17} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <Pressable
            testID="login-submit"
            onPress={handleLogin}
            disabled={loading}
            style={({ pressed }) => [
              styles.loginBtn,
              { backgroundColor: colors.primary, opacity: pressed || loading ? 0.75 : 1 },
            ]}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <View style={styles.loginBtnInner}>
                <Text style={[styles.loginBtnText, { color: colors.primaryForeground }]}>Sign in to ShipHub</Text>
                <Feather name="arrow-right" size={16} color={colors.primaryForeground} />
              </View>
            )}
          </Pressable>
          {Platform.OS !== 'web' && hasBiometricLogin ? (
            <Pressable
              testID="biometric-login"
              onPress={handleBiometricLogin}
              disabled={loading}
              style={({ pressed }) => [
                styles.biometricBtn,
                { borderColor: colors.border, opacity: pressed || loading ? 0.65 : 1 },
              ]}
            >
              <Feather name="shield" size={16} color={colors.primary} />
              <Text style={[styles.biometricBtnText, { color: colors.primary }]}>{biometricLabel}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <Pressable testID="register-link" onPress={() => router.push('/auth/register')} style={styles.registerLink}>
        <Text style={[styles.registerText, { color: colors.mutedForeground }]}>
          Don't have an account?{' '}
          <Text style={[styles.registerHighlight, { color: colors.primary }]}>
            Register
          </Text>
        </Text>
      </Pressable>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: { marginBottom: 17 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 18 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  deskLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 9, letterSpacing: 1.25 },
  welcomeTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 29,
    letterSpacing: -0.9,
    marginBottom: 5,
  },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20 },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    marginBottom: 12,
  },
  noticeText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 18 },
  formPanel: { borderWidth: 1, borderRadius: 20, padding: 15, marginTop: 16 },
  formHeading: { marginBottom: 13 },
  formTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, letterSpacing: -0.3 },
  formHint: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 3 },
  validationNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 12,
  },
  validationText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 16 },
  form: { gap: 11 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
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
    borderRadius: 14,
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
  },
  biometricBtn: {
    height: 46,
    borderWidth: 1,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  biometricBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  registerLink: { marginTop: 22, alignItems: 'center' },
  registerText: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  registerHighlight: { fontFamily: 'Inter_600SemiBold' },
});
