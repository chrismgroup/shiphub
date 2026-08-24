import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';

export default function Auth() {
  const colors = useColors();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!email.trim() || !password) return Alert.alert('Missing details', 'Enter your email and password.');
    if (mode === 'register' && !name.trim()) return Alert.alert('Missing details', 'Enter your name.');
    setBusy(true);
    try {
      if (mode === 'login') await login(email.trim(), password);
      else await register({ name: name.trim(), email: email.trim(), password, company: company.trim() || undefined });
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert(mode === 'login' ? 'Could not sign in' : 'Could not create account', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>SHIPHUB OWNERS</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>{mode === 'login' ? 'Owner operations' : 'Create owner account'}</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>List and manage your vessels for brokers and charterers.</Text>
        {mode === 'register' && <Input colors={colors} label="Your name" value={name} onChangeText={setName} autoCapitalize="words" />}
        {mode === 'register' && <Input colors={colors} label="Company (optional)" value={company} onChangeText={setCompany} />}
        <Input colors={colors} label="Work email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <Input colors={colors} label="Password" value={password} onChangeText={setPassword} secureTextEntry />
        <Pressable testID="owner-auth-submit" onPress={submit} disabled={busy} style={[styles.button, { backgroundColor: colors.primary, opacity: busy ? 0.6 : 1 }]}>
          {busy ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{mode === 'login' ? 'Sign in' : 'Create account'}</Text>}
        </Pressable>
        <Pressable onPress={() => setMode((current) => current === 'login' ? 'register' : 'login')} style={styles.switch}>
          <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>{mode === 'login' ? 'New owner? Create an account' : 'Already have an account? Sign in'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function Input({ colors, label, ...props }: { colors: ReturnType<typeof useColors>; label: string } & React.ComponentProps<typeof TextInput>) {
  return <View style={styles.inputWrap}><Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text><TextInput {...props} placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} /></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  content: { width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 24, gap: 12 },
  eyebrow: { fontFamily: 'Inter_700Bold', letterSpacing: 1.6, fontSize: 12, marginBottom: 4 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 30, letterSpacing: -0.7 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 21, marginBottom: 10 },
  inputWrap: { gap: 6 },
  label: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  input: { height: 50, borderWidth: 1, borderRadius: 11, paddingHorizontal: 14, fontFamily: 'Inter_400Regular', fontSize: 15 },
  button: { height: 52, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  buttonText: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  switch: { alignItems: 'center', paddingVertical: 10 },
});