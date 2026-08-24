import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { Vessel } from '@/lib/types';
import { useColors } from '@/hooks/useColors';

type Props = {
  vessels?: Vessel[];
  selectedVesselId?: number | null;
  onSelectVessel?: (vessel: Vessel) => void;
  compact?: boolean;
  title?: string;
};

const MARKER_POSITIONS: Array<{ left: `${number}%`; top: `${number}%` }> = [
  { left: '17%', top: '56%' },
  { left: '46%', top: '26%' },
  { left: '67%', top: '54%' },
  { left: '78%', top: '72%' },
];

const AMBIENT_SHIPS: Array<{ left: `${number}%`; top: `${number}%`; delay: number }> = [
  { left: '30%', top: '38%', delay: 900 },
  { left: '82%', top: '34%', delay: 1700 },
  { left: '56%', top: '76%', delay: 2700 },
];

function ShipMarker({
  vessel,
  position,
  selected,
  onPress,
  reduceMotion,
  delay = 0,
  ambient = false,
}: {
  vessel?: Vessel;
  position: { left: `${number}%`; top: `${number}%` };
  selected?: boolean;
  onPress?: () => void;
  reduceMotion: boolean;
  delay?: number;
  ambient?: boolean;
}) {
  const colors = useColors();
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    drift.stopAnimation();
    if (reduceMotion) {
      drift.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(drift, {
          toValue: 1,
          duration: 4100,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 4100,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [delay, drift, reduceMotion]);

  const translateX = drift.interpolate({ inputRange: [0, 1], outputRange: [0, 10] });
  const translateY = drift.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });
  const statusColor = vessel?.status === 'on_hire' ? colors.mapMarkerOnHire : colors.mapMarker;
  const foreground = vessel?.status === 'on_hire' ? colors.mapMarkerOnHireForeground : colors.mapMarkerForeground;

  return (
    <Animated.View
      style={[
        styles.markerWrap,
        position,
        {
          opacity: ambient ? 0.65 : 1,
          transform: [{ translateX }, { translateY }],
        },
      ]}
    >
      <Pressable
        accessibilityRole={ambient ? undefined : 'button'}
        accessibilityLabel={vessel ? `Select ${vessel.name} on the chart` : undefined}
        disabled={ambient}
        onPress={onPress}
        testID={vessel ? `map-vessel-${vessel.id}` : undefined}
        style={({ pressed }) => [
          styles.marker,
          {
            backgroundColor: selected ? colors.mapMarkerOnHire : statusColor,
            borderColor: selected ? colors.mapPaper : colors.mapPort,
            opacity: pressed ? 0.82 : 1,
            transform: [{ scale: selected ? 1.16 : 1 }],
          },
        ]}
      >
        <Feather name="anchor" size={ambient ? 10 : 13} color={selected ? colors.mapMarkerOnHireForeground : foreground} />
      </Pressable>
      {!ambient && vessel ? (
        <View style={[styles.vesselLabel, { backgroundColor: colors.mapPaper }]}>
          <Text numberOfLines={1} style={[styles.vesselLabelText, { color: colors.foreground }]}>
            {vessel.name}
          </Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

export function NavigationMap({
  vessels = [],
  selectedVesselId = null,
  onSelectVessel,
  compact = false,
  title = 'Live market chart',
}: Props) {
  const colors = useColors();
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, []);

  const visibleVessels = vessels.slice(0, MARKER_POSITIONS.length);

  return (
    <View
      accessibilityLabel={title}
      style={[
        styles.chart,
        compact ? styles.compactChart : styles.fullChart,
        { backgroundColor: colors.mapWater, borderColor: colors.border },
      ]}
    >
      <View style={[styles.deepWater, { backgroundColor: colors.mapWaterDeep }]} />
      <View style={[styles.gridOne, { borderColor: colors.mapGrid }]} />
      <View style={[styles.gridTwo, { borderColor: colors.mapGrid }]} />
      <View style={[styles.routeOne, { borderColor: colors.mapRoute }]} />
      <View style={[styles.routeTwo, { borderColor: colors.mapRouteActive }]} />
      <View style={[styles.routeThree, { borderColor: colors.mapGrid }]} />

      <View style={styles.chartHeader}>
        <View>
          <Text style={[styles.chartEyebrow, { color: colors.mapPaperDim }]}>ShipHub · NORTH SEA</Text>
          <Text style={[styles.chartTitle, { color: colors.mapPaper }]}>{title}</Text>
        </View>
        <View style={[styles.chartSignal, { borderColor: colors.mapGrid, backgroundColor: colors.mapWaterDeep }]}>
          <View style={[styles.signalDot, { backgroundColor: colors.mapMarker }]} />
          <Text style={[styles.signalText, { color: colors.mapPaper }]}>Live</Text>
        </View>
      </View>

      <View style={[styles.port, styles.portTyne]}>
        <View style={[styles.portDot, { borderColor: colors.mapMarker }]} />
        <Text style={[styles.portText, { color: colors.mapPaper }]}>Tyne</Text>
      </View>
      <View style={[styles.port, styles.portBergen]}>
        <View style={[styles.portDot, { borderColor: colors.mapMarker }]} />
        <Text style={[styles.portText, { color: colors.mapPaper }]}>Bergen</Text>
      </View>
      <View style={[styles.port, styles.portRotterdam]}>
        <View style={[styles.portDot, { borderColor: colors.mapMarker }]} />
        <Text style={[styles.portText, { color: colors.mapPaper }]}>Rotterdam</Text>
      </View>
      <View style={[styles.port, styles.portHull]}>
        <View style={[styles.portDot, { borderColor: colors.mapMarker }]} />
        <Text style={[styles.portText, { color: colors.mapPaper }]}>Hull</Text>
      </View>

      {AMBIENT_SHIPS.map((ship, index) => (
        <ShipMarker
          key={`ambient-${index}`}
          position={ship}
          delay={ship.delay}
          reduceMotion={reduceMotion}
          ambient
        />
      ))}
      {visibleVessels.map((vessel, index) => (
        <ShipMarker
          key={vessel.id}
          vessel={vessel}
          position={MARKER_POSITIONS[index]}
          selected={vessel.id === selectedVesselId}
          onPress={() => onSelectVessel?.(vessel)}
          reduceMotion={reduceMotion}
          delay={index * 650}
        />
      ))}

      <View style={[styles.legend, { backgroundColor: colors.mapWaterDeep }]}>
        <Feather name="anchor" size={12} color={colors.mapMarker} />
        <Text style={[styles.legendText, { color: colors.mapPaper }]}>
          {visibleVessels.length ? `${visibleVessels.length} market vessels` : 'Routes in view'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 22,
    position: 'relative',
  },
  fullChart: { height: 286 },
  compactChart: { height: 205 },
  deepWater: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    right: -92,
    bottom: -125,
    opacity: 0.74,
  },
  gridOne: {
    position: 'absolute',
    left: -50,
    top: 42,
    width: '140%',
    borderTopWidth: 1,
    transform: [{ rotate: '-24deg' }],
    opacity: 0.34,
  },
  gridTwo: {
    position: 'absolute',
    left: -48,
    top: 118,
    width: '140%',
    borderTopWidth: 1,
    transform: [{ rotate: '38deg' }],
    opacity: 0.28,
  },
  routeOne: {
    position: 'absolute',
    width: '83%',
    left: '8%',
    top: '62%',
    borderTopWidth: 1,
    borderStyle: 'dashed',
    transform: [{ rotate: '-16deg' }],
  },
  routeTwo: {
    position: 'absolute',
    width: '61%',
    left: '27%',
    top: '35%',
    borderTopWidth: 1,
    borderStyle: 'dashed',
    transform: [{ rotate: '30deg' }],
  },
  routeThree: {
    position: 'absolute',
    width: '48%',
    left: '6%',
    top: '28%',
    borderTopWidth: 1,
    borderStyle: 'dashed',
    transform: [{ rotate: '53deg' }],
    opacity: 0.72,
  },
  chartHeader: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  chartEyebrow: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    letterSpacing: 1.1,
  },
  chartTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    letterSpacing: -0.25,
    marginTop: 3,
  },
  chartSignal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  signalDot: { width: 6, height: 6, borderRadius: 3 },
  signalText: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  port: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  portDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  portText: { fontFamily: 'Inter_500Medium', fontSize: 10 },
  portTyne: { left: '8%', bottom: '26%' },
  portBergen: { left: '27%', top: '22%' },
  portRotterdam: { right: '8%', top: '41%' },
  portHull: { right: '25%', bottom: '20%' },
  markerWrap: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 5,
  },
  marker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vesselLabel: {
    maxWidth: 92,
    marginTop: 5,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  vesselLabelText: { fontFamily: 'Inter_600SemiBold', fontSize: 9 },
  legend: {
    position: 'absolute',
    left: 14,
    bottom: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  legendText: { fontFamily: 'Inter_500Medium', fontSize: 10 },
});