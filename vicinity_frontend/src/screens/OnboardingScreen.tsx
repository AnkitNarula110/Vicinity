import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Animated,
  Pressable,
  Easing,
  ScrollView,
  Image,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { V } from "../theme/colors";
import { F } from "../theme/fonts";
import BouncyButton from "../widgets/BouncyButton";
import { Ionicons } from "@expo/vector-icons";
import {
  saveProfile,
  getTempRegistrationData,
  clearTempRegistrationData,
} from "../storage/userStore";
import { completeRegistration } from "../api/authApi";
import { UserProfile } from "../types";
import DateTimePicker from "@react-native-community/datetimepicker";

// ─── Constants ─────────────────────────────────────────────────────────────────
const COLOR_OPTIONS = [
  { name: "Burgundy", color: "#801827" },
  { name: "Ochre", color: "#D97706" },
  { name: "Champagne", color: "#DFBA73" },
  { name: "Emerald", color: "#1B6B46" },
  { name: "Teal", color: "#0D9488" },
  { name: "Indigo", color: "#2563EB" },
  { name: "Violet", color: "#4F2D7F" },
  { name: "Rose", color: "#8B2635" },
];

const PROMPTS = [
  "My toxic trait is…",
  "Unpopular opinion:",
  "A hill I will die on:",
  "You'll love me if you like…",
  "Catch me on a Friday night…",
  "The way to my heart is…",
];

const INTENT_OPTIONS = [
  { icon: "✨", label: "Just vibing", sub: "No pressure, open to whatever" },
  { icon: "💛", label: "New friends", sub: "Someone to explore the city with" },
  { icon: "🌹", label: "Dating", sub: "Looking for a real connection" },
  { icon: "🤝", label: "Network & collab", sub: "Creative minds, work stuff" },
];

const VIBE_TAGS = [
  "Introvert",
  "Extrovert",
  "Night owl",
  "Early bird",
  "Artsy",
  "Sporty",
  "Bookworm",
  "Musician",
  "Foodie",
  "Traveler",
  "Gamer",
  "Fashionable",
  "Chill",
  "Ambitious",
  "Spontaneous",
  "Homebody",
  "Gym rat",
  "Outdoor person",
  "Coffee addict",
  "Party animal",
];

const MOOD_OPTIONS = [
  { icon: "☕", label: "Coffee & talk", sub: "Low-key, meaningful" },
  { icon: "🍸", label: "Drinks & dancing", sub: "Bring the energy" },
  { icon: "🚶", label: "Walk & explore", sub: "City drift, no agenda" },
  { icon: "📚", label: "Study session", sub: "Quiet company is fine" },
  {
    icon: "🎵",
    label: "Show me your playlist",
    sub: "AUX cord battle incoming",
  },
  { icon: "✨", label: "Surprise me", sub: "Whatever, I am down" },
];

// ─── Photo Step ──────────────────────────────────────────────────────────────
interface StepPhotoProps {
  photoUri: string | null;
  setPhotoUri: (uri: string | null) => void;
  accent: string;
}

function StepPhoto({ photoUri, setPhotoUri, accent }: StepPhotoProps) {
  const pickImage = () => {
    if (Platform.OS === "web") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev: any) => setPhotoUri(ev.target.result);
          reader.readAsDataURL(file);
        }
      };
      input.click();
    }
  };

  return (
    <View style={ph.step}>
      <Text style={sc.q}>
        Add a photo <Text style={{ color: accent }}>of yourself.</Text>
      </Text>
      <Text style={sc.hint}>
        Your face stays blurred until both of you unlock. But it helps us match
        better.
      </Text>
      <View style={{ height: 36 }} />

      <Pressable
        onPress={pickImage}
        style={[
          ph.zone,
          photoUri ? ph.zoneHasPhoto : null,
          { borderColor: photoUri ? `${accent}60` : "rgba(255,255,255,0.1)" },
        ]}
      >
        {photoUri ? (
          <>
            <Image source={{ uri: photoUri }} style={ph.preview} />
            <View style={ph.previewOverlay}>
              <Ionicons name="camera" size={22} color="#FFFFFF" />
              <Text style={ph.changeText}>Change photo</Text>
            </View>
          </>
        ) : (
          <View style={ph.placeholder}>
            <View
              style={[
                ph.iconCircle,
                { backgroundColor: `${accent}18`, borderColor: `${accent}40` },
              ]}
            >
              <Ionicons name="camera-outline" size={28} color={accent} />
            </View>
            <Text style={ph.uploadLabel}>Tap to upload a photo</Text>
            <Text style={ph.uploadSub}>
              JPG, PNG · Shown blurred until unlocked
            </Text>
          </View>
        )}
      </Pressable>

      {!photoUri && (
        <Pressable style={ph.skipRow}>
          <Text style={ph.skipText}>Skip for now</Text>
        </Pressable>
      )}
    </View>
  );
}

