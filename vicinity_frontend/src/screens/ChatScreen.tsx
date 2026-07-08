import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TextInput, Pressable, Image, Animated, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { V } from '../theme/colors';
import { F } from '../theme/fonts';
import BouncyButton from '../widgets/BouncyButton';
import { Ionicons } from '@expo/vector-icons';
import { Person } from '../types';

// ─── Nearby Hotspots list ──────────────────────────────────────────────────────
const HOTSPOTS = [
  { id: '1', name: 'Back Bar', distance: '32m', vibe: 'Cozy patio, craft cocktails' },
  { id: '2', name: 'Joe Coffee Company', distance: '80m', vibe: 'Warm seating, excellent espresso' },
  { id: '3', name: 'Columbia Library', distance: '120m', vibe: 'Quiet study tables, great coffee' },
  { id: '4', name: 'TBA Club', distance: '150m', vibe: 'Electronic beats, dark dance floor' },
];

interface ChatMessage {
  id: number;
  sender: 'me' | 'them' | 'system' | 'location';
  text?: string;
  placeName?: string;
  distance?: string;
  vibe?: string;
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
interface BubbleProps {
  msg: ChatMessage;
  accent: string;
}

function Bubble({ msg, accent }: BubbleProps) {
  const isMe = msg.sender === 'me';
  const op   = useRef(new Animated.Value(0)).current;
  const ty   = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(op, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(ty, { toValue: 0, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[b.row, isMe ? b.rowMe : b.rowThem, { opacity: op, transform: [{ translateY: ty }] }]}>
      <View style={[b.bubble,
        isMe ? [b.bubbleMe, { backgroundColor: accent }] : b.bubbleThem,
      ]}>
        <Text style={[b.text, isMe ? b.textMe : b.textThem]}>{msg.text}</Text>
      </View>
    </Animated.View>
  );
}

const b = StyleSheet.create({
  row:       { marginBottom: 10, flexDirection: 'row' },
  rowMe:     { justifyContent: 'flex-end' },
  rowThem:   { justifyContent: 'flex-start' },
  bubble:    { maxWidth: '76%', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20 },
  bubbleMe:  { borderBottomRightRadius: 5 } as any,
  bubbleThem:{ backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderBottomLeftRadius: 5 },
  text:      { fontSize: 14, lineHeight: 20, fontFamily: F.regular },
  textMe:    { color: '#FFFFFF' },
  textThem:  { color: 'rgba(255,255,255,0.8)' },
});

// ─── Unlock Flash Overlay ─────────────────────────────────────────────────────
interface UnlockFlashProps {
  visible: boolean;
}

function UnlockFlash({ visible }: UnlockFlashProps) {
  const op = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(op, { toValue: 0.85, duration: 180, useNativeDriver: true }),
        Animated.timing(op, { toValue: 0,    duration: 600, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF', opacity: op, zIndex: 999 }]}
    />
  );
}

// ─── Chat Screen ──────────────────────────────────────────────────────────────
interface ChatScreenProps {
  profile: Person | null;
  isUnlocked: boolean;
  onUnlock: () => void;
  onOpenCompass: () => void;
  onBack: () => void;
}

export default function ChatScreen({ profile, isUnlocked, onUnlock, onOpenCompass, onBack }: ChatScreenProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, sender: 'them', text: "hey! i saw we both listen to fred again.." },
    { id: 2, sender: 'me',   text: "yes! places is my absolute favorite anthem right now." },
    { id: 3, sender: 'them', text: "same! let's meet up and grab a drink at back bar?" },
  ]);
  const [inputText, setInputText]   = useState('');
  const [showFlash, setShowFlash]   = useState(false);
  const [revealed,  setRevealed]    = useState(isUnlocked);
  const [showPlaces, setShowPlaces] = useState(false);

  // Blur → unblur animated value
  const blurAnim    = useRef(new Animated.Value(isUnlocked ? 0 : 1)).current;
  const revealScale = useRef(new Animated.Value(1)).current;
  // Card pop
  const cardScale   = useRef(new Animated.Value(1)).current;

