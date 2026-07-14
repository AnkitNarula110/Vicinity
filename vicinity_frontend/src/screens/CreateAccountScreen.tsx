import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Animated,
  Pressable,
  Easing,
} from "react-native";
import { V } from "../theme/colors";
import { F } from "../theme/fonts";
import BouncyButton from "../widgets/BouncyButton";
import { Ionicons } from "@expo/vector-icons";
import { saveAuth, saveTempRegistrationData } from "../storage/userStore";
import { completeRegistration } from "../api/authApi";
import { s, inp, mk } from "../styles/CreateAccountStyles";
import { checkPasswordStrength, generateStrongPassword } from "../utils/password";

// ─── Email validator ───────────────────────────────────────────────────────────
const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

// ─── Input Field ───────────────────────────────────────────────────────────────
interface InputFieldProps {
  icon: any;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secure?: boolean;
  showToggle?: boolean;
  onToggle?: () => void;
  keyboardType?: any;
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
  keyboardType,
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
      hasError ? "#FF6B6B" : "rgba(255,255,255,0.08)",
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
        keyboardType={keyboardType}
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

// ─── Two-dot proximity mark (same as LoginScreen) ────────────────────────────
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

// ─── Step progress dots ────────────────────────────────────────────────────────
interface StepDotsProps {
  total: number;
  current: number;
  accent?: string;
}

function StepDots({ total, current, accent }: StepDotsProps) {
  return (
    <View style={{ flexDirection: "row", gap: 6, marginBottom: 24 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === current ? 20 : 6,
            height: 6,
            borderRadius: 3,
            backgroundColor:
              i === current ? accent || V.coral : "rgba(255,255,255,0.15)",
          }}
        />
      ))}
    </View>
  );
}

// ─── Create Account Screen ────────────────────────────────────────────────────
interface CreateAccountScreenProps {
  onRegisterSuccess: () => void;
  onNavigateToLogin: () => void;
}

