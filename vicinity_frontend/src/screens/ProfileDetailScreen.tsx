import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  Pressable, Animated, TextInput, Easing
} from 'react-native';
import { V } from '../theme/colors';
import BouncyButton from '../widgets/BouncyButton';
import { Ionicons } from '@expo/vector-icons';
import { Person } from '../types';

// ─── Section Label ────────────────────────────────────────────────────────────
interface SectionLabelProps {
  text: string;
}

function SectionLabel({ text }: SectionLabelProps) {
  return <Text style={pl.label}>{text}</Text>;
}

// ─── Info Row ─────────────────────────────────────────────────────────────────
interface InfoRowProps {
  icon: any;
  text: string;
  accent: string;
}

function InfoRow({ icon, text, accent }: InfoRowProps) {
  return (
    <View style={pl.infoRow}>
      <Ionicons name={icon} size={14} color={accent} style={{ marginRight: 8 }} />
      <Text style={pl.infoText}>{text}</Text>
    </View>
  );
}

// ─── Tag Pill ─────────────────────────────────────────────────────────────────
interface TagProps {
  text: string;
}

function Tag({ text }: TagProps) {
  return (
    <View style={pl.tagPill}>
      <Text style={pl.tagText}>{text}</Text>
    </View>
  );
}

// ─── Habit Badge ──────────────────────────────────────────────────────────────
interface HabitBadgeProps {
  emoji: string;
  label: string;
  active: boolean;
  accent: string;
}

function HabitBadge({ emoji, label, active, accent }: HabitBadgeProps) {
  return (
    <View style={[pl.habitBadge, active
      ? { backgroundColor: `${accent}18`, borderColor: `${accent}40` }
      : { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }
    ]}>
      <Text style={{ fontSize: 14 }}>{emoji}</Text>
      <Text style={[pl.habitText, { color: active ? '#FFFFFF' : 'rgba(255,255,255,0.3)' }]}>{label}</Text>
    </View>
  );
}

const pl = StyleSheet.create({
  label: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 24,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    flex: 1,
  },
  tagPill: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 6,
    marginRight: 7,
    marginBottom: 7,
  },
  tagText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  habitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flex: 1,
    justifyContent: 'center',
  },
  habitText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

// ─── Profile Detail Screen ────────────────────────────────────────────────────
interface ProfileDetailScreenProps {
  profile: Person | null;
  onBack: () => void;
  onNudgeSent: (msg: string) => void;
}