const ph = StyleSheet.create({
  step: { flex: 1 },
  zone: {
    height: 260,
    borderRadius: 24,
    borderWidth: 1.5,
    borderStyle: "dashed",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  zoneHasPhoto: { borderStyle: "solid" },
  preview: { ...StyleSheet.absoluteFill },
  previewOverlay: {
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: "center",
  },
  changeText: {
    color: "#FFFFFF",
    fontSize: 13,
    marginTop: 4,
    fontWeight: "500",
  },
  placeholder: { alignItems: "center", gap: 14 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 15,
    fontWeight: "500",
  },
  uploadSub: { color: "rgba(255,255,255,0.2)", fontSize: 11 },
  skipRow: { alignItems: "center", marginTop: 16 },
  skipText: { color: "rgba(255,255,255,0.2)", fontSize: 12 },
});

// ─── Media helpers ─────────────────────────────────────────────────────────────
const getSongCover = (text: string) => {
  const q = text.toLowerCase();
  if (q.includes("places") || q.includes("fred"))
    return "https://i.scdn.co/image/ab67616d0000b273b5e1cf58a5be715be0d64db9";
  if (q.includes("sweater") || q.includes("neighbourhood"))
    return "https://i.scdn.co/image/ab67616d0000b273e878ab4889c25608d1326c7d";
  return "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&auto=format&fit=crop";
};

const getMoviePoster = (text: string) => {
  const q = text.toLowerCase();
  if (q.includes("interstellar"))
    return "https://image.tmdb.org/t/p/w500/gEU2QvEOmfgwoawcy32vSJ6seVC.jpg";
  if (q.includes("euphoria"))
    return "https://image.tmdb.org/t/p/w500/391N4616gs47l1tJthH2550jCcw.jpg";
  if (q.includes("la la"))
    return "https://image.tmdb.org/t/p/w500/uC6TTUhfUE0sgHZF1Z3g0236zqn.jpg";
  if (q.includes("dune"))
    return "https://image.tmdb.org/t/p/w500/d5NguwAOSwfJgICfyZLs2n34IQm.jpg";
  return "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&auto=format&fit=crop";
};

// ─── Reusable: Glow Input ─────────────────────────────────────────────────────
interface GlowInputProps {
  icon: any;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: any;
  multiline?: boolean;
  accent?: string;
}

function GlowInput({
  icon,
  placeholder,
  value,
  onChangeText,
  keyboardType,
  multiline,
  accent,
}: GlowInputProps) {
  const [focused, setFocused] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;
  const onFocus = () => {
    setFocused(true);
    Animated.timing(anim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };
  const onBlur = () => {
    setFocused(false);
    Animated.timing(anim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };
  const borderColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.08)", accent || V.coral],
  });

  return (
    <Animated.View
      style={[
        gi.wrap,
        { borderColor },
        multiline && { height: 100, alignItems: "flex-start" },
      ]}
    >
      <Ionicons
        name={icon}
        size={16}
        color={focused ? accent || V.coral : "rgba(255,255,255,0.25)"}
        style={[gi.icon, multiline && { marginTop: 14 }]}
      />
      <TextInput
        style={
          [
            gi.input,
            multiline && {
              height: 80,
              textAlignVertical: "top",
              paddingTop: 12,
            },
          ] as any
        }
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.18)"
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        keyboardType={keyboardType}
        multiline={multiline}
        autoCapitalize="words"
        autoCorrect={false}
      />
    </Animated.View>
  );
}
const gi = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 12,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
    height: "100%",
  },
});
// ─── Reusable: Progress Bar ───────────────────────────────────────────────────
interface ProgressBarProps {
  step: number;
  total: number;
  accent: string;
}

function ProgressBar({ step, total, accent }: ProgressBarProps) {
  const width = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(width, {
      toValue: ((step + 1) / total) * 100,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [step]);
  return (
    <View style={pb.track}>
      <Animated.View
        style={[
          pb.fill,
          {
            backgroundColor: accent,
            width: width.interpolate({
              inputRange: [0, 100],
              outputRange: ["0%", "100%"],
            }),
          },
        ]}
      />
    </View>
  );
}
const pb = StyleSheet.create({
  track: {
    height: 2,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 1,
    overflow: "hidden",
    marginHorizontal: 24,
  },
  fill: { height: 2, borderRadius: 1 },
});

// ─── Reusable: Toggle Row ─────────────────────────────────────────────────────
interface ToggleRowProps {
  label: string;
  value: boolean;
  onToggle: () => void;
  accent: string;
}

function ToggleRow({ label, value, onToggle, accent }: ToggleRowProps) {
  const knob = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(knob, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [value]);
  return (
    <Pressable onPress={onToggle} style={tr.row}>
      <Text style={tr.label}>{label}</Text>
      <View
        style={[
          tr.track,
          value && {
            backgroundColor: `${accent}25`,
            borderColor: `${accent}60`,
          },
        ]}
      >
        <Animated.View
          style={[
            tr.knob,
            {
              backgroundColor: value ? accent : "rgba(255,255,255,0.2)",
              transform: [
                {
                  translateX: knob.interpolate({
                    inputRange: [0, 1],
                    outputRange: [2, 28],
                  }),
                },
              ],
            },
          ]}
        />
      </View>
    </Pressable>
  );
}
const tr = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    paddingHorizontal: 16,
    height: 52,
  },
  label: { color: "rgba(255,255,255,0.65)", fontSize: 14 },
  track: {
    width: 58,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
  },
  knob: { width: 24, height: 24, borderRadius: 12 },
});

// ─── Step: Name + Age ────────────────────────────────────────────────────────
interface StepNameProps {
  name: string;
  setName: (t: string) => void;
  dateOfBirth: Date | null;
  setDateOfBirth: (date: Date | null) => void;
  accent: string;
  showDatePicker: boolean;
  setShowDatePicker: (show: boolean) => void;
}

