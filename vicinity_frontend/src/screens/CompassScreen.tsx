import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Pressable } from 'react-native';
import { V } from '../theme/colors';
import BouncyButton from '../widgets/BouncyButton';
import { Ionicons } from '@expo/vector-icons';
import { Person } from '../types';

// ─── Directional Arrow Mark ───────────────────────────────────────────────────
interface DirectionArrowProps {
  angle: number;
  accent: string;
}

function DirectionArrow({ angle, accent }: DirectionArrowProps) {
  const jitter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(jitter, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(jitter, { toValue: -1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const rotate = jitter.interpolate({
    inputRange: [-1, 1],
    outputRange: [`${angle - 5}deg`, `${angle + 5}deg`],
  });

  return (
    <Animated.View style={[arrow.wrap, { transform: [{ rotate }] }]}>
      {/* Arrow shaft */}
      <View style={[arrow.shaft, { backgroundColor: `${accent}80` }]} />
      {/* Arrow head */}
      <View style={[arrow.head, { borderBottomColor: accent }]} />
    </Animated.View>
  );
}

const arrow = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'flex-end', height: 120 },
  shaft: { width: 2, flex: 1, borderRadius: 1 },
  head: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 18,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginBottom: 2,
    position: 'absolute',
    top: 0,
  },
});

// ─── Proximity Ring ───────────────────────────────────────────────────────────
interface ProximityRingProps {
  radius: number;
  opacity: number;
}

function ProximityRing({ radius, opacity: op }: ProximityRingProps) {
  return (
    <View style={{
      position: 'absolute',
      width: radius * 2,
      height: radius * 2,
      borderRadius: radius,
      borderWidth: 1,
      borderColor: `rgba(255,255,255,${op})`,
    }} />
  );
}

// ─── Compass Screen ───────────────────────────────────────────────────────────
interface CompassScreenProps {
  profile: Person | null;
  onBack: () => void;
}

export default function CompassScreen({ profile, onBack }: CompassScreenProps) {
  const [distance, setDistance] = useState(32);

  // Distance count down
  useEffect(() => {
    const interval = setInterval(() => {
      setDistance(prev => prev <= 3 ? 3 : prev - 1);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Entrance fade
  const pageOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(pageOpacity, { toValue: 1, duration: 700, useNativeDriver: true }).start();
  }, []);

  // Ping button pulse
  const pingScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pingScale, { toValue: 1.06, duration: 1200, useNativeDriver: true }),
        Animated.timing(pingScale, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  if (!profile) return null;
  const accent = profile.favColor || V.coral;

  const isClose = distance <= 10;
  const statusColor = isClose ? '#4ADE80' : accent;
  const statusText = isClose ? 'You are very close' : `Head towards ${profile.name}`;

  return (
    <Animated.View style={[s.screen, { opacity: pageOpacity }]}>
      {/* Ambient glow */}
      <View style={[s.bgGlow, { backgroundColor: accent }]} />

      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={onBack} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.6)" />
        </Pressable>
        <View style={s.headerMid}>
          <Text style={s.headerName}>{profile.name}</Text>
          <Text style={s.headerSub}>Navigate to find them</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Compass field ── */}
      <View style={s.compassField}>
        {/* Concentric rings */}
        <ProximityRing radius={120} opacity={0.05} />
        <ProximityRing radius={88} opacity={0.08} />
        <ProximityRing radius={56} opacity={0.10} />

        {/* Cardinal marks */}
        {['N', 'E', 'S', 'W'].map((c, i) => {
          const positions = [
            { top: 12, left: '46%' },
            { right: 12, top: '46%' },
            { bottom: 12, left: '46%' },
            { left: 12, top: '46%' },
          ];
          return (
            <Text key={c} style={[s.cardinal, positions[i]] as any}>{c}</Text>
          );
        })}

        {/* Direction arrow */}
        <DirectionArrow angle={profile.direction || 45} accent={accent} />

        {/* Center pivot dot */}
        <View style={[s.pivot, { backgroundColor: accent }]} />
      </View>

      {/* ── Distance readout ── */}
      <View style={s.readout}>
        <Text style={[s.distNumber, { color: statusColor }]}>{distance}</Text>
        <Text style={s.distUnit}>metres</Text>
      </View>

      {/* ── Status ── */}
      <View style={s.statusRow}>
        <View style={[s.statusDot, { backgroundColor: statusColor }]} />
        <Text style={s.statusText}>{statusText}</Text>
      </View>

      {/* ── CTA ── */}
      <View style={s.bottom}>
        <Animated.View style={{ transform: [{ scale: pingScale }] }}>
          <BouncyButton onTap={() => {}} style={[s.pingBtn, { backgroundColor: accent }]}>
            <Ionicons name="radio-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={s.pingText}>Send a ping</Text>
          </BouncyButton>
        </Animated.View>
        <Text style={s.pingHint}>Lets {profile.name} know you are on your way</Text>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#09090F',
    justifyContent: 'space-between',
    paddingBottom: 36,
  },
  bgGlow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    top: -80,
    alignSelf: 'center',
    opacity: 0.06,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerMid: { alignItems: 'center' },
  headerName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerSub: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    marginTop: 2,
  },

  // Compass field
  compassField: {
    width: 260,
    height: 260,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cardinal: {
    position: 'absolute',
    color: 'rgba(255,255,255,0.18)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
  },
  pivot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
  },

  // Distance readout
  readout: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 8,
  },
  distNumber: {
    fontSize: 72,
    fontWeight: '200',
    letterSpacing: -3,
    lineHeight: 76,
  },
  distUnit: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 16,
    fontWeight: '300',
    letterSpacing: 0.5,
  },

  // Status
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
  },

  // Bottom CTA
  bottom: { alignItems: 'center', paddingHorizontal: 24 },
  pingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    height: 52,
    borderRadius: 26,
  },
  pingText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  pingHint: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 11,
    marginTop: 10,
    textAlign: 'center',
  },
});
