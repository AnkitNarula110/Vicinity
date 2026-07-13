import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Animated,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { V } from "../theme/colors";
import { F } from "../theme/fonts";
import BouncyButton from "../widgets/BouncyButton";
import { Ionicons } from "@expo/vector-icons";
import { clearAll } from "../storage/userStore";
import { UserProfile } from "../types";

// ─── Section Label ─────────────────────────────────────────────────────────────
interface LabelProps {
  text: string;
}

function Label({ text }: LabelProps) {
  return <Text style={pl.label}>{text}</Text>;
}

// ─── Tag pill ──────────────────────────────────────────────────────────────────
interface TagProps {
  text: string;
  accent: string;
}

function Tag({ text, accent }: TagProps) {
  return (
    <View
      style={[
        pl.tag,
        { backgroundColor: `${accent}18`, borderColor: `${accent}40` },
      ]}
    >
      <Text style={[pl.tagText, { color: accent }]}>{text}</Text>
    </View>
  );
}

const pl = StyleSheet.create({
  label: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    fontWeight: "600",
    marginBottom: 10,
    marginTop: 22,
    fontFamily: F.semibold,
  },
  tag: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 6,
    marginRight: 7,
    marginBottom: 7,
  },
  tagText: { fontSize: 12, fontWeight: "500", fontFamily: F.medium },
});

// ─── My Profile Screen ─────────────────────────────────────────────────────────
interface MyProfileScreenProps {
  profile: UserProfile | null;
  onEditProfile: () => void;
  onLogout: () => void;
  onBack: () => void;
}