function StepName({
  name,
  setName,
  dateOfBirth,
  setDateOfBirth,
  accent,
  showDatePicker,
  setShowDatePicker,
}: StepNameProps) {
  // Format date for display
  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Calculate age from date of birth
  const calculateAge = (dob: Date | null) => {
    if (!dob) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(dateOfBirth);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDateOfBirth(selectedDate);
    }
  };

  // Web date picker handler
  const handleWebDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.value;
    if (selected) {
      const date = new Date(selected);
      setDateOfBirth(date);
    }
  };

  return (
    <View style={sc.step}>
      <Text style={sc.q}>What should{"\n"}we call you?</Text>
      <Text style={sc.hint}>This is how you'll appear to people nearby.</Text>
      <View style={{ height: 32 }} />
      <GlowInput
        icon="person-outline"
        placeholder="Your name"
        value={name}
        onChangeText={setName}
        accent={accent}
      />
      {/* Date of Birth Input */}
      {Platform.OS === "web" ? (
        // Web: Use native input
        <View
          style={[
            gi.wrap,
            {
              borderColor: dateOfBirth
                ? `${accent}60`
                : "rgba(255,255,255,0.08)",
              paddingHorizontal: 14,
              height: 52,
            },
          ]}
        >
          <Ionicons
            name="calendar-outline"
            size={16}
            color={dateOfBirth ? accent : "rgba(255,255,255,0.25)"}
            style={gi.icon}
          />
          <input
            type="date"
            value={dateOfBirth ? dateOfBirth.toISOString().split("T")[0] : ""}
            onChange={handleWebDateChange}
            max={new Date().toISOString().split("T")[0]}
            style={{
              flex: 1,
              backgroundColor: "transparent",
              border: "none",
              color: dateOfBirth ? "#FFFFFF" : "rgba(255,255,255,0.18)",
              fontSize: "15px",
              outline: "none",
              height: "100%",
              fontFamily: "inherit",
              minHeight: 40,
              cursor: "pointer",
            }}
          />
          {dateOfBirth && age !== null && (
            <View style={[styles.ageChip, { backgroundColor: `${accent}20` }]}>
              <Text style={[styles.ageChipText, { color: accent }]}>
                {age} years
              </Text>
            </View>
          )}
        </View>
      ) : (
        // Native: Pressable + DateTimePicker
        <>
          <Pressable
            onPress={() => {
              console.log("Date picker pressed"); // Debug log
              setShowDatePicker(true);
            }}
            style={[
              gi.wrap,
              {
                borderColor: dateOfBirth
                  ? `${accent}60`
                  : "rgba(255,255,255,0.08)",
                justifyContent: "space-between",
                height: 52,
              },
            ]}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
            >
              <Ionicons
                name="calendar-outline"
                size={16}
                color={dateOfBirth ? accent : "rgba(255,255,255,0.25)"}
                style={gi.icon}
              />
              <Text
                style={{
                  flex: 1,
                  color: dateOfBirth ? "#FFFFFF" : "rgba(255,255,255,0.18)",
                  fontSize: 15,
                  paddingVertical: 12,
                }}
              >
                {dateOfBirth ? formatDate(dateOfBirth) : "Date of Birth"}
              </Text>
            </View>
            {dateOfBirth && age !== null && (
              <View
                style={[styles.ageChip, { backgroundColor: `${accent}20` }]}
              >
                <Text style={[styles.ageChipText, { color: accent }]}>
                  {age} years
                </Text>
              </View>
            )}
          </Pressable>

          {showDatePicker && (
            <View style={styles.datePickerContainer}>
              <DateTimePicker
                value={dateOfBirth || new Date(2000, 0, 1)}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleDateChange}
                maximumDate={new Date()}
                themeVariant="dark"
                style={
                  Platform.OS === "android"
                    ? { backgroundColor: "#1a1a2e", width: "100%" }
                    : undefined
                }
              />
            </View>
          )}
        </>
      )}
      {dateOfBirth && age !== null && age < 18 && (
        <View style={styles.ageError}>
          <Ionicons name="alert-circle" size={16} color="#FF6B6B" />
          <Text style={styles.ageErrorText}>
            You must be 18 or older to use Vicinity
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Step: College ───────────────────────────────────────────────────────────
interface StepCollegeProps {
  college: string;
  setCollege: (t: string) => void;
  accent: string;
}

function StepCollege({ college, setCollege, accent }: StepCollegeProps) {
  return (
    <View style={sc.step}>
      <Text style={sc.q}>Where are{"\n"}you based?</Text>
      <Text style={sc.hint}>
        Helps us find people in the same world as you.
      </Text>
      <View style={{ height: 32 }} />
      <GlowInput
        icon="business-outline"
        placeholder="College or company"
        value={college}
        onChangeText={setCollege}
        accent={accent}
      />
    </View>
  );
}

// ─── Step: Intent ─────────────────────────────────────────────────────────────
interface StepIntentProps {
  selected: number;
  setSelected: (i: number) => void;
  accent: string;
}

function StepIntent({ selected, setSelected, accent }: StepIntentProps) {
  return (
    <ScrollView style={sc.step} showsVerticalScrollIndicator={false}>
      <Text style={sc.q}>What brings{"\n"}you here?</Text>
      <Text style={sc.hint}>
        Be honest — it helps us find the right people.
      </Text>
      <View style={{ height: 24 }} />
      {INTENT_OPTIONS.map((opt, i) => {
        const active = selected === i;
        return (
          <Pressable
            key={i}
            onPress={() => setSelected(i)}
            style={[
              ic.card,
              active && {
                borderColor: `${accent}70`,
                backgroundColor: `${accent}12`,
              },
            ]}
          >
            <Text style={ic.icon}>{opt.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[ic.label, active && { color: "#FFFFFF" }]}>
                {opt.label}
              </Text>
              <Text style={ic.sub}>{opt.sub}</Text>
            </View>
            <View
              style={[
                ic.radio,
                active && {
                  borderColor: accent,
                  backgroundColor: `${accent}30`,
                },
              ]}
            >
              {active && (
                <View style={[ic.radioDot, { backgroundColor: accent }]} />
              )}
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
const ic = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 16,
    marginBottom: 10,
  },
  icon: { fontSize: 24, width: 32, textAlign: "center" },
  label: { color: "rgba(255,255,255,0.7)", fontSize: 15, fontWeight: "600" },
  sub: { color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
});

// ─── Step: Color picker ──────────────────────────────────────────────────────
interface StepColorProps {
  selectedIndex: number;
  setSelectedIndex: (i: number) => void;
}

function StepColor({ selectedIndex, setSelectedIndex }: StepColorProps) {
  const currentOption = COLOR_OPTIONS[selectedIndex];

  return (
    <View style={sc.step}>
      <Text style={sc.q}>Pick your{"\n"}colour.</Text>
      <Text style={sc.hint}>
        Your profile accent — a small detail that says a lot.
      </Text>
      <View style={{ height: 36 }} />

      <View style={sc.colorShowcase}>
        <Text style={[sc.colorShowcaseLabel, { color: currentOption.color }]}>
          {currentOption.name}
        </Text>
      </View>

      <View style={sc.swatchGrid}>
        {COLOR_OPTIONS.map((opt, i) => {
          const active = selectedIndex === i;
          return (
            <Pressable
              key={opt.name}
              onPress={() => setSelectedIndex(i)}
              style={[
                sc.swatchBtn,
                { backgroundColor: opt.color },
                active &&
                  ({
                    borderColor: "#FFFFFF",
                    borderWidth: 2.5,
                    transform: [{ scale: 1.15 }],
                  } as any),
              ]}
            >
              {active && (
                <View style={sc.swatchInnerDot}>
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── Step: Vibe descriptors ───────────────────────────────────────────────────
interface StepVibeProps {
  selected: string[];
  setSelected: React.Dispatch<React.SetStateAction<string[]>>;
  accent: string;
}

function StepVibe({ selected, setSelected, accent }: StepVibeProps) {
  const toggle = (tag: string) => {
    setSelected((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : prev.length < 5
          ? [...prev, tag]
          : prev,
    );
  };
  return (
    <View style={sc.step}>
      <Text style={sc.q}>How would your{"\n"}friends describe you?</Text>
      <Text style={sc.hint}>Pick up to 5 — your vibe fingerprint.</Text>
      <View style={{ height: 24 }} />
      <View style={sc.tagGrid}>
        {VIBE_TAGS.map((tag) => {
          const active = selected.includes(tag);
          return (
            <Pressable
              key={tag}
              onPress={() => toggle(tag)}
              style={[
                sc.vibeTile,
                active && {
                  backgroundColor: `${accent}20`,
                  borderColor: `${accent}60`,
                },
              ]}
            >
              <Text style={[sc.vibeText, active && { color: "#FFFFFF" }]}>
                {tag}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={sc.vibeCount}>{selected.length}/5 selected</Text>
    </View>
  );
}

// ─── Step: Music ─────────────────────────────────────────────────────────────
interface StepMusicProps {
  playlist: string;
  setPlaylist: (val: string) => void;
  artist: string;
  setArtist: (val: string) => void;
  accent: string;
}

function StepMusic({
  playlist,
  setPlaylist,
  artist,
  setArtist,
  accent,
}: StepMusicProps) {
  return (
    <ScrollView style={sc.step} showsVerticalScrollIndicator={false}>
      <Text style={sc.q}>What are you{"\n"}listening to?</Text>
      <Text style={sc.hint}>
        Music taste is the fastest shortcut to finding your people.
      </Text>
      <View style={{ height: 28 }} />
      <GlowInput
        icon="musical-notes-outline"
        placeholder="Favorite song or playlist"
        value={playlist}
        onChangeText={setPlaylist}
        accent={accent}
      />
      {playlist.trim().length > 2 && (
        <View style={[sc.previewCard, { borderColor: `${accent}30` }]}>
          <Image
            source={{ uri: getSongCover(playlist) }}
            style={sc.albumThumb}
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={sc.previewTitle} numberOfLines={1}>
              {playlist.split("—")[0].trim()}
            </Text>
            <Text style={sc.previewSub} numberOfLines={1}>
              {(playlist.split("—")[1] || "").trim() || "Song"}
            </Text>
          </View>
          <Ionicons name="musical-note" size={16} color={`${accent}80`} />
        </View>
      )}
      <GlowInput
        icon="people-outline"
        placeholder="Artists you love (comma separated)"
        value={artist}
        onChangeText={setArtist}
        accent={accent}
      />
      {artist.trim().length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 12 }}
        >
          {artist
            .split(",")
            .map((a) => a.trim())
            .filter((a) => a)
            .map((a, i) => (
              <View
                key={i}
                style={[sc.artistPill, { borderColor: `${accent}40` }]}
              >
                <Text style={sc.artistPillText}>{a}</Text>
              </View>
            ))}
        </ScrollView>
      )}
    </ScrollView>
  );
}

// ─── Step: Films ─────────────────────────────────────────────────────────────
interface StepFilmProps {
  movie: string;
  setMovie: (val: string) => void;
  accent: string;
}

function StepFilm({ movie, setMovie, accent }: StepFilmProps) {
  return (
    <View style={sc.step}>
      <Text style={sc.q}>Films &{"\n"}shows?</Text>
      <Text style={sc.hint}>
        Your cinematic taste says a lot about how you see the world.
      </Text>
      <View style={{ height: 28 }} />
      <GlowInput
        icon="film-outline"
        placeholder="e.g. Euphoria, Interstellar, Dune"
        value={movie}
        onChangeText={setMovie}
        accent={accent}
      />
      {movie.trim().length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {movie
            .split(",")
            .map((m) => m.trim())
            .filter((m) => m)
            .map((m, i) => (
              <View key={i} style={sc.posterWrap}>
                <Image source={{ uri: getMoviePoster(m) }} style={sc.poster} />
                <View style={sc.posterOverlay} />
                <Text style={sc.posterLabel} numberOfLines={1}>
                  {m}
                </Text>
              </View>
            ))}
        </ScrollView>
      )}
    </View>
  );
}

// ─── Step: Spots & Lifestyle ─────────────────────────────────────────────────
interface StepSpotsProps {
  spots: string;
  setSpots: (val: string) => void;
  isSmoker: boolean;
  setIsSmoker: (val: boolean) => void;
  isDrinker: boolean;
  setIsDrinker: (val: boolean) => void;
  accent: string;
}

function StepSpots({
  spots,
  setSpots,
  isSmoker,
  setIsSmoker,
  isDrinker,
  setIsDrinker,
  accent,
}: StepSpotsProps) {
  return (
    <ScrollView style={sc.step} showsVerticalScrollIndicator={false}>
      <Text style={sc.q}>Where do{"\n"}you usually hang?</Text>
      <Text style={sc.hint}>
        Your regular spots — helps people find common ground.
      </Text>
      <View style={{ height: 28 }} />
      <GlowInput
        icon="location-outline"
        placeholder="Cafes, bars, parks, libraries…"
        value={spots}
        onChangeText={setSpots}
        accent={accent}
      />
      <View style={{ height: 16 }} />
      <Text style={sc.subLabel}>A couple quick things</Text>
      <View style={{ height: 12 }} />
      <ToggleRow
        label="I drink alcohol"
        value={isDrinker}
        onToggle={() => setIsDrinker(!isDrinker)}
        accent={accent}
      />
      <View style={{ height: 10 }} />
      <ToggleRow
        label="I smoke"
        value={isSmoker}
        onToggle={() => setIsSmoker(!isSmoker)}
        accent={accent}
      />
    </ScrollView>
  );
}

// ─── Step: Right Now Mood ────────────────────────────────────────────────────
interface StepMoodProps {
  selected: number;
  setSelected: (val: number) => void;
  accent: string;
}

function StepMood({ selected, setSelected, accent }: StepMoodProps) {
  return (
    <ScrollView style={sc.step} showsVerticalScrollIndicator={false}>
      <Text style={sc.q}>What are you{"\n"}open to right now?</Text>
      <Text style={sc.hint}>This changes how nearby people see you today.</Text>
      <View style={{ height: 24 }} />
      <View style={sc.moodGrid}>
        {MOOD_OPTIONS.map((opt, i) => {
          const active = selected === i;
          return (
            <Pressable
              key={i}
              onPress={() => setSelected(i)}
              style={[
                sc.moodTile,
                active && {
                  borderColor: `${accent}70`,
                  backgroundColor: `${accent}14`,
                },
              ]}
            >
              <Text style={sc.moodIcon}>{opt.icon}</Text>
              <Text style={[sc.moodLabel, active && { color: "#FFFFFF" }]}>
                {opt.label}
              </Text>
              <Text style={sc.moodSub}>{opt.sub}</Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

// ─── Step: Prompt ────────────────────────────────────────────────────────────
interface StepPromptProps {
  prompt: string;
  setPrompt: (val: string) => void;
  promptIndex: number;
  setPromptIndex: (val: number) => void;
  accent: string;
}

function StepPrompt({
  prompt,
  setPrompt,
  promptIndex,
  setPromptIndex,
  accent,
}: StepPromptProps) {
  return (
    <View style={sc.step}>
      <Text style={sc.q}>One line{"\n"}about you.</Text>
      <Text style={sc.hint}>
        This is the very first thing someone reads on your card.
      </Text>
      <View style={{ height: 24 }} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 14 }}
      >
        {PROMPTS.map((p, i) => (
          <Pressable
            key={i}
            onPress={() => setPromptIndex(i)}
            style={[
              sc.promptChip,
              {
                backgroundColor:
                  promptIndex === i ? `${accent}20` : "rgba(255,255,255,0.04)",
                borderColor:
                  promptIndex === i ? `${accent}60` : "rgba(255,255,255,0.08)",
              },
            ]}
          >
            <Text
              style={[
                sc.promptChipText,
                {
                  color:
                    promptIndex === i ? "#FFFFFF" : "rgba(255,255,255,0.35)",
                },
              ]}
            >
              {p}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={[sc.promptCard, { borderColor: `${accent}30` }]}>
        <Text style={[sc.promptLabel, { color: accent }]}>
          {PROMPTS[promptIndex]}
        </Text>
        <TextInput
          style={sc.promptInput}
          value={prompt}
          onChangeText={setPrompt}
          placeholder="your answer…"
          placeholderTextColor="rgba(255,255,255,0.18)"
          multiline
        />
      </View>
    </View>
  );
}

// ─── Shared step styles ───────────────────────────────────────────────────────
const sc = StyleSheet.create({
  step: { flex: 1 },
  q: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.8,
    lineHeight: 40,
    fontFamily: F.serif,
  },
  hint: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 13,
    marginTop: 8,
    fontWeight: "300",
    lineHeight: 19,
    fontFamily: F.regular,
  },
  subLabel: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    fontWeight: "600",
    fontFamily: F.semibold,
  },

  // Color Swatches Custom Layout
  colorShowcase: { alignItems: "center", marginBottom: 28, height: 24 },
  colorShowcaseLabel: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
    fontFamily: F.semibold,
  },
  swatchGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  swatchBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  swatchInnerDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Vibe tags
  tagGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  vibeTile: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  vibeText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    fontFamily: F.medium,
  },
  vibeCount: {
    color: "rgba(255,255,255,0.2)",
    fontSize: 11,
    marginTop: 14,
    textAlign: "right",
    fontFamily: F.medium,
  },

  // Mood grid
  moodGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  moodTile: {
    width: "47%",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 16,
    alignItems: "center",
  },
  moodIcon: { fontSize: 26, marginBottom: 8 },
  moodLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    fontFamily: F.semibold,
  },
  moodSub: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 10,
    marginTop: 4,
    textAlign: "center",
    fontFamily: F.regular,
  },

  // Music
  previewCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
  },
  albumThumb: { width: 44, height: 44, borderRadius: 8 },
  previewTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    fontFamily: F.semibold,
  },
  previewSub: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    marginTop: 2,
    fontFamily: F.regular,
  },
  artistPill: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
  },
  artistPillText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontFamily: F.medium,
  },

  // Films
  posterWrap: {
    width: 90,
    height: 130,
    borderRadius: 12,
    overflow: "hidden",
    marginRight: 12,
    marginTop: 4,
  },
  poster: { ...StyleSheet.absoluteFill },
  posterOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  posterLabel: {
    position: "absolute",
    bottom: 8,
    left: 6,
    right: 6,
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "600",
    textAlign: "center",
    fontFamily: F.semibold,
  },

  // Prompt
  promptChip: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  promptChipText: { fontSize: 12, fontWeight: "500", fontFamily: F.medium },
  promptCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },
  promptLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 10,
    fontFamily: F.semibold,
  },
  promptInput: {
    color: "#FFFFFF",
    fontSize: 15,
    fontStyle: "italic",
    outlineStyle: "none",
    minHeight: 60,
    lineHeight: 22,
    fontFamily: F.regular,
  } as any,
});

// ─── STEP REGISTRY ────────────────────────────────────────────────────────────
const STEP_META = [
  { label: "You" },
  { label: "Based" },
  { label: "Here for" },
  { label: "Colour" },
  { label: "Photo" },
  { label: "Vibe" },
  { label: "Music" },
  { label: "Films" },
  { label: "Spots" },
  { label: "Mood" },
  { label: "Your line" },
];
const TOTAL = STEP_META.length;

// ─── Main Screen ──────────────────────────────────────────────────────────────
interface OnboardingScreenProps {
  onComplete: (data: UserProfile) => void;
  initialData?: UserProfile;
}

export default function OnboardingScreen({
  onComplete,
  initialData,
}: OnboardingScreenProps) {
  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state — pre-fill from initialData if editing
  const [name, setName] = useState(initialData?.name ?? "");
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(
    initialData?.dateOfBirth ? new Date(initialData.dateOfBirth) : null,
  );
  const [college, setCollege] = useState(initialData?.college || "");
  const [intent, setIntent] = useState(
    initialData?.intentIndex !== undefined ? initialData?.intentIndex : 0,
  );
  const [colorIndex, setColorIndex] = useState(
    initialData?.colorIndex !== undefined ? initialData?.colorIndex : 0,
  );
  const [photoUri, setPhotoUri] = useState<string | null>(
    initialData?.photoUri || null,
  );
  const [vibes, setVibes] = useState<string[]>(initialData?.vibes || []);
  const [playlist, setPlaylist] = useState(
    initialData?.playlist || "Places — Fred again..",
  );
  const [artist, setArtist] = useState(
    initialData?.artist || "Fred again.., Overmono",
  );
  const [movie, setMovie] = useState(
    initialData?.movie || "Euphoria, Interstellar",
  );
  const [spots, setSpots] = useState(
    initialData?.spots || "TBA Club, Washington Sq",
  );
  const [isSmoker, setIsSmoker] = useState(initialData?.smoker || false);
  const [isDrinker, setIsDrinker] = useState(
    initialData?.drinker !== undefined ? initialData?.drinker : true,
  );
  const [mood, setMood] = useState(
    initialData?.moodIndex !== undefined ? initialData?.moodIndex : 0,
  );
  const [prompt, setPrompt] = useState(
    initialData?.promptRaw || "I order dessert before the main course.",
  );
  const [promptIndex, setPromptIndex] = useState(
    initialData?.promptIndex !== undefined ? initialData?.promptIndex : 0,
  );

  const accent = COLOR_OPTIONS[colorIndex].color;

  // Immersive transition animations for background wash
  const colorAnim = useRef(new Animated.Value(colorIndex)).current;
  const glowScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.07)).current;

  // Morph color choice smoothly
  useEffect(() => {
    Animated.timing(colorAnim, {
      toValue: colorIndex,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [colorIndex]);

  // Immersive wash when step === 3 (index of Color Step)
  useEffect(() => {
    Animated.parallel([
      Animated.timing(glowScale, {
        toValue: step === 3 ? 1.6 : 1.0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(glowOpacity, {
        toValue: step === 3 ? 0.18 : 0.07,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [step]);

  const animatedGlowColor = colorAnim.interpolate({
    inputRange: [0, 1, 2, 3, 4, 5, 6, 7],
    outputRange: COLOR_OPTIONS.map((opt) => opt.color),
  });

  // Slide transition
  const slideX = useRef(new Animated.Value(0)).current;
  const slideOp = useRef(new Animated.Value(1)).current;

  const transition = (to: number) => {
    const dir = to > step ? 1 : -1;
    Animated.parallel([
      Animated.timing(slideOp, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideX, {
        toValue: -28 * dir,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStep(to);
      slideX.setValue(28 * dir);
      Animated.parallel([
        Animated.timing(slideOp, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(slideX, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
        errorTimeoutRef.current = null;
      }
    };
  }, []);

  const validateStep = () => {
    // Clear any existing timeout
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }

    if (step === 0) {
      if (!name.trim()) {
        setStepError("Please enter your name.");
        errorTimeoutRef.current = setTimeout(() => {
          setStepError(null);
        }, 3000);
        return false;
      }

      if (!dateOfBirth) {
        setStepError("Please enter your date of birth.");
        errorTimeoutRef.current = setTimeout(() => {
          setStepError(null);
        }, 3000);
        return false;
      }

      const age = calculateAge(dateOfBirth);
      if (age < 18) {
        setStepError("You must be 18 or older to use Vicinity.");
        errorTimeoutRef.current = setTimeout(() => {
          setStepError(null);
        }, 1500);
        return false;
      }
    }

    setStepError(null);
    return true;
  };

  // Helper function to calculate age
  const calculateAge = (dob: Date) => {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const goNext = () => {
    if (!validateStep()) return;
    step < TOTAL - 1 ? transition(step + 1) : handleComplete();
  };
  const goBack = () => step > 0 && transition(step - 1);

  const handleComplete = async () => {
    if (isSubmitting) return;
    if (!termsAccepted) {
      setStepError("Please accept the terms to continue.");
      setTimeout(() => setStepError(null), 3000);
      return;
    }

    setIsSubmitting(true);
    setStepError(null);

    try {
      // Get temporary registration data from CreateAccountScreen
      const tempData = await getTempRegistrationData();

      if (!tempData) {
        throw new Error(
          "Registration data not found. Please go back and try again.",
        );
      }

      // Build onboarding data
      const onboardingData = {
        full_name: name.trim() || "Alex",
        college: college.trim() || "NYU",
        intent: INTENT_OPTIONS[intent].label,
        intent_index: intent,
        color_index: colorIndex,
        vibe_tags: vibes,
        playlist: playlist,
        artist: artist,
        movie: movie,
        spots: spots,
        is_smoker: isSmoker,
        is_drinker: isDrinker,
        mood: MOOD_OPTIONS[mood].label,
        mood_index: mood,
        prompt_raw: prompt.trim(),
        prompt_index: promptIndex,
        prompt: `${PROMPTS[promptIndex]} ${prompt.trim()}`,
        profile_picture: photoUri,
      };

      // Complete registration with all data
      const result = await completeRegistration({
        username: tempData.username,
        email: tempData.email,
        password: tempData.password,
        phone: tempData.phone,
        dob: dateOfBirth?.toISOString().split("T")[0] || null,
        aadharnumber: null,
        address: null,
        onboarding_data: onboardingData,
      });

      console.log("Registration complete:", result);

      // Clear temporary data
      await clearTempRegistrationData();

      // Save profile locally
      const profile: UserProfile = {
        name: onboardingData.full_name,
        dateOfBirth: dateOfBirth?.toISOString() || new Date().toISOString(),
        college: onboardingData.college,
        playlist: onboardingData.playlist,
        artist: onboardingData.artist,
        movie: onboardingData.movie,
        spots: onboardingData.spots,
        smoker: onboardingData.is_smoker,
        drinker: onboardingData.is_drinker,
        favColor: accent,
        photoUri: onboardingData.profile_picture,
        intent: onboardingData.intent,
        intentIndex: onboardingData.intent_index,
        vibes: onboardingData.vibe_tags,
        mood: onboardingData.mood,
        moodIndex: onboardingData.mood_index,
        promptRaw: onboardingData.prompt_raw,
        promptIndex: onboardingData.prompt_index,
        colorIndex: colorIndex,
        prompt: onboardingData.prompt,
        distance: 32,
        direction: 45.0,
        matchPercent: 87,
        picsUnlocked: false,
      };

      await saveProfile(profile);
      onComplete(profile);
    } catch (error: any) {
      console.error("Error completing registration:", error);
      setStepError(
        error.message || "Failed to complete registration. Please try again.",
      );
      setTimeout(() => setStepError(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const panels = [
    <StepName
      name={name}
      setName={setName}
      dateOfBirth={dateOfBirth}
      setDateOfBirth={setDateOfBirth}
      accent={accent}
      showDatePicker={showDatePicker}
      setShowDatePicker={setShowDatePicker}
    />,

    <StepCollege college={college} setCollege={setCollege} accent={accent} />,
    <StepIntent selected={intent} setSelected={setIntent} accent={accent} />,
    <StepColor selectedIndex={colorIndex} setSelectedIndex={setColorIndex} />,
    <StepPhoto photoUri={photoUri} setPhotoUri={setPhotoUri} accent={accent} />,
    <StepVibe selected={vibes} setSelected={setVibes} accent={accent} />,
    <StepMusic
      playlist={playlist}
      setPlaylist={setPlaylist}
      artist={artist}
      setArtist={setArtist}
      accent={accent}
    />,
    <StepFilm movie={movie} setMovie={setMovie} accent={accent} />,
    <StepSpots
      spots={spots}
      setSpots={setSpots}
      isSmoker={isSmoker}
      setIsSmoker={setIsSmoker}
      isDrinker={isDrinker}
      setIsDrinker={setIsDrinker}
      accent={accent}
    />,
    <StepMood selected={mood} setSelected={setMood} accent={accent} />,
    <StepPrompt
      prompt={prompt}
      setPrompt={setPrompt}
      promptIndex={promptIndex}
      setPromptIndex={setPromptIndex}
      accent={accent}
    />,
  ];

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={["#0F0F1E", "#09090F", "#09090F"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Ambient colour glow behind */}
      <Animated.View
        style={[
          styles.bgGlow,
          {
            backgroundColor: animatedGlowColor,
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
          },
        ]}
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={goBack}
          style={[styles.backBtn, step === 0 && { opacity: 0 }]}
          disabled={step === 0}
        >
          <Ionicons
            name="arrow-back"
            size={19}
            color="rgba(255,255,255,0.55)"
          />
        </Pressable>
        <Text style={styles.wordmark}>vicinity</Text>
        <Text style={styles.stepNum}>
          {step + 1}/{TOTAL}
        </Text>
      </View>

      {/* Progress */}
      <View style={{ marginTop: 10, marginBottom: 4 }}>
        <ProgressBar step={step} total={TOTAL} accent={accent} />
      </View>

      {/* Step label strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.labelStrip}
        contentContainerStyle={{
          paddingHorizontal: 24,
          gap: 20,
          alignItems: "center",
        }}
      >
        {STEP_META.map((m, i) => (
          <Text
            key={i}
            style={[
              styles.stepLabel,
              i === step && { color: "#FFFFFF", fontWeight: "600" },
            ]}
          >
            {m.label}
          </Text>
        ))}
      </ScrollView>

      {/* Animated step panel */}
      <Animated.View
        style={[
          styles.panel,
          { opacity: slideOp, transform: [{ translateX: slideX }] },
        ]}
      >
        {panels[step]}
      </Animated.View>

      {/* CTA */}
      <View style={styles.footer}>
        {/* Step error */}
        {stepError ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={14} color="#FF6B6B" />
            <Text style={styles.errorText}>{stepError}</Text>
          </View>
        ) : null}
        <View style={styles.spacer} />
        {/* Terms checkbox — only on last step */}
        {step === TOTAL - 1 && (
          <Pressable
            onPress={() => setTermsAccepted((p) => !p)}
            style={styles.termsRow}
          >
            <View
              style={[
                styles.checkbox,
                termsAccepted && {
                  backgroundColor: accent,
                  borderColor: accent,
                },
              ]}
            >
              {termsAccepted && (
                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
              )}
            </View>
            <Text style={styles.termsText}>
              I confirm I am <Text style={{ color: accent }}>18 or older</Text>{" "}
              and agree to the{" "}
              <Text style={{ color: accent }}>Terms of Service</Text>
            </Text>
          </Pressable>
        )}

        <BouncyButton
          onTap={isSubmitting ? undefined : goNext}
          style={[
            styles.btn,
            {
              backgroundColor: accent,
              shadowColor: accent,
              opacity:
                (step === TOTAL - 1 && !termsAccepted) || isSubmitting
                  ? 0.4
                  : 1,
            },
          ]}
        >
          <Text style={styles.btnText}>
            {isSubmitting
              ? "Creating..."
              : step === TOTAL - 1
                ? "Go live"
                : "Continue"}
          </Text>
          {!isSubmitting && (
            <Ionicons
              name={step === TOTAL - 1 ? "flash" : "arrow-forward"}
              size={16}
              color="#fff"
              style={{ marginLeft: 8 }}
            />
          )}
        </BouncyButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  spacer: {
    height: 20,
  },
  screen: { flex: 1, backgroundColor: "#09090F" },
  bgGlow: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    top: -140,
    alignSelf: "center",
    opacity: 0.07,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  wordmark: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 14,
    fontWeight: "300",
    letterSpacing: 4,
    textTransform: "lowercase",
    fontFamily: F.regular,
  },
  stepNum: {
    color: "rgba(255,255,255,0.2)",
    fontSize: 12,
    fontWeight: "500",
    width: 38,
    textAlign: "right",
    fontFamily: F.medium,
  },
  labelStrip: { height: 28, marginTop: 12 },
  stepLabel: {
    color: "rgba(255,255,255,0.2)",
    fontSize: 11,
    letterSpacing: 0.3,
    fontFamily: F.medium,
  },
  panel: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  footer: { paddingHorizontal: 24, paddingBottom: 36, paddingTop: 8 },
  btn: {
    height: 54,
    borderRadius: 27,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
  },
  btnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.2,
    fontFamily: F.semibold,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,107,107,0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,107,107,0.25)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
    fontFamily: F.medium,
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  termsText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
    fontFamily: F.regular,
  },
  ageChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 4,
  },
  ageChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  ageError: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,107,107,0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,107,107,0.25)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 8,
  },
  ageErrorText: {
    color: "#FF6B6B",
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },
  datePickerContainer: {
    marginTop: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
});
