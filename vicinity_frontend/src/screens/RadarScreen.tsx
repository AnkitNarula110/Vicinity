import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Pressable, Animated, Easing, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { V } from '../theme/colors';
import { F } from '../theme/fonts';
import BouncyButton from '../widgets/BouncyButton';
import { Ionicons } from '@expo/vector-icons';
import ArcRing from '../components/ArcRing';
import { Person, UserProfile } from '../types';

// ─── Mock nearby people ────────────────────────────────────────────────────────
const NEARBY: Person[] = [
  {
    id: '1', name: 'Chloe',  age: '20', college: 'Columbia University',
    distance: 32,  matchPercent: 87, favColor: '#801827',
    mood: '☕  Coffee & talk',
    vibes: ['Night owl', 'Artsy', 'Bookworm'],
    prompt: "i'd make you my 2am playlist",
    playlist: 'Sweater Weather — The Neighbourhood', artist: 'The Neighbourhood, Arctic Monkeys',
    movie: 'Interstellar, Euphoria', spots: 'Columbia Library, Back Bar',
    smoker: false, drinker: true, direction: 45, picsUnlocked: false,
  },
  {
    id: '2', name: 'Maya',   age: '22', college: 'NYU Stern',
    distance: 85,  matchPercent: 74, favColor: '#D97706',
    mood: '🍸  Drinks & dancing',
    vibes: ['Extrovert', 'Fashionable', 'Foodie'],
    prompt: "will always suggest the restaurant, never regret it",
    playlist: 'Blinding Lights — The Weeknd', artist: 'The Weeknd, Doja Cat',
    movie: 'La La Land, Sex Education', spots: 'Soho House, Eataly',
    smoker: false, drinker: true, direction: 120, picsUnlocked: false,
  },
  {
    id: '3', name: 'Aryan',  age: '21', college: 'NYU Tisch',
    distance: 140, matchPercent: 62, favColor: '#0D9488',
    mood: '🚶  Walk & explore',
    vibes: ['Introvert', 'Musician', 'Creative'],
    prompt: "I write songs about people I've never met",
    playlist: 'Solar Power — Lorde', artist: 'Lorde, Clairo, Frank Ocean',
    movie: 'Moonlight, Call Me By Your Name', spots: 'Washington Square, McNally Jackson',
    smoker: false, drinker: false, direction: 200, picsUnlocked: false,
  },
  {
    id: '4', name: 'Zara',   age: '23', college: 'Parsons School of Design',
    distance: 210, matchPercent: 79, favColor: '#4F2D7F',
    mood: '✨  Surprise me',
    vibes: ['Artsy', 'Traveler', 'Spontaneous'],
    prompt: "I'll drag you to every gallery opening I find",
    playlist: 'Espresso — Sabrina Carpenter', artist: 'Sabrina Carpenter, Olivia Rodrigo',
    movie: 'Portrait of a Lady on Fire, Amélie', spots: 'Chelsea Gallery, The Highline',
    smoker: false, drinker: true, direction: 300, picsUnlocked: false,
  },
];

// ─── Wave Particle ─────────────────────────────────────────────────────────────
interface WaveParticleProps {
  color: string;
  angle: number;
  dist: number;
  onDone: () => void;
}

function WaveParticle({ color, angle, dist, onDone }: WaveParticleProps) {
  const op = useRef(new Animated.Value(1)).current;
  const tx = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(0)).current;
  const sc = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(tx, { toValue: Math.cos(angle) * dist, duration: 550, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(ty, { toValue: Math.sin(angle) * dist, duration: 550, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(op, { toValue: 0, duration: 550, useNativeDriver: true }),
      Animated.timing(sc, { toValue: 0.2, duration: 550, useNativeDriver: true }),
    ]).start(onDone);
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: 8, height: 8, borderRadius: 4,
        backgroundColor: color,
        opacity: op,
        transform: [{ translateX: tx }, { translateY: ty }, { scale: sc }],
        top: '50%', left: '50%',
        marginLeft: -4, marginTop: -4,
      }}
    />
  );
}