export default function CreateAccountScreen({
  onRegisterSuccess,
  onNavigateToLogin,
}: CreateAccountScreenProps) {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPass] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Entrance
  const opacity = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(28)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(slideY, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Step slide
  const transAnim = useRef(new Animated.Value(1)).current;
  const transX = useRef(new Animated.Value(0)).current;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (step === 0) {
      if (!username.trim()) {
        errs.username = "Please enter a username.";
      } else if (username.trim().length < 3) {
        errs.username = "Username must be at least 3 characters.";
      }

      const trimmedPhone = phone.trim();
      const trimmedEmail = email.trim();

      if (!trimmedPhone && !trimmedEmail) {
        errs.phone = "Please enter either a phone number or an email.";
        errs.email = "Please enter either a phone number or an email.";
      } else {
        if (trimmedPhone && !/^[0-9+\-\s()]{10,15}$/.test(trimmedPhone)) {
          errs.phone = "Please enter a valid phone number.";
        }
        if (trimmedEmail && !isValidEmail(trimmedEmail)) {
          errs.email = "Please enter a valid email address.";
        }
      }
    }
    if (step === 1) {
      if (password.length < 6)
        errs.password = "Password must be at least 6 characters.";
      if (password !== confirm) errs.confirm = "Passwords do not match.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goNext = async () => {
    if (!validate()) return;
    if (step < 1) {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(transAnim, {
            toValue: 0,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(transX, {
            toValue: -20,
            duration: 180,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        setStep(1);
        transX.setValue(20);
        Animated.parallel([
          Animated.timing(transAnim, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.timing(transX, {
            toValue: 0,
            duration: 220,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      await handleRegister();
    }
  };

  const copy = [
    {
      title: "What's your contact info?",
      sub: "Enter your username and email or phone number.",
    },
    {
      title: "Choose a password.",
      sub: "At least 6 characters. Make it yours.",
    },
  ];

  const handleRegister = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      // Create temporary registration data
      const tempData = {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        phone: phone.trim(),
        dob: null,
        aadharnumber: null,
        address: null,
      };

      // Save temporary data for onboarding
      await saveTempRegistrationData(tempData);

      // Save auth info (will be used after onboarding)
      await saveAuth(email.trim().toLowerCase() || phone.trim(), password);

      console.log("Registration data saved, proceeding to onboarding");

      // Navigate to onboarding
      onRegisterSuccess();
    } catch (error: any) {
      console.log("Registration Error", error);
      alert(error.message || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={s.screen}>
      <View
        style={[s.glow, { top: -80, left: -60, backgroundColor: "#DFBA73" }]}
      />
      <View
        style={[s.glow, { bottom: -80, right: -80, backgroundColor: V.coral }]}
      />

      {/* Top bar */}
      <Animated.View
        style={[s.topBar, { opacity, transform: [{ translateY: slideY }] }]}
      >
        <Pressable
          onPress={
            step > 0
              ? () => {
                  setErrors({});
                  setStep(0);
                }
              : onNavigateToLogin
          }
        >
          <Ionicons name="arrow-back" size={22} color="rgba(255,255,255,0.5)" />
        </Pressable>
        <ProximityMark />
        <View style={{ width: 22 }} />
      </Animated.View>

      {/* Content */}
      <Animated.View
        style={[s.content, { opacity, transform: [{ translateY: slideY }] }]}
      >
        <StepDots total={2} current={step} />

        <Animated.View
          style={{ opacity: transAnim, transform: [{ translateX: transX }] }}
        >
          <Text style={s.title}>{copy[step].title}</Text>
          <Text style={s.sub}>{copy[step].sub}</Text>
          <View style={{ height: 28 }} />

          {step === 0 && (
            <>
              <InputField
                icon="person-outline"
                placeholder="Username"
                value={username}
                onChangeText={(t) => {
                  setUsername(t);
                  setErrors((prev) => ({ ...prev, username: "" }));
                }}
                hasError={!!errors.username}
              />
              {errors.username && (
                <Text style={s.errText}>{errors.username}</Text>
              )}

              <View style={{ height: 12 }} />

              <InputField
                icon="call-outline"
                placeholder="Phone number"
                value={phone}
                keyboardType="phone-pad"
                onChangeText={(t) => {
                  setPhone(t);
                  setErrors((prev) => ({ ...prev, phone: "" }));
                }}
                hasError={!!errors.phone}
              />
              {errors.phone && <Text style={s.errText}>{errors.phone}</Text>}

              <View style={{ height: 12 }} />

              <InputField
                icon="mail-outline"
                placeholder="your@email.com"
                value={email}
                keyboardType="email-address"
                onChangeText={(t) => {
                  setEmail(t);
                  setErrors((prev) => ({ ...prev, email: "" }));
                }}
                hasError={!!errors.email}
              />
              {errors.email && <Text style={s.errText}>{errors.email}</Text>}
            </>
          )}

          {step === 1 && (() => {
            const strength = checkPasswordStrength(password);
            return (
              <>
                <InputField
                  icon="lock-closed-outline"
                  placeholder="Create password (min. 6 chars)"
                  value={password}
                  onChangeText={(t) => {
                    setPass(t);
                    setErrors((prev) => ({ ...prev, password: "" }));
                  }}
                  secure={!showPass}
                  showToggle
                  onToggle={() => setShowPass((p) => !p)}
                  hasError={!!errors.password}
                />
                {errors.password ? (
                  <Text style={s.errText}>{errors.password}</Text>
                ) : null}

                <Pressable
                  onPress={() => {
                    const sug = generateStrongPassword();
                    setPass(sug);
                    setConfirm(sug);
                    setErrors((prev) => ({ ...prev, password: "", confirm: "" }));
                  }}
                  style={pw.suggestBtn}
                >
                  <Ionicons name="key-outline" size={13} color={V.coral} style={{ marginRight: 4 }} />
                  <Text style={pw.suggestText}>Suggest a strong password</Text>
                </Pressable>

                {password.length > 0 && (
                  <>
                    <View style={pw.meterContainer}>
                      <View style={pw.barRow}>
                        <View style={[pw.bar, { backgroundColor: strength.score >= 1 ? strength.color : "rgba(255,255,255,0.06)" }]} />
                        <View style={[pw.bar, { backgroundColor: strength.score >= 2 ? strength.color : "rgba(255,255,255,0.06)" }]} />
                        <View style={[pw.bar, { backgroundColor: strength.score >= 3 ? strength.color : "rgba(255,255,255,0.06)" }]} />
                      </View>
                      <Text style={[pw.label, { color: strength.color }]}>{strength.label}</Text>
                    </View>

                    <View style={pw.checklist}>
                      <View style={pw.checkItem}>
                        <Ionicons name={strength.criteria.length ? "checkmark-circle" : "ellipse-outline"} size={12} color={strength.criteria.length ? "#10B981" : "rgba(255,255,255,0.25)"} />
                        <Text style={[pw.checkText, strength.criteria.length ? pw.checkTextActive : null]}>At least 8 characters</Text>
                      </View>
                      <View style={pw.checkItem}>
                        <Ionicons name={strength.criteria.uppercase ? "checkmark-circle" : "ellipse-outline"} size={12} color={strength.criteria.uppercase ? "#10B981" : "rgba(255,255,255,0.25)"} />
                        <Text style={[pw.checkText, strength.criteria.uppercase ? pw.checkTextActive : null]}>Uppercase & lowercase</Text>
                      </View>
                      <View style={pw.checkItem}>
                        <Ionicons name={strength.criteria.numberOrSymbol ? "checkmark-circle" : "ellipse-outline"} size={12} color={strength.criteria.numberOrSymbol ? "#10B981" : "rgba(255,255,255,0.25)"} />
                        <Text style={[pw.checkText, strength.criteria.numberOrSymbol ? pw.checkTextActive : null]}>Numbers or symbols</Text>
                      </View>
                    </View>
                    <View style={{ height: 16 }} />
                  </>
                )}

                <InputField
                  icon="checkmark-circle-outline"
                  placeholder="Confirm password"
                  value={confirm}
                  onChangeText={(t) => {
                    setConfirm(t);
                    setErrors((prev) => ({ ...prev, confirm: "" }));
                  }}
                  secure={!showPass}
                  hasError={!!errors.confirm}
                />
                {errors.confirm ? (
                  <Text style={s.errText}>{errors.confirm}</Text>
                ) : null}
              </>
            );
          })()}
        </Animated.View>
      </Animated.View>

      {/* Footer */}
      <Animated.View
        style={[s.footer, { opacity, transform: [{ translateY: slideY }] }]}
      >
        {step === 1 && (
          <Text style={s.terms}>
            By continuing you agree to our{" "}
            <Text style={{ color: V.coral }}>Terms</Text> and{" "}
            <Text style={{ color: V.coral }}>Privacy Policy</Text>
          </Text>
        )}
        <View style={{ height: 14 }} />
        <BouncyButton
          onTap={isLoading ? undefined : goNext}
          style={[s.primaryBtn, isLoading && { opacity: 0.6 }]}
        >
          <Text style={s.primaryBtnText}>
            {isLoading ? "Creating..." : step === 1 ? "Create account" : "Next"}
          </Text>
          {!isLoading && (
            <Ionicons
              name="arrow-forward"
              size={16}
              color="#fff"
              style={{ marginLeft: 8 }}
            />
          )}
        </BouncyButton>
        <View style={{ height: 16 }} />
        <Pressable onPress={onNavigateToLogin} style={{ alignItems: "center" }}>
          <Text style={s.loginLink}>
            Already have an account?{" "}
            <Text style={{ color: V.coral }}>Sign in</Text>
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const pw = StyleSheet.create({
  suggestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 6,
    marginBottom: 12,
    paddingVertical: 4,
  },
  suggestText: {
    color: V.coral,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: F.medium,
  },
  meterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  barRow: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  bar: {
    height: 4,
    flex: 1,
    borderRadius: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: F.semibold,
    width: 70,
    textAlign: 'right',
  },
  checklist: {
    marginTop: 12,
    gap: 6,
    paddingLeft: 4,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    fontFamily: F.regular,
  },
  checkTextActive: {
    color: 'rgba(255,255,255,0.7)',
  },
});