export default function ProfileDetailScreen({ profile, onBack, onNudgeSent }: ProfileDetailScreenProps) {
  const [nudgeMessage, setNudgeMessage] = useState("i love fred again too! let's grab a drink?");
  const [isNudged, setIsNudged] = useState(false);

  // Vinyl spin
  const spinVal = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(spinVal, { toValue: 1, duration: 6000, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, []);
  const spin = spinVal.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  // Header entrance
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerY = useRef(new Animated.Value(-16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(headerY, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const handleNudge = () => {
    if (nudgeMessage.trim()) {
      setIsNudged(true);
      onNudgeSent(nudgeMessage.trim());
    }
  };

  if (!profile) return null;
  const accent = profile.favColor || V.coral;

  return (
    <View style={s.screen}>
      {/* Top header */}
      <Animated.View style={[s.header, { opacity: headerOpacity, transform: [{ translateY: headerY }] }]}>
        <Pressable onPress={onBack} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.7)" />
        </Pressable>
        <Text style={s.headerWord}>Profile</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── Hero banner ── */}
        <View style={[s.heroBanner, { borderColor: `${accent}22` }]}>
          <View style={[s.heroGlow, { backgroundColor: accent }]} />
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400' }}
            style={s.heroAvatar}
          />
          <View style={s.heroInfo}>
            <Text style={s.heroName}>{profile.name}, {profile.age}</Text>
            <Text style={s.heroCollege}>{profile.college}</Text>
            <View style={s.heroPills}>
              <View style={[s.distPill, { backgroundColor: `${accent}18`, borderColor: `${accent}40` }]}>
                <Ionicons name="location-outline" size={10} color={accent} />
                <Text style={[s.distText, { color: accent }]}> ~{profile.distance}m away</Text>
              </View>
            </View>
          </View>
          {/* Match % ring */}
          <View style={[s.matchRing, { borderColor: `${accent}55` }]}>
            <Text style={[s.matchPct, { color: accent }]}>{profile.matchPercent}%</Text>
            <Text style={s.matchLbl}>match</Text>
          </View>
        </View>

        {/* ── Their line ── */}
        <View style={s.quoteCard}>
          <Text style={s.quoteOpen}>"</Text>
          <Text style={s.quoteText}>{profile.prompt}</Text>
        </View>

        {/* ── Now playing ── */}
        <SectionLabel text="Anthem" />
        <View style={s.card}>
          <View style={s.musicRow}>
            {/* Spinning vinyl */}
            <View style={s.vinylWrap}>
              <Animated.View style={[s.vinyl, { transform: [{ rotate: spin }] }]}>
                <View style={[s.vinylCenter, { backgroundColor: accent }]} />
              </Animated.View>
              <Image
                source={{ uri: 'https://i.scdn.co/image/ab67616d0000b273b5e1cf58a5be715be0d64db9' }}
                style={s.albumArt}
              />
            </View>
            <View style={s.musicMeta}>
              <Text style={s.songTitle} numberOfLines={1}>
                {profile.playlist.split('—')[0].trim()}
              </Text>
              <Text style={s.songArtist} numberOfLines={1}>
                {profile.artist.split(',')[0].trim()}
              </Text>
              {/* progress bar */}
              <View style={s.progressBg}>
                <View style={[s.progressFill, { backgroundColor: accent, width: '35%' }]} />
                <View style={[s.progressThumb, { backgroundColor: accent, left: '35%' }]} />
              </View>
            </View>
          </View>
        </View>

        {/* ── Likes & vibes ── */}
        <SectionLabel text="Their World" />
        <View style={s.card}>
          <InfoRow icon="film-outline" text={profile.movie} accent={accent} />
          <InfoRow icon="location-outline" text={profile.spots} accent={accent} />
        </View>

        {/* ── Common tags ── */}
        <SectionLabel text="You both like" />
        <View style={s.tagsWrap}>
          {['Fred again..', 'Back Bar', '2am drives', 'Interstellar'].map(t => (
            <Tag key={t} text={t} />
          ))}
        </View>

        {/* ── Habits ── */}
        <SectionLabel text="Lifestyle" />
        <View style={s.habitsRow}>
          <HabitBadge emoji="🍹" label="Drinker" active={profile.drinker} accent={accent} />
          <View style={{ width: 10 }} />
          <HabitBadge emoji="🚬" label="Smoker" active={profile.smoker} accent={accent} />
        </View>

        {/* ── Nudge ── */}
        <SectionLabel text="Send a nudge" />
        {!isNudged ? (
          <View style={s.nudgeRow}>
            <TextInput
              style={s.nudgeInput}
              value={nudgeMessage}
              onChangeText={setNudgeMessage}
              placeholder="Say something…"
              placeholderTextColor="rgba(255,255,255,0.18)"
            />
            <BouncyButton onTap={handleNudge} style={[s.nudgeBtn, { backgroundColor: accent }]}>
              <Ionicons name="arrow-up" size={18} color="#fff" />
            </BouncyButton>
          </View>
        ) : (
          <View style={[s.nudgeSent, { borderColor: `${accent}55` }]}>
            <Ionicons name="checkmark-circle-outline" size={16} color={accent} />
            <Text style={[s.nudgeSentText, { color: accent }]}>Nudge sent — waiting for them</Text>
          </View>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#09090F' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerWord: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },

  // ── Hero ──
  heroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  heroGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    top: -30,
    left: -30,
    opacity: 0.08,
  },
  heroAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  heroInfo: { flex: 1, marginLeft: 14 },
  heroName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  heroCollege: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    marginTop: 2,
  },
  heroPills: { flexDirection: 'row', marginTop: 8 },
  distPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  distText: { fontSize: 10, fontWeight: '600' },
  matchRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  matchPct: { fontSize: 16, fontWeight: '700' },
  matchLbl: { color: 'rgba(255,255,255,0.3)', fontSize: 8, marginTop: 1 },

  // ── Quote ──
  quoteCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  quoteOpen: {
    color: V.coral,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 28,
    marginRight: 6,
  },
  quoteText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    fontStyle: 'italic',
    flex: 1,
    lineHeight: 21,
    paddingTop: 4,
  },

  // ── Card ──
  card: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16,
  },

  // ── Music ──
  musicRow: { flexDirection: 'row', alignItems: 'center' },
  vinylWrap: { width: 70, height: 70, justifyContent: 'center' },
  vinyl: {
    position: 'absolute',
    right: -8,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vinylCenter: { width: 18, height: 18, borderRadius: 9 },
  albumArt: { width: 60, height: 60, borderRadius: 8 },
  musicMeta: { flex: 1, marginLeft: 18 },
  songTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  songArtist: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 },
  progressBg: {
    marginTop: 12,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    position: 'relative',
  },
  progressFill: { height: 3, borderRadius: 2 },
  progressThumb: {
    position: 'absolute',
    top: -3.5,
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: -5,
  },

  // ── Tags ──
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap' },

  // ── Habits ──
  habitsRow: { flexDirection: 'row' },

  // ── Nudge ──
  nudgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  nudgeInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    height: 46,
    outlineStyle: 'none',
  } as any,
  nudgeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  nudgeSent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    backgroundColor: 'rgba(128,24,39,0.06)',
  },
  nudgeSentText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