export default function MyProfileScreen({
  profile,
  onEditProfile,
  onLogout,
  onBack,
}: MyProfileScreenProps) {
  const accent = profile?.favColor || V.coral;
  console.log({ profile });

  // Entrance
  const opacity = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideY, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogout = async () => {
    await clearAll();
    onLogout();
  };

  if (!profile) return null;

  return (
    <View style={s.screen}>
      <LinearGradient
        colors={["#0F0F1E", "#09090F", "#09090F"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Glow */}
      <View style={[s.bgGlow, { backgroundColor: accent }]} />

      {/* Header */}
      <Animated.View
        style={[s.header, { opacity, transform: [{ translateY: slideY }] }]}
      >
        <Pressable onPress={onBack} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.6)" />
        </Pressable>
        <Text style={s.headerTitle}>My Profile</Text>
        <Pressable onPress={onEditProfile} style={s.editBtn}>
          <Ionicons name="create-outline" size={18} color={accent} />
          <Text style={[s.editText, { color: accent }]}>Edit</Text>
        </Pressable>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* ── Hero ── */}
        <Animated.View
          style={[s.hero, { opacity, transform: [{ translateY: slideY }] }]}
        >
          <View style={[s.avatarWrap, { borderColor: `${accent}60` }]}>
            {profile.photoUri ? (
              <Image source={{ uri: profile.photoUri }} style={s.avatar} />
            ) : (
              <View
                style={[
                  s.avatarPlaceholder,
                  { backgroundColor: `${accent}18` },
                ]}
              >
                <Ionicons name="person" size={36} color={`${accent}80`} />
              </View>
            )}
          </View>
          <View style={s.heroInfo}>
            <Text style={s.heroName}>
              {profile.full_name}, {profile.dateOfBirth}
            </Text>
            <Text style={s.heroCollege}>{profile.college}</Text>
            <View
              style={{
                flexDirection: "row",
                gap: 8,
                marginTop: 8,
                flexWrap: "wrap",
              }}
            >
              {profile.intent && (
                <View
                  style={[
                    s.pillSmall,
                    {
                      backgroundColor: `${accent}15`,
                      borderColor: `${accent}40`,
                    },
                  ]}
                >
                  <Text style={[s.pillSmallText, { color: accent }]}>
                    {profile.intent}
                  </Text>
                </View>
              )}
              {profile.mood && (
                <View
                  style={[
                    s.pillSmall,
                    {
                      backgroundColor: "rgba(255,255,255,0.05)",
                      borderColor: "rgba(255,255,255,0.12)",
                    },
                  ]}
                >
                  <Text
                    style={[
                      s.pillSmallText,
                      { color: "rgba(255,255,255,0.55)" },
                    ]}
                  >
                    {profile.mood}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>

        {/* ── Accent color swatch ── */}
        <View style={s.colorRow}>
          <View style={[s.colorSwatch, { backgroundColor: accent }]} />
          <Text style={s.colorLabel}>Your accent colour</Text>
        </View>

        {/* ── Quote ── */}
        {profile.prompt && (
          <>
            <Label text="Your line" />
            <View style={[s.quoteCard, { borderColor: `${accent}25` }]}>
              <Text style={[s.quoteOpen, { color: accent }]}>"</Text>
              <Text style={s.quoteText}>{profile.prompt}</Text>
            </View>
          </>
        )}

        {/* ── Vibe tags ── */}
        {profile.vibes?.length > 0 && (
          <>
            <Label text="Your vibe" />
            <View style={s.tagWrap}>
              {profile.vibes.map((v) => (
                <Tag key={v} text={v} accent={accent} />
              ))}
            </View>
          </>
        )}

        {/* ── Music ── */}
        {profile.playlist && (
          <>
            <Label text="Anthem" />
            <View style={s.infoCard}>
              <Ionicons
                name="musical-notes-outline"
                size={15}
                color={accent}
                style={{ marginRight: 10 }}
              />
              <View>
                <Text style={s.infoMain}>{profile.playlist}</Text>
                {profile.artist && (
                  <Text style={s.infoSub}>{profile.artist}</Text>
                )}
              </View>
            </View>
          </>
        )}

        {/* ── Films ── */}
        {profile.movie && (
          <>
            <Label text="Films & shows" />
            <View style={s.infoCard}>
              <Ionicons
                name="film-outline"
                size={15}
                color={accent}
                style={{ marginRight: 10 }}
              />
              <Text style={s.infoMain}>{profile.movie}</Text>
            </View>
          </>
        )}

        {/* ── Spots ── */}
        {profile.spots && (
          <>
            <Label text="Hangout spots" />
            <View style={s.infoCard}>
              <Ionicons
                name="location-outline"
                size={15}
                color={accent}
                style={{ marginRight: 10 }}
              />
              <Text style={s.infoMain}>{profile.spots}</Text>
            </View>
          </>
        )}

        {/* ── Lifestyle ── */}
        <Label text="Lifestyle" />
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View
            style={[
              s.habitBadge,
              profile.drinker
                ? { backgroundColor: `${accent}18`, borderColor: `${accent}40` }
                : {
                    backgroundColor: "rgba(255,255,255,0.03)",
                    borderColor: "rgba(255,255,255,0.08)",
                  },
            ]}
          >
            <Text style={{ fontSize: 15 }}>🍹</Text>
            <Text
              style={[
                s.habitText,
                {
                  color: profile.drinker ? "#FFFFFF" : "rgba(255,255,255,0.3)",
                },
              ]}
            >
              Drinker
            </Text>
          </View>
          <View
            style={[
              s.habitBadge,
              profile.smoker
                ? { backgroundColor: `${accent}18`, borderColor: `${accent}40` }
                : {
                    backgroundColor: "rgba(255,255,255,0.03)",
                    borderColor: "rgba(255,255,255,0.08)",
                  },
            ]}
          >
            <Text style={{ fontSize: 15 }}>🚬</Text>
            <Text
              style={[
                s.habitText,
                { color: profile.smoker ? "#FFFFFF" : "rgba(255,255,255,0.3)" },
              ]}
            >
              Smoker
            </Text>
          </View>
        </View>

        <View style={{ height: 32 }} />

        {/* ── Edit button ── */}
        <BouncyButton
          onTap={onEditProfile}
          style={[
            s.editFullBtn,
            { backgroundColor: `${accent}18`, borderColor: `${accent}40` },
          ]}
        >
          <Ionicons name="create-outline" size={16} color={accent} />
          <Text style={[s.editFullText, { color: accent }]}>
            Edit my profile
          </Text>
        </BouncyButton>

        <View style={{ height: 12 }} />

        {/* ── Logout ── */}
        <BouncyButton onTap={handleLogout} style={s.logoutBtn}>
          <Ionicons name="log-out-outline" size={16} color="#FF6B6B" />
          <Text style={s.logoutText}>Log out</Text>
        </BouncyButton>

        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#09090F" },
  bgGlow: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    top: -100,
    alignSelf: "center",
    opacity: 0.07,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.5,
    fontFamily: F.medium,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  editText: { fontSize: 13, fontWeight: "600", fontFamily: F.semibold },
  scroll: { paddingHorizontal: 20, paddingTop: 12 },
  // Hero
  hero: { flexDirection: "row", alignItems: "center", gap: 16 },
  avatarWrap: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    overflow: "hidden",
  },
  avatar: { width: "100%", height: "100%" },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  heroInfo: { flex: 1 },
  heroName: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.3,
    fontFamily: F.serif,
  },
  heroCollege: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    marginTop: 2,
    fontFamily: F.regular,
  },
  pillSmall: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillSmallText: { fontSize: 11, fontWeight: "500", fontFamily: F.semibold },
  // Color
  colorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 20,
  },
  colorSwatch: { width: 20, height: 20, borderRadius: 10 },
  colorLabel: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 12,
    fontFamily: F.regular,
  },
  // Quote
  quoteCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  quoteOpen: {
    fontSize: 26,
    fontWeight: "700",
    lineHeight: 26,
    marginRight: 6,
    fontFamily: F.serif,
  },
  quoteText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 14,
    fontStyle: "italic",
    flex: 1,
    lineHeight: 21,
    paddingTop: 2,
    fontFamily: F.regular,
  },
  // Tags
  tagWrap: { flexDirection: "row", flexWrap: "wrap" },
  // Info card
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    padding: 14,
  },
  infoMain: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontFamily: F.medium,
  },
  infoSub: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 12,
    marginTop: 2,
    fontFamily: F.regular,
  },
  // Habits
  habitBadge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: "center",
  },
  habitText: { fontSize: 13, fontWeight: "500", fontFamily: F.semibold },
  // Buttons
  editFullBtn: {
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  editFullText: { fontSize: 15, fontWeight: "600", fontFamily: F.semibold },
  logoutBtn: {
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255,107,107,0.2)",
    backgroundColor: "rgba(255,107,107,0.06)",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  logoutText: {
    color: "#FF6B6B",
    fontSize: 15,
    fontWeight: "500",
    fontFamily: F.semibold,
  },
});
