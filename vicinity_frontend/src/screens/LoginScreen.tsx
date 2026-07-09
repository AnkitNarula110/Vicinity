import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Animated,
  Pressable,
  Easing,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { V } from "../theme/colors";
import { F } from "../theme/fonts";
import BouncyButton from "../widgets/BouncyButton";
import { login } from "../api/authApi";

// ─── Email validator ───────────────────────────────────────────────────────────
const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

// ─── Two-dot proximity mark ───────────────────────────────────────────────────
function ProximityMark() {
  const leftX = useRef(new Animated.Value(-14)).current;
  const rightX = useRef(new Animated.Value(14)).current;
  const glowOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(leftX, {
            toValue: -5,
            duration: 2800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(rightX, {
            toValue: 5,
            duration: 2800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowOp, {
            toValue: 1,
            duration: 2800,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(leftX, {
            toValue: -14,
            duration: 2800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(rightX, {
            toValue: 14,
            duration: 2800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowOp, {
            toValue: 0,
            duration: 2800,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ).start();
  }, []);

  return (
    <View style={mk.container}>
      <Animated.View style={[mk.glow, { opacity: glowOp }]} />
      <Animated.View
        style={[mk.dot, mk.left, { transform: [{ translateX: leftX }] }]}
      />
      <Animated.View
        style={[mk.dot, mk.right, { transform: [{ translateX: rightX }] }]}
      />
    </View>
  );
}

const mk = StyleSheet.create({
  container: {
    width: 80,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  glow: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: V.coral,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    position: "absolute",
  },
  left: {
    backgroundColor: "#F5F0E8",
  },
  right: {
    backgroundColor: V.coral,
  },
});

// ─── Input Field ───────────────────────────────────────────────────────────────
interface InputFieldProps {
  icon: any;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secure?: boolean;
  showToggle?: boolean;
  onToggle?: () => void;
  hasError?: boolean;
}

function InputField({
  icon,
  placeholder,
  value,
  onChangeText,
  secure,
  showToggle,
  onToggle,
  hasError,
}: InputFieldProps) {
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
    outputRange: [
      hasError ? "#FF6B6B44" : "rgba(255,255,255,0.08)",
      hasError ? "#FF6B6B" : V.coral,
    ],
  });

  return (
    <Animated.View style={[inp.wrapper, { borderColor }]}>
      <Ionicons
        name={icon}
        size={17}
        color={
          focused ? V.coral : hasError ? "#FF6B6B" : "rgba(255,255,255,0.25)"
        }
        style={inp.icon}
      />
      <TextInput
        style={inp.text}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.18)"
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        secureTextEntry={secure}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={icon === "mail-outline" ? "email-address" : "default"}
      />
      {showToggle && (
        <Pressable onPress={onToggle} style={inp.eye}>
          <Ionicons
            name={secure ? "eye-outline" : "eye-off-outline"}
            size={17}
            color="rgba(255,255,255,0.25)"
          />
        </Pressable>
      )}
    </Animated.View>
  );
}

const inp = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 52,
  },
  icon: {
    marginRight: 12,
  },
  text: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
    height: "100%",
    outlineStyle: "none",
  } as any,
  eye: {
    padding: 4,
  },
});

// ─── Login Screen Props ──────────────────────────────────────────────────────
interface LoginScreenProps {
  onLogin: () => void;
  onNavigateToRegister: () => void;
}

