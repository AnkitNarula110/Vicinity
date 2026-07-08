import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Pressable, Animated, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { V } from '../theme/colors';
import { F } from '../theme/fonts';
import { Ionicons } from '@expo/vector-icons';
import { Match, UserProfile } from '../types';

// ─── Mock matches ──────────────────────────────────────────────────────────────
const MOCK_MATCHES: Match[] = [
  {
    id: '1',
    name: 'Chloe',
    age: '20',
    distance: 32,
    favColor: '#801827',
    lastMsg: "same! let's unlock and grab a drink at back bar?",
    time: '2m ago',
    unread: 1,
    isOnline: true,
  },
];

// ─── Match Row ─────────────────────────────────────────────────────────────────
interface MatchRowProps {
  match: Match;
  onPress: (match: Match) => void;
}

function MatchRow({ match, onPress }: MatchRowProps) {
  const accent = match.favColor || V.coral;
  const scale  = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    onPress(match);
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable onPress={handlePress} style={s.row}>
        {/* Avatar */}
        <View style={[s.avatarWrap, { borderColor: `${accent}50` }]}>
          <View style={[s.avatarInner, { backgroundColor: `${accent}20` }]}>
            <Text style={s.avatarInitial}>{match.name[0]}</Text>
          </View>
          {match.isOnline && <View style={s.onlineDot} />}
        </View>

        {/* Info */}
        <View style={s.info}>
          <View style={s.nameRow}>
            <Text style={s.name}>{match.name}, {match.age}</Text>
            <Text style={s.time}>{match.time}</Text>
          </View>
          <View style={s.distRow}>
            <Ionicons name="location-outline" size={10} color={accent} />
            <Text style={[s.dist, { color: accent }]}> ~{match.distance}m away</Text>
          </View>
          <Text style={s.lastMsg} numberOfLines={1}>{match.lastMsg}</Text>
        </View>

        {/* Unread */}
        {match.unread > 0 && (
          <View style={[s.unread, { backgroundColor: accent }]}>
            <Text style={s.unreadNum}>{match.unread}</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────────
interface EmptyStateProps {
  accent: string;
}

function EmptyState({ accent }: EmptyStateProps) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.1, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,   duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={es.wrap}>
      <Animated.View style={[es.ring, { borderColor: `${accent}30`, transform: [{ scale: pulse }] }]} />
      <View style={[es.icon, { backgroundColor: `${accent}15` }]}>
        <Ionicons name="chatbubbles-outline" size={28} color={accent} />
      </View>
      <Text style={es.title}>No matches yet</Text>
      <Text style={es.sub}>Wave at someone nearby{'\n'}to start a conversation</Text>
    </View>
  );
}

const es = StyleSheet.create({
  wrap:  { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 60 },
  ring:  { position: 'absolute', width: 130, height: 130, borderRadius: 65, borderWidth: 1 },
  icon:  { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { color: '#FFFFFF', fontSize: 18, fontWeight: '600', marginBottom: 8 },
  sub:   { color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', lineHeight: 20 },
});

// ─── Matches Screen ────────────────────────────────────────────────────────────
interface MatchesScreenProps {
  userProfile: UserProfile | null;
  onOpenChat: (match: Match) => void;
}

export default function MatchesScreen({ userProfile, onOpenChat }: MatchesScreenProps) {
  const accent = userProfile?.favColor || V.coral;

  const headerOp = useRef(new Animated.Value(0)).current;
  const headerY  = useRef(new Animated.Value(-12)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOp, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(headerY,  { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={s.screen}>
      <LinearGradient
        colors={['#0F0F1E', '#09090F', '#09090F']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[s.bgGlow, { backgroundColor: accent }]} />

      {/* Header */}
      <Animated.View style={[s.header, { opacity: headerOp, transform: [{ translateY: headerY }] }]}>
        <View>
          <Text style={s.headerTitle}>Matches</Text>
          <Text style={s.headerSub}>Your active conversations</Text>
        </View>
        {MOCK_MATCHES.length > 0 && (
          <View style={[s.countPill, { backgroundColor: `${accent}20`, borderColor: `${accent}40` }]}>
            <Text style={[s.countText, { color: accent }]}>{MOCK_MATCHES.length}</Text>
          </View>
        )}
      </Animated.View>

      {/* Section label */}
      {MOCK_MATCHES.length > 0 && (
        <Text style={s.sectionLabel}>Active now</Text>
      )}

      {/* List / Empty */}
      {MOCK_MATCHES.length === 0 ? (
        <EmptyState accent={accent} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.list}
        >
          {MOCK_MATCHES.map(m => (
            <MatchRow key={m.id} match={m} onPress={(match) => onOpenChat(match)} />
          ))}

          {/* Hint */}
          <View style={s.hint}>
            <Ionicons name="information-circle-outline" size={14} color="rgba(255,255,255,0.2)" />
            <Text style={s.hintText}>Matches expire after 24 hours of inactivity</Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: '#09090F' },
  bgGlow:      { position: 'absolute', width: 240, height: 240, borderRadius: 120, top: -100, alignSelf: 'center', opacity: 0.06 },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerTitle: { color: '#FFFFFF', fontSize: 26, fontWeight: '700', letterSpacing: -0.5, fontFamily: F.serif },
  headerSub:   { color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 2, fontFamily: F.regular },
  countPill:   { borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  countText:   { fontSize: 14, fontWeight: '700' },
  sectionLabel:{ color: 'rgba(255,255,255,0.2)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600', paddingHorizontal: 20, marginBottom: 8, fontFamily: F.semibold },
  list:        { paddingHorizontal: 16, paddingBottom: 20 },

  // Row
  row:         { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', padding: 14, marginBottom: 10, gap: 14 },
  avatarWrap:  { width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, position: 'relative' },
  avatarInner: { width: '100%', height: '100%', borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  onlineDot:   { position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: 6, backgroundColor: '#4ADE80', borderWidth: 2, borderColor: '#09090F' },
  info:        { flex: 1 },
  nameRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name:        { color: '#FFFFFF', fontSize: 15, fontWeight: '600', fontFamily: F.semibold },
  time:        { color: 'rgba(255,255,255,0.25)', fontSize: 11, fontFamily: F.regular },
  distRow:     { flexDirection: 'row', alignItems: 'center', marginTop: 2, marginBottom: 4 },
  dist:        { fontSize: 11, fontWeight: '500' },
  lastMsg:     { color: 'rgba(255,255,255,0.4)', fontSize: 13, lineHeight: 18, fontFamily: F.regular },
  unread:      { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  unreadNum:   { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },

  // Hint
  hint:        { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 20 },
  hintText:    { color: 'rgba(255,255,255,0.18)', fontSize: 11 },
});