  // When isUnlocked changes, fire the reveal animation
  useEffect(() => {
    if (isUnlocked && !revealed) {
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 900);
      setTimeout(() => {
        setRevealed(true);
        Animated.parallel([
          Animated.timing(blurAnim,    { toValue: 0, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
          Animated.sequence([
            Animated.timing(revealScale, { toValue: 1.05, duration: 200, useNativeDriver: true }),
            Animated.spring(revealScale, { toValue: 1, friction: 5, useNativeDriver: true }),
          ]),
        ]).start();
        // Add system message to chat
        setMessages(prev => [
          ...prev,
          { id: Date.now(), sender: 'system', text: "🎉 You're matched! Photos and compass are now active." },
        ]);
      }, 300);
    }
  }, [isUnlocked]);

  const handleSuggestPlace = (place: typeof HOTSPOTS[0]) => {
    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        sender: 'location',
        placeName: place.name,
        distance: place.distance,
        vibe: place.vibe,
      }
    ]);
    setShowPlaces(false);
  };

  const popCard = () => {
    Animated.sequence([
      Animated.timing(cardScale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();
  };

  const handleSend = () => {
    if (inputText.trim()) {
      setMessages(prev => [...prev, { id: Date.now(), sender: 'me', text: inputText.trim() }]);
      setInputText('');
    }
  };

  const accent = profile?.favColor || V.coral;

  return (
    <View style={s.screen}>
      {/* Depth gradient */}
      <LinearGradient
        colors={['#0F0F1E', '#09090F', '#09090F']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Unlock flash overlay */}
      <UnlockFlash visible={showFlash} />

      {/* ── Header ── */}
      <View style={s.header}>
        <Pressable onPress={onBack} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.6)" />
        </Pressable>

        <View style={s.headerCenter}>
          <Animated.View style={[s.avatarWrap, { borderColor: `${accent}66`, transform: [{ scale: revealScale }] }]}>
            {revealed ? (
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' }}
                style={s.avatar}
              />
            ) : (
              <View style={[s.avatarBlur, { backgroundColor: `${accent}20` }]}>
                <Ionicons name="person" size={20} color={`${accent}60`} />
              </View>
            )}
            {revealed && (
              <View style={[s.unlockBadge, { backgroundColor: accent }]}>
                <Ionicons name="heart" size={8} color="#fff" />
              </View>
            )}
          </Animated.View>

          <View style={s.headerMeta}>
            <Text style={s.headerName}>{profile?.name}</Text>
            <View style={s.activeRow}>
              <View style={s.activeDot} />
              <Text style={s.activeText}>nearby now</Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={isUnlocked ? onOpenCompass : null}
          style={[s.compassBtn,
            isUnlocked
              ? { backgroundColor: `${accent}25`, borderColor: `${accent}55` }
              : s.compassBtnLocked,
          ]}
        >
          <Ionicons
            name={(isUnlocked ? 'compass-outline' : 'lock-closed-outline') as any}
            size={17}
            color={isUnlocked ? accent : 'rgba(255,255,255,0.2)'}
          />
        </Pressable>
      </View>

      {/* ── Places / Hotspots Dropdown ── */}
      {revealed && (
        <View style={s.placesContainer}>
          <Pressable onPress={() => setShowPlaces(p => !p)} style={s.placesHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="location-outline" size={15} color={accent} />
              <Text style={[s.placesHeaderText, { color: accent }]}>Suggest a place to meet...</Text>
            </View>
            <Ionicons name={showPlaces ? "chevron-up" : "chevron-down"} size={15} color="rgba(255,255,255,0.4)" />
          </Pressable>
          {showPlaces && (
            <View style={s.placesDropdown}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.placesScroll}>
                {HOTSPOTS.map(place => (
                  <Pressable
                    key={place.id}
                    onPress={() => handleSuggestPlace(place)}
                    style={[s.placeChip, { borderColor: `${accent}40` }]}
                  >
                    <Text style={s.placeChipName}>{place.name}</Text>
                    <Text style={s.placeChipDist}>{place.distance} · {place.vibe}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      )}

      {/* ── Messages ── */}
      <ScrollView contentContainerStyle={s.messages} showsVerticalScrollIndicator={false}>
        <View style={s.dateChip}>
          <Text style={s.dateText}>Today</Text>
        </View>
        {messages.map(msg => {
          if (msg.sender === 'system') {
            return (
              <View key={msg.id} style={s.systemMsg}>
                <Text style={s.systemMsgText}>{msg.text}</Text>
              </View>
            );
          } else if (msg.sender === 'location') {
            return (
              <View key={msg.id} style={[s.locationCard, { borderColor: `${accent}35` }]}>
                <View style={s.locHeader}>
                  <Ionicons name="location" size={16} color={accent} style={{ marginRight: 6 }} />
                  <Text style={s.locTitle}>{msg.placeName}</Text>
                </View>
                <Text style={s.locVibe}>{msg.vibe} · {msg.distance} away</Text>
                <View style={s.locActionRow}>
                  <Pressable style={[s.locBtn, { backgroundColor: accent }]}>
                    <Text style={s.locBtnText}>Let's go!</Text>
                  </Pressable>
                </View>
              </View>
            );
          } else {
            return <Bubble key={msg.id} msg={msg} accent={accent} />;
          }
        })}
      </ScrollView>

      {/* ── Match / Compass Card ── */}
      <Animated.View style={[s.unlockCard, { transform: [{ scale: cardScale }], borderColor: isUnlocked ? `${accent}30` : 'rgba(255,255,255,0.07)' }]}>
        {isUnlocked ? (
          <View style={s.unlockRow}>
            <View style={[s.unlockIconBox, { backgroundColor: `${accent}18`, borderColor: `${accent}35` }]}>
              <Ionicons name="sparkles-outline" size={16} color={accent} />
            </View>
            <View style={s.unlockMeta}>
              <Text style={s.unlockTitle}>You're matched! ✨</Text>
              <Text style={s.unlockSub}>Photos revealed · Compass active</Text>
            </View>
            <BouncyButton onTap={onOpenCompass} style={[s.unlockBtn, { backgroundColor: accent, shadowColor: accent }]}>
              <Ionicons name="compass-outline" size={16} color="#fff" />
            </BouncyButton>
          </View>
        ) : (
          <Pressable onPress={() => { popCard(); onUnlock(); }}>
            <View style={s.unlockRow}>
              <View style={s.unlockIconBox}>
                <Ionicons name="heart-outline" size={16} color="rgba(255,255,255,0.35)" />
              </View>
              <View style={s.unlockMeta}>
                <Text style={s.unlockTitle}>Match and meet</Text>
                <Text style={s.unlockSub}>Reveal photos & compass to meet up</Text>
              </View>
              <View style={[s.unlockBtn, { backgroundColor: accent, shadowColor: accent }]}>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </View>
            </View>
          </Pressable>
        )}
      </Animated.View>

      {/* ── Input bar ── */}
      <View style={s.inputBar}>
        <View style={s.inputWrap}>
          <TextInput
            style={s.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Message…"
            placeholderTextColor="rgba(255,255,255,0.2)"
            onSubmitEditing={handleSend}
          />
        </View>
        <BouncyButton
          onTap={handleSend}
          style={[s.sendBtn, { backgroundColor: inputText.trim() ? accent : 'rgba(255,255,255,0.06)' }]}
        >
          <Ionicons name="arrow-up" size={18} color={inputText.trim() ? '#fff' : 'rgba(255,255,255,0.2)'} />
        </BouncyButton>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#09090F' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 12 },
  avatarWrap:   { width: 40, height: 40, borderRadius: 20, borderWidth: 2, overflow: 'visible', position: 'relative' },
  avatar:       { width: 40, height: 40, borderRadius: 20 },
  avatarBlur:   { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  unlockBadge:  { position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: 7, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#09090F' },
  headerMeta:   { flex: 1 },
  headerName:   { color: '#FFFFFF', fontSize: 15, fontWeight: '600', fontFamily: F.semibold },
  activeRow:    { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  activeDot:    { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ADE80' },
  activeText:   { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: F.regular },
  compassBtn:   { width: 38, height: 38, borderRadius: 19, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  compassBtnLocked: { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' },

  // Messages
  messages: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10, flexGrow: 1 },
  dateChip: { alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 16 },
  dateText: { color: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: F.regular },
  systemMsg:     { alignSelf: 'center', backgroundColor: 'rgba(74,222,128,0.1)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(74,222,128,0.25)', paddingHorizontal: 14, paddingVertical: 8, marginBottom: 12 },
  systemMsgText: { color: 'rgba(74,222,128,0.9)', fontSize: 12, textAlign: 'center', fontFamily: F.medium },

  // Unlock card
  unlockCard: { marginHorizontal: 16, marginVertical: 10, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, borderWidth: 1, padding: 14 },
  unlockRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  unlockIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  unlockMeta:  { flex: 1 },
  unlockTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '600', fontFamily: F.semibold },
  unlockSub:   { color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 2, fontFamily: F.regular },
  unlockBtn:   { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10 },

  // Input
  inputBar:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  inputWrap: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 16, height: 44, justifyContent: 'center' },
  input:     { color: '#FFFFFF', fontSize: 14, height: '100%', outlineStyle: 'none', fontFamily: F.regular } as any,
  sendBtn:   { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },

  // Places suggestions dropdown
  placesContainer: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.02)' },
  placesHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  placesHeaderText:{ fontSize: 13, fontWeight: '600', fontFamily: F.semibold },
  placesDropdown:  { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)', paddingVertical: 10, backgroundColor: 'rgba(0,0,0,0.15)' },
  placesScroll:    { paddingHorizontal: 16, gap: 10 },
  placeChip:       { borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.04)', minWidth: 140 },
  placeChipName:   { color: '#FFFFFF', fontSize: 13, fontWeight: '600', fontFamily: F.semibold },
  placeChipDist:   { color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 2, fontFamily: F.regular },

  // Location suggestions cards inside chat
  locationCard: { alignSelf: 'flex-start', maxWidth: '80%', padding: 14, borderRadius: 20, borderBottomLeftRadius: 5, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, marginBottom: 12, gap: 8 },
  locHeader:    { flexDirection: 'row', alignItems: 'center' },
  locTitle:     { color: '#FFFFFF', fontSize: 14, fontWeight: '600', fontFamily: F.semibold },
  locVibe:      { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: F.regular },
  locActionRow: { flexDirection: 'row', marginTop: 4 },
  locBtn:       { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, minWidth: 90, alignItems: 'center' },
  locBtnText:   { color: '#FFFFFF', fontSize: 12, fontWeight: '600', fontFamily: F.semibold },
});