// ─── Login Screen ──────────────────────────────────────────────────────────────
export default function LoginScreen({
  onLogin,
  onNavigateToRegister,
}: LoginScreenProps) {
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Entrance animations
  const topOpacity = useRef(new Animated.Value(0)).current;
  const topY = useRef(new Animated.Value(-24)).current;
  const botOpacity = useRef(new Animated.Value(0)).current;
  const botY = useRef(new Animated.Value(32)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(topOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(topY, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(200),
        Animated.parallel([
          Animated.timing(botOpacity, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(botY, {
            toValue: 0,
            duration: 700,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, []);

  const validate = () => {
    const errs: Record<string, string> = {};

    // Validate login identifier (can be email, username, or phone)
    if (!loginIdentifier.trim()) {
      errs.loginIdentifier = "Enter your email, username, or phone number.";
    } else {
      // Optional: Basic validation for different formats
      const trimmed = loginIdentifier.trim();
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
      const isPhone = /^[0-9+\-\s()]{10,15}$/.test(trimmed); // Basic phone validation

      // If it's not email and not phone, assume it's username
      // You can add more specific validation if needed
      if (!isEmail && !isPhone && trimmed.length < 3) {
        errs.loginIdentifier = "Username must be at least 3 characters.";
      }
    }

    if (!password.trim()) {
      errs.password = "Enter your password.";
    } else if (password.length < 6) {
      errs.password = "Password must be at least 6 characters.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };
  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      console.log({ loginIdentifier });
      // Send the login identifier (could be email, username, or phone)
      const response = await login({
        login: loginIdentifier.trim(), // This can be email, username, or phone
        password: password,
      });
      console.log({ response });

      // Store the token and user data
      if (response.base_response.success) {
        //await AsyncStorage.setItem("authToken", response.token);
        await AsyncStorage.setItem(
          "userData",
          JSON.stringify(response.user_data),
        );
      }

      onLogin();
    } catch (error: any) {
      console.error("Login error:", error);
      Alert.alert(
        "Login Failed",
        error.message || "Invalid credentials. Please try again.",
        [{ text: "OK" }],
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.screen}>
      <LinearGradient
        colors={["#0F0F1E", "#09090F", "#09090F"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          s.glow,
          { top: -80, right: -80, backgroundColor: V.coral, opacity: 0.09 },
        ]}
      />
      <View
        style={[
          s.glow,
          {
            bottom: -60,
            left: -60,
            width: 220,
            height: 220,
            borderRadius: 110,
            backgroundColor: "#DFBA73",
            opacity: 0.05,
          },
        ]}
      />

      {/* Logo */}
      <Animated.View
        style={[
          s.top,
          { opacity: topOpacity, transform: [{ translateY: topY }] },
        ]}
      >
        <ProximityMark />
        <Text style={s.wordmark}>vicinity</Text>
        <Text style={s.headline}>
          Someone nearby{"\n"}is waiting to meet you.
        </Text>
      </Animated.View>

      {/* Form */}
      <Animated.View
        style={[
          s.bottom,
          { opacity: botOpacity, transform: [{ translateY: botY }] },
        ]}
      >
        <Text style={s.formLabel}>Sign in to continue</Text>
        <View style={{ height: 16 }} />

        <InputField
          icon="person-outline" // Changed icon to person for username/email/phone
          placeholder="Email, username, or phone"
          value={loginIdentifier}
          onChangeText={(t) => {
            setLoginIdentifier(t);
            setErrors({});
          }}
          hasError={!!errors.loginIdentifier}
        />
        {errors.loginIdentifier ? (
          <Text style={s.errText}>{errors.loginIdentifier}</Text>
        ) : (
          <View style={{ height: 8 }} />
        )}

        <InputField
          icon="lock-closed-outline"
          placeholder="Password"
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            setErrors({});
          }}
          secure={!showPass}
          showToggle
          onToggle={() => setShowPass((p) => !p)}
          hasError={!!errors.password}
        />
        {errors.password ? (
          <Text style={s.errText}>{errors.password}</Text>
        ) : (
          <View style={{ height: 4 }} />
        )}

        <Pressable style={s.forgotBtn}>
          <Text style={s.forgotText}>Forgot password?</Text>
        </Pressable>

        <View style={{ height: 24 }} />

        <BouncyButton
          onTap={loading ? undefined : handleLogin}
          style={[s.primaryBtn, loading && { opacity: 0.5 }]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={s.primaryBtnText}>Continue</Text>
              <Ionicons
                name="arrow-forward"
                size={16}
                color="#fff"
                style={{ marginLeft: 8 }}
              />
            </>
          )}
        </BouncyButton>

        <View style={s.divRow}>
          <View style={s.divLine} />
          <Text style={s.divText}>new here?</Text>
          <View style={s.divLine} />
        </View>

        <BouncyButton
          onTap={loading ? undefined : onNavigateToRegister}
          style={[
            s.ghostBtn,
            loading && { opacity: 0.5 }, // Visual feedback when disabled
          ]}
        >
          <Text style={s.ghostBtnText}>Create an account</Text>
        </BouncyButton>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#09090F",
    paddingHorizontal: 24,
    justifyContent: "space-between",
    paddingTop: 60,
    paddingBottom: 32,
  },
  glow: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  top: {
    alignItems: "flex-start",
  },
  wordmark: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "300",
    letterSpacing: 6,
    marginTop: 20,
    textTransform: "lowercase",
    fontFamily: F.regular,
  },
  headline: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 16,
    lineHeight: 25,
    marginTop: 14,
    fontWeight: "300",
    letterSpacing: 0.2,
    fontFamily: F.serif,
  },
  bottom: {},
  formLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    fontFamily: F.semibold,
  },
  errText: {
    color: "#FF6B6B",
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 10,
    marginLeft: 2,
    fontFamily: F.medium,
  },
  forgotBtn: {
    alignSelf: "flex-end",
    marginTop: 6,
  },
  forgotText: {
    color: V.coral,
    fontSize: 12,
    fontWeight: "500",
    fontFamily: F.medium,
  },
  primaryBtn: {
    height: 54,
    borderRadius: 27,
    backgroundColor: V.coral,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowColor: V.coral,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
    fontFamily: F.semibold,
  },
  divRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
  },
  divLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  divText: {
    color: "rgba(255,255,255,0.2)",
    fontSize: 11,
    marginHorizontal: 14,
    letterSpacing: 0.5,
    fontFamily: F.regular,
  },
  ghostBtn: {
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  ghostBtnText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 15,
    fontWeight: "500",
    fontFamily: F.medium,
  },
});