const getProfilePic = (id: string) => {
  switch (id) {
    case '1': return 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500';
    case '2': return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500';
    case '3': return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500';
    case '4': return 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500';
    default:  return 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=500';
  }
};

// ─── Person Card ───────────────────────────────────────────────────────────────
interface PersonCardProps {
  person: Person;
  isMatched: boolean;
  onView: (person: Person) => void;
  onWave: (person: Person) => void;
  waved: boolean;
  index: number;
}

function PersonCard({ person, isMatched, onView, onWave, waved, index }: PersonCardProps) {
  const accent  = person.favColor;
  const scale   = useRef(new Animated.Value(0.92)).current;
  const op      = useRef(new Animated.Value(0)).current;
  const [particles, setParticles] = useState<{ id: number; angle: number; dist: number }[]>([]);
  const [waveScale] = useState(new Animated.Value(1));

  // Hover animations
  const [waveHovered, setWaveHovered] = useState(false);
  const [viewHovered, setViewHovered] = useState(false);
  const viewArrowX   = useRef(new Animated.Value(0)).current;
  const viewScale    = useRef(new Animated.Value(1)).current;
  const waveBtnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const delay = index * 90;
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(op,    { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 7, tension: 50, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const handleWave = () => {
    if (waved) return;
    onWave(person);
    // Burst 8 particles
    const newParticles = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i,
      angle: (i / 8) * Math.PI * 2,
      dist: 28 + Math.random() * 18,
    }));
    setParticles(newParticles);
    // Button bounce
    Animated.sequence([
      Animated.timing(waveScale, { toValue: 0.8, duration: 100, useNativeDriver: true }),
      Animated.spring(waveScale, { toValue: 1.15, friction: 4, tension: 120, useNativeDriver: true }),
      Animated.timing(waveScale, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
    setTimeout(() => setParticles([]), 700);
  };

  return (
    <Animated.View style={[c.card, { opacity: op, transform: [{ scale }] }]}>
      {/* Photo section */}
      <View style={c.photo}>
        {isMatched ? (
          <Image
            source={{ uri: getProfilePic(person.id) }}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View style={StyleSheet.absoluteFill}>
            <Image
              source={{ uri: getProfilePic(person.id) }}
              style={[StyleSheet.absoluteFill, { opacity: 0.7 }]}
            />
            <LinearGradient
              colors={['transparent', 'rgba(9,9,15,0.88)']}
              start={{ x: 0.5, y: 0.2 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </View>
        )}

        {/* Lock / Match badge */}
        {isMatched ? (
          <View style={[c.lockBadge, { backgroundColor: 'rgba(74,222,128,0.15)', borderColor: '#4ADE80' }]}>
            <Ionicons name="heart" size={10} color="#4ADE80" style={{ marginRight: 2 }} />
            <Text style={[c.lockText, { color: '#4ADE80' }]}>Matched</Text>
          </View>
        ) : (
          <View style={[c.lockBadge, { backgroundColor: 'rgba(0,0,0,0.55)', borderColor: `${accent}40` }]}>
            <Ionicons name="sparkles" size={10} color={`${accent}CC`} style={{ marginRight: 2 }} />
            <Text style={[c.lockText, { color: `${accent}CC` }]}>Revealed on match</Text>
          </View>
        )}

        {/* Arc match ring — top right */}
        <View style={c.arcWrap}>
          <ArcRing percent={person.matchPercent} size={60} strokeWidth={4.5} color={accent} />
        </View>
      </View>

      {/* Info */}
      <View style={c.info}>
        <View style={c.nameRow}>
          <Text style={c.name}>{person.name}, {person.age}</Text>
          <View style={[c.distBadge, { backgroundColor: `${accent}15`, borderColor: `${accent}40` }]}>
            <Ionicons name="location-outline" size={10} color={accent} />
            <Text style={[c.distText, { color: accent }]}>~{person.distance}m</Text>
          </View>
        </View>

        <Text style={c.college}>{person.college}</Text>
        <Text style={c.mood}>{person.mood}</Text>

        <View style={c.tagRow}>
          {person.vibes.map(v => (
            <View key={v} style={c.tag}>
              <Text style={c.tagText}>{v}</Text>
            </View>
          ))}
        </View>

        <View style={[c.quoteWrap, { borderLeftColor: `${accent}70` }]}>
          <Text style={c.quote} numberOfLines={2}>"{person.prompt}"</Text>
        </View>

        <View style={c.divider} />

        {/* Actions */}
        <View style={c.actions}>
          {/* Wave button with particle burst */}
          <View style={{ flex: 1, position: 'relative' }}>
            {particles.map(p => (
              <WaveParticle key={p.id} color={accent} angle={p.angle} dist={p.dist} onDone={() => {}} />
            ))}
            <Animated.View style={{ transform: [{ scale: Animated.multiply(waveScale, waveBtnScale) }] }}>
              <Pressable
                onPress={handleWave}
                onHoverIn={() => {
                  setWaveHovered(true);
                  Animated.timing(waveBtnScale, { toValue: 1.03, duration: 150, useNativeDriver: true }).start();
                }}
                onHoverOut={() => {
                  setWaveHovered(false);
                  Animated.timing(waveBtnScale, { toValue: 1.0, duration: 150, useNativeDriver: true }).start();
                }}
                style={[c.waveBtn,
                  waved
                    ? { backgroundColor: `${accent}20`, borderColor: `${accent}60` }
                    : {
                        backgroundColor: waveHovered ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
                        borderColor: waveHovered ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)'
                      }
                ]}
              >
                <Text style={{ fontSize: 15 }}>👋</Text>
                <Text style={[c.waveBtnText, { color: waved ? accent : 'rgba(255,255,255,0.5)' }]}>
                  {waved ? 'Waved!' : 'Wave'}
                </Text>
              </Pressable>
            </Animated.View>
          </View>

          <Pressable
            onPress={() => onView(person)}
            onHoverIn={() => {
              setViewHovered(true);
              Animated.parallel([
                Animated.timing(viewScale, { toValue: 1.03, duration: 150, useNativeDriver: true }),
                Animated.timing(viewArrowX, { toValue: 4, duration: 150, useNativeDriver: true }),
              ]).start();
            }}
            onHoverOut={() => {
              setViewHovered(false);
              Animated.parallel([
                Animated.timing(viewScale, { toValue: 1.0, duration: 150, useNativeDriver: true }),
                Animated.timing(viewArrowX, { toValue: 0, duration: 150, useNativeDriver: true }),
              ]).start();
            }}
            style={{ flex: 2 }}
          >
            <Animated.View style={[c.viewBtn, {
              backgroundColor: accent,
              transform: [{ scale: viewScale }],
              // @ts-ignore
              boxShadow: viewHovered ? `0 6px 20px ${accent}60` : `0 4px 12px ${accent}30`,
            } as any]}>
              <Text style={c.viewBtnText}>View profile</Text>
              <Animated.View style={{ transform: [{ translateX: viewArrowX }], marginLeft: 6 }}>
                <Ionicons name="arrow-forward" size={14} color="#fff" />
              </Animated.View>
            </Animated.View>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const c = StyleSheet.create({
  card:      { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginHorizontal: 16, marginBottom: 14, overflow: 'hidden' },
  photo:     { height: 168, justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' },
  lockBadge: { position: 'absolute', bottom: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  lockText:  { fontSize: 10, fontWeight: '600' },
  arcWrap:   { position: 'absolute', top: 12, right: 12 },
  info:      { padding: 16 },
  nameRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name:      { color: '#FFFFFF', fontSize: 19, fontWeight: '700', letterSpacing: -0.3, fontFamily: F.serif },
  distBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 10, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  distText:  { fontSize: 11, fontWeight: '600', fontFamily: F.semibold },
  college:   { color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 2, fontFamily: F.regular },
  mood:      { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 8, fontFamily: F.regular },
  tagRow:    { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  tag:       { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 10, paddingVertical: 4 },
  tagText:   { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontFamily: F.medium },
  quoteWrap: { borderLeftWidth: 2, paddingLeft: 12, marginTop: 12 },
  quote:     { color: 'rgba(255,255,255,0.45)', fontSize: 13, fontStyle: 'italic', lineHeight: 20, fontFamily: F.regular },
  divider:   { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 12 },
  actions:   { flexDirection: 'row', gap: 10 },
  waveBtn:   { height: 42, borderRadius: 21, borderWidth: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  waveBtnText: { fontSize: 14, fontWeight: '600', fontFamily: F.semibold },
  viewBtn:   { flex: 2, height: 42, borderRadius: 21, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14 },
  viewBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', fontFamily: F.semibold },
});

// ─── Settings Sheet ────────────────────────────────────────────────────────────
const RADII       = ['50m', '200m', '500m', 'Anywhere'];
const SHOW_OPTIONS = ['Everyone', 'Just friends', 'Dating'];

interface DiscoverySettings {
  visible: boolean;
  radius: string;
  showMe: string;
}

interface SettingsSheetProps {
  visible: boolean;
  onClose: () => void;
  accent: string;
  settings: DiscoverySettings;
  setSettings: React.Dispatch<React.SetStateAction<DiscoverySettings>>;
}

function SettingsSheet({ visible, onClose, accent, settings, setSettings }: SettingsSheetProps) {
  const slideY = useRef(new Animated.Value(500)).current;
  const bgOp   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(bgOp,   { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.spring(slideY, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(bgOp,   { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideY, { toValue: 500, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[sh.backdrop, { opacity: bgOp }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[sh.sheet, { transform: [{ translateY: slideY }] }]}>
        <View style={sh.handle} />
        <Text style={sh.title}>Discovery Settings</Text>

        <View style={sh.row}>
          <View>
            <Text style={sh.rowLabel}>Visible to others</Text>
            <Text style={sh.rowSub}>People can see you nearby</Text>
          </View>
          <Pressable
            onPress={() => setSettings(p => ({ ...p, visible: !p.visible }))}
            style={[sh.toggle, settings.visible && { backgroundColor: `${accent}25`, borderColor: `${accent}60` }]}
          >
            <View style={[sh.knob, { backgroundColor: settings.visible ? accent : 'rgba(255,255,255,0.2)', alignSelf: settings.visible ? 'flex-end' : 'flex-start' }]} />
          </Pressable>
        </View>

        <View style={sh.divider} />

        <Text style={sh.sectionLabel}>Discovery radius</Text>
        <View style={sh.chips}>
          {RADII.map(r => (
            <Pressable key={r} onPress={() => setSettings(p => ({ ...p, radius: r }))}
              style={[sh.chip, settings.radius === r && { backgroundColor: `${accent}20`, borderColor: `${accent}60` }]}>
              <Text style={[sh.chipText, { color: settings.radius === r ? '#FFFFFF' : 'rgba(255,255,255,0.4)' }]}>{r}</Text>
            </Pressable>
          ))}
        </View>

        <View style={sh.divider} />

        <Text style={sh.sectionLabel}>Show me</Text>
        <View style={sh.chips}>
          {SHOW_OPTIONS.map(o => (
            <Pressable key={o} onPress={() => setSettings(p => ({ ...p, showMe: o }))}
              style={[sh.chip, settings.showMe === o && { backgroundColor: `${accent}20`, borderColor: `${accent}60` }]}>
              <Text style={[sh.chipText, { color: settings.showMe === o ? '#FFFFFF' : 'rgba(255,255,255,0.4)' }]}>{o}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ height: 24 }} />
        <BouncyButton onTap={onClose} style={[sh.doneBtn, { backgroundColor: accent }]}>
          <Text style={sh.doneBtnText}>Done</Text>
        </BouncyButton>
        <View style={{ height: 16 }} />
      </Animated.View>
    </View>
  );
}

const sh = StyleSheet.create({
  backdrop:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.72)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingTop: 12,
    backgroundColor: 'rgba(14,14,24,0.88)',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  handle:      { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)', alignSelf: 'center', marginBottom: 20 },
  title:       { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginBottom: 20, fontFamily: F.serif },
  row:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel:    { color: '#FFFFFF', fontSize: 14, fontWeight: '500', fontFamily: F.medium },
  rowSub:      { color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 2, fontFamily: F.regular },
  toggle:      { width: 58, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', padding: 2 },
  knob:        { width: 24, height: 24, borderRadius: 12 },
  divider:     { height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginVertical: 18 },
  sectionLabel:{ color: 'rgba(255,255,255,0.3)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600', marginBottom: 12, fontFamily: F.semibold },
  chips:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:        { borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.04)' },
  chipText:    { fontSize: 13, fontWeight: '500', fontFamily: F.medium },
  doneBtn:     { height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  doneBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', fontFamily: F.semibold },
});

// ─── Ambient Top Strip ─────────────────────────────────────────────────────────
interface AmbientStripProps {
  count: number;
  accent: string;
}

function AmbientStrip({ count, accent }: AmbientStripProps) {
  const pulseScale = useRef(new Animated.Value(1)).current;
  const ripple1    = useRef(new Animated.Value(0)).current;
  const ripple2    = useRef(new Animated.Value(0)).current;
  const op         = useRef(new Animated.Value(0)).current;

  // Bobbing animations for dots
  const bobAnims = useRef(NEARBY.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Entrance
    Animated.timing(op, { toValue: 1, duration: 600, useNativeDriver: true }).start();

    // Center pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, { toValue: 1.06, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseScale, { toValue: 1.0, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Expand ripple 1 loop
    Animated.loop(
      Animated.timing(ripple1, {
        toValue: 1,
        duration: 3200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    ).start();

    // Expand ripple 2 loop (delayed by half cycle)
    Animated.loop(
      Animated.sequence([
        Animated.delay(1600),
        Animated.timing(ripple2, {
          toValue: 1,
          duration: 3200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        })
      ])
    ).start();

    // Bobbing dots loop
    bobAnims.forEach((anim, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 240),
          Animated.timing(anim, {
            toValue: 1,
            duration: 1500 + Math.random() * 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 1500 + Math.random() * 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          })
        ])
      ).start();
    });
  }, []);

  const r1Scale = ripple1.interpolate({ inputRange: [0, 1], outputRange: [0.8, 2.2] });
  const r1Op    = ripple1.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 0.45, 0.15, 0] });

  const r2Scale = ripple2.interpolate({ inputRange: [0, 1], outputRange: [0.8, 2.2] });
  const r2Op    = ripple2.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 0.45, 0.15, 0] });

  return (
    <Animated.View style={[a.strip, { opacity: op }]}>
      <LinearGradient
        colors={[`${accent}14`, 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Ripple ring 1 */}
      <Animated.View style={[a.ring, { borderColor: `${accent}40`, opacity: r1Op, transform: [{ scale: r1Scale }] }]} />
      {/* Ripple ring 2 */}
      <Animated.View style={[a.ring, { borderColor: `${accent}25`, opacity: r2Op, transform: [{ scale: r2Scale }] }]} />

      <Animated.View style={[a.center, { backgroundColor: `${accent}18`, borderColor: `${accent}55`, transform: [{ scale: pulseScale }] }]}>
        <Text style={[a.countNum, { color: accent, fontFamily: F.serif }]}>{count}</Text>
      </Animated.View>
      <Text style={[a.label, { fontFamily: F.regular }]}>people nearby right now</Text>
      
      <View style={a.dotsRow}>
        {NEARBY.map((p, i) => {
          const bobY = bobAnims[i].interpolate({ inputRange: [0, 1], outputRange: [-2.5, 2.5] });
          return (
            <Animated.View key={p.id} style={{ transform: [{ translateY: bobY }] }}>
              <View style={[a.dot, { backgroundColor: p.favColor }]} />
            </Animated.View>
          );
        })}
      </View>
    </Animated.View>
  );
}

const a = StyleSheet.create({
  strip:    { alignItems: 'center', paddingVertical: 24, paddingBottom: 16, position: 'relative', overflow: 'hidden' },
  ring:     { position: 'absolute', width: 90, height: 90, borderRadius: 45, borderWidth: 1.5, top: 8 },
  center:   { width: 58, height: 58, borderRadius: 29, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 8, backgroundColor: '#09090F' },
  countNum: { fontSize: 26, fontWeight: '700' },
  label:    { color: 'rgba(255,255,255,0.35)', fontSize: 11, letterSpacing: 0.2 },
  dotsRow:  { flexDirection: 'row', gap: 9, marginTop: 12, height: 16, alignItems: 'center' },
  dot:      { width: 8, height: 8, borderRadius: 4 },
});

// ─── Toast notification ────────────────────────────────────────────────────────
interface WaveToastProps {
  visible: boolean;
  name: string | null;
}

function WaveToast({ visible, name }: WaveToastProps) {
  const op  = useRef(new Animated.Value(0)).current;
  const ty  = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(op, { toValue: 1, duration: 280, useNativeDriver: true }),
          Animated.timing(ty, { toValue: 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]),
        Animated.delay(2000),
        Animated.parallel([
          Animated.timing(op, { toValue: 0, duration: 280, useNativeDriver: true }),
          Animated.timing(ty, { toValue: -20, duration: 280, useNativeDriver: true }),
        ]),
      ]).start();
    }
  }, [visible, name]);

  return (
    <Animated.View style={[t.toast, { opacity: op, transform: [{ translateY: ty }] }]}>
      <Text style={t.toastText}>👋 Wave sent to {name}!</Text>
    </Animated.View>
  );
}

const t = StyleSheet.create({
  toast:     { position: 'absolute', top: 14, alignSelf: 'center', backgroundColor: 'rgba(20,20,34,0.95)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 18, paddingVertical: 10, zIndex: 999 },
  toastText: { color: '#FFFFFF', fontSize: 13, fontWeight: '500', fontFamily: F.medium },
});

// ─── Main Radar Screen ─────────────────────────────────────────────────────────
interface RadarScreenProps {
  userProfile: UserProfile | null;
  isMatched: boolean;
  onViewProfile: (person: Person) => void;
  onOpenMyProfile: () => void;
}

export default function RadarScreen({ userProfile, isMatched, onViewProfile, onOpenMyProfile }: RadarScreenProps) {
  const accent = userProfile?.favColor || V.coral;
  const [wavedIds,     setWavedIds]     = useState<string[]>([]);
  const [lastWaved,    setLastWaved]    = useState<string | null>(null);
  const [showToast,    setShowToast]    = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<DiscoverySettings>({ visible: true, radius: '200m', showMe: 'Everyone' });

  // Header microanimations states
  const settingsRotate = useRef(new Animated.Value(0)).current;
  const settingsScale  = useRef(new Animated.Value(1)).current;
  const avatarScale    = useRef(new Animated.Value(1)).current;
  const [avatarHovered, setAvatarHovered] = useState(false);

  const headerOp = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(headerOp, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const handleWave = (person: Person) => {
    if (wavedIds.includes(person.id)) return;
    setWavedIds(prev => [...prev, person.id]);
    setLastWaved(person.name);
    setShowToast(false);
    setTimeout(() => setShowToast(true), 50);
    setTimeout(() => setShowToast(false), 2600);
  };

  return (
    <View style={s.screen}>
      {/* Depth background gradient */}
      <LinearGradient
        colors={['#0F0F1E', '#09090F', '#09090F']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Wave toast */}
      <WaveToast visible={showToast} name={lastWaved} />

      {/* Header */}
      <Animated.View style={[s.header, { opacity: headerOp }]}>
        <View>
          <Text style={s.headerTitle}>Nearby</Text>
          <Text style={s.headerSub}>People who vibe like you</Text>
        </View>
        <View style={s.headerRight}>
          <View style={s.livePill}>
            <View style={s.liveDot} />
            <Text style={s.liveText}>live</Text>
          </View>
          
          <Pressable
            onPress={() => setShowSettings(true)}
            onHoverIn={() => {
              Animated.parallel([
                Animated.timing(settingsRotate, { toValue: 1, duration: 250, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                Animated.timing(settingsScale, { toValue: 1.1, duration: 150, useNativeDriver: true }),
              ]).start();
            }}
            onHoverOut={() => {
              Animated.parallel([
                Animated.timing(settingsRotate, { toValue: 0, duration: 250, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                Animated.timing(settingsScale, { toValue: 1.0, duration: 150, useNativeDriver: true }),
              ]).start();
            }}
          >
            <Animated.View style={[s.iconBtn, {
              transform: [
                { rotate: settingsRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '30deg'] }) },
                { scale: settingsScale }
              ]
            }]}>
              <Ionicons name="options-outline" size={19} color="rgba(255,255,255,0.7)" />
            </Animated.View>
          </Pressable>

          <Pressable
            onPress={onOpenMyProfile}
            onHoverIn={() => {
              setAvatarHovered(true);
              Animated.timing(avatarScale, { toValue: 1.1, duration: 150, useNativeDriver: true }).start();
            }}
            onHoverOut={() => {
              setAvatarHovered(false);
              Animated.timing(avatarScale, { toValue: 1.0, duration: 150, useNativeDriver: true }).start();
            }}
          >
            <Animated.View style={[s.avatarBtn, {
              borderColor: `${accent}55`,
              transform: [{ scale: avatarScale }],
            }]}>
              <View style={[s.avatarInner, { backgroundColor: `${accent}28` }]}>
                <Text style={s.avatarLetter}>
                  {userProfile?.name ? userProfile.name[0].toUpperCase() : '?'}
                </Text>
              </View>
            </Animated.View>
          </Pressable>
        </View>
      </Animated.View>

      {/* Ambient strip */}
      <AmbientStrip count={NEARBY.length} accent={accent} />

      {/* Section label */}
      <Text style={s.sectionLabel}>Around you</Text>

      {/* Cards */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {NEARBY.map((person, i) => (
          <PersonCard
            key={person.id}
            person={person}
            isMatched={person.id === '1' ? isMatched : false}
            index={i}
            onView={onViewProfile}
            onWave={handleWave}
            waved={wavedIds.includes(person.id)}
          />
        ))}
      </ScrollView>

      {/* Settings sheet */}
      <SettingsSheet
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        accent={accent}
        settings={settings}
        setSettings={setSettings}
      />
    </View>
  );
}

const s = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: '#09090F' },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4 },
  headerTitle: { color: '#FFFFFF', fontSize: 28, fontWeight: '700', letterSpacing: -0.5, fontFamily: F.serif },
  headerSub:   { color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 2, fontFamily: F.regular },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  livePill:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(74,222,128,0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(74,222,128,0.25)', paddingHorizontal: 10, paddingVertical: 4 },
  liveDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ADE80' },
  liveText:    { color: 'rgba(255,255,255,0.55)', fontSize: 11, letterSpacing: 0.5, fontFamily: F.medium },
  iconBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  avatarBtn:   { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, overflow: 'hidden' },
  avatarInner: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  avatarLetter:{ color: '#FFFFFF', fontSize: 15, fontWeight: '700', fontFamily: F.bold },
  sectionLabel:{ color: 'rgba(255,255,255,0.2)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600', paddingHorizontal: 20, marginBottom: 8, fontFamily: F.semibold },
});
