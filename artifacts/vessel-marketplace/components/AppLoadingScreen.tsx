import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';

const boats = [
  { emoji: '🚢', label: 'Cargo vessel', top: '26%', duration: 5200, delay: 0 },
  { emoji: '⛴️', label: 'Ferry', top: '51%', duration: 4300, delay: 800 },
  { emoji: '🛥️', label: 'Motor boat', top: '72%', duration: 3600, delay: 1500 },
] as const;

function MovingBoat({
  emoji,
  label,
  top,
  duration,
  delay,
}: (typeof boats)[number]) {
  const progress = useSharedValue(-0.2);

  useEffect(() => {
    const start = withDelay(
      delay,
      withTiming(1.2, { duration, easing: Easing.linear }),
    );
    progress.value = withRepeat(start, -1, false);
  }, [delay, duration, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: `${progress.value * 120 - 10}%` },
      { translateY: Math.sin(progress.value * Math.PI * 8) * 3 },
      { rotate: `${Math.sin(progress.value * Math.PI * 6) * 2}deg` },
    ],
  }));

  return (
    <Animated.View
      accessibilityLabel={`${label} moving across the loading route`}
      style={[styles.boat, { top }, animatedStyle]}
    >
      <Text style={styles.boatEmoji}>{emoji}</Text>
      <View style={styles.wake} />
    </Animated.View>
  );
}

export function AppLoadingScreen() {
  const colors = useColors();
  const pulse = useSharedValue(0.82);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.82, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.brand}>
        <Animated.View
          style={[
            styles.logoFrame,
            { backgroundColor: colors.secondary, borderColor: colors.border },
            pulseStyle,
          ]}
        >
          <Image source={require('../assets/images/icon.png')} style={styles.logo} resizeMode="contain" />
        </Animated.View>
        <Text style={[styles.name, { color: colors.primary }]}>SHIPHUB</Text>
        <Text style={[styles.desk, { color: colors.mutedForeground }]}>CHARTERER DESK</Text>
      </View>

      <View style={[styles.route, { backgroundColor: colors.mapWaterDeep, borderColor: colors.border }]}>
        <View style={[styles.routeLine, { borderColor: colors.mapGrid }]} />
        <View style={[styles.routeLine, styles.routeLineTwo, { borderColor: colors.mapGrid }]} />
        <View style={[styles.dottedRoute, { borderColor: colors.mapRoute }]} />
        <View style={[styles.port, { backgroundColor: colors.mapRoute }]} />
        <View style={[styles.port, styles.portTwo, { backgroundColor: colors.mapRoute }]} />
        {boats.map((boat) => (
          <MovingBoat key={boat.label} {...boat} />
        ))}
      </View>

      <Text style={[styles.loading, { color: colors.foreground }]}>Preparing your routes</Text>
      <Text style={[styles.caption, { color: colors.mutedForeground }]}>
        Checking the latest vessel movements…
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  brand: { alignItems: 'center', marginBottom: 32 },
  logoFrame: {
    width: 68,
    height: 68,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  logo: { width: 48, height: 48 },
  name: { fontFamily: 'Inter_700Bold', fontSize: 18, letterSpacing: 4 },
  desk: { fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 2, marginTop: 4 },
  route: {
    width: '100%',
    maxWidth: 390,
    height: 190,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  routeLine: {
    position: 'absolute',
    width: '130%',
    left: '-15%',
    top: '50%',
    borderTopWidth: 1,
    transform: [{ rotate: '-18deg' }],
    opacity: 0.45,
  },
  routeLineTwo: { top: '38%', transform: [{ rotate: '24deg' }], opacity: 0.3 },
  dottedRoute: {
    position: 'absolute',
    width: '120%',
    left: '-10%',
    top: '62%',
    borderTopWidth: 1,
    borderStyle: 'dashed',
    transform: [{ rotate: '-10deg' }],
  },
  port: { position: 'absolute', width: 8, height: 8, borderRadius: 4, left: '18%', top: '38%' },
  portTwo: { left: '78%', top: '68%' },
  boat: { position: 'absolute', left: '-22%', width: 86, alignItems: 'center' },
  boatEmoji: { fontSize: 28 },
  wake: { width: 48, borderTopWidth: 2, borderColor: '#bde5e2', opacity: 0.7, marginTop: -3 },
  loading: { fontFamily: 'Inter_700Bold', fontSize: 18, marginTop: 28 },
  caption: { fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 7 },
});