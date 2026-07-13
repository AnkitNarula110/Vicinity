import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Animated,
  Pressable,
  Easing,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { V } from "../theme/colors";
import { F } from "../theme/fonts";
import BouncyButton from "../widgets/BouncyButton";
import { Ionicons } from "@expo/vector-icons";
import {
  sendForgotPasswordCode,
  verifyForgotPasswordCode,
  resetPassword,
} from "../api/authApi";
import { UserProfile } from "../types";

// ─── Validators ───────────────────────────────────────────────────────────────
const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
const isValidPhone = (p: string) => /^[0-9+\-\s()]{10,15}$/.test(p.trim());

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

// ─── Step progress dots ────────────────────────────────────────────────────────
interface StepDotsProps {
  total: number;
  current: number;
}

function StepDots({ total, current }: StepDotsProps) {
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
              i === current ? V.coral : "rgba(255,255,255,0.15)",
          }}
        />
      ))}
    </View>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
interface ForgotPasswordScreenProps {
  onBackToLogin: (prefilledEmail?: string) => void;
  onDirectLogin: (profile: UserProfile, email: string) => void;
}

type StepType = 0 | 1 | 2 | 3; // 0: Identifier, 1: OTP & Choice, 2: New Password, 3: Success

export default function ForgotPasswordScreen({
  onBackToLogin,
  onDirectLogin,
}: ForgotPasswordScreenProps) {
  const [step, setStep] = useState<StepType>(0);
  const [identifier, setIdentifier] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  // Profile data returned on OTP verification if any
  const [verifiedProfile, setVerifiedProfile] = useState<UserProfile | null>(null);

  // Navigation animations
  const transAnim = useRef(new Animated.Value(1)).current;
  const transX = useRef(new Animated.Value(0)).current;

  // Screen entrance animations
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

  // OTP Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 1 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const slideTransition = (nextStep: StepType, direction: "forward" | "back" = "forward") => {
    const slideOutTo = direction === "forward" ? -20 : 20;
    const slideInFrom = direction === "forward" ? 20 : -20;

    Animated.sequence([
      Animated.parallel([
        Animated.timing(transAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(transX, {
          toValue: slideOutTo,
          duration: 180,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setStep(nextStep);
      transX.setValue(slideInFrom);
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
  };

  const validateIdentifier = () => {
    const errs: Record<string, string> = {};
    const value = identifier.trim();
    if (!value) {
      errs.identifier = "Please enter your email or phone number.";
    } else if (!isValidEmail(value) && !isValidPhone(value)) {
      errs.identifier = "Please enter a valid email or phone number.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSendOTP = async () => {
    if (!validateIdentifier()) return;
    setIsLoading(true);
    setErrors({});
    try {
      await sendForgotPasswordCode(identifier.trim());
      setResendTimer(30);
      setIsOtpVerified(false);
      setOtpCode("");
      setIsLoading(false);
      slideTransition(1, "forward");
    } catch (err: any) {
      setIsLoading(false);
      setErrors({ identifier: err.message || "Failed to send code. Please try again." });
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    setIsLoading(true);
    try {
      await sendForgotPasswordCode(identifier.trim());
      setResendTimer(30);
      setIsLoading(false);
    } catch (err: any) {
      setIsLoading(false);
      setErrors({ otp: err.message || "Failed to resend code." });
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length < 6) {
      setErrors({ otp: "Please enter the complete 6-digit code." });
      return;
    }
    setIsLoading(true);
    setErrors({});
    try {
      const response = await verifyForgotPasswordCode(identifier.trim(), otpCode);
      // Backend returns { token, user } on successful verification
      if (response && response.user) {
        setVerifiedProfile(response.user);
      }
      setIsOtpVerified(true);
      setIsLoading(false);
    } catch (err: any) {
      setIsLoading(false);
      setErrors({ otp: err.message || "Invalid code. Please try again." });
    }
  };

  const handleDirectLoginPress = () => {
    if (verifiedProfile) {
      onDirectLogin(verifiedProfile, identifier.trim());
    } else {
      // Fallback in case response didn't supply user profile but user selects direct login
      setErrors({ otp: "Profile data unavailable. Please reset your password." });
    }
  };

  const handleResetPassword = async () => {
    const errs: Record<string, string> = {};
    if (newPassword.length < 6) {
      errs.password = "Password must be at least 6 characters.";
    }
    if (newPassword !== confirmPassword) {
      errs.confirm = "Passwords do not match.";
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsLoading(true);
    try {
      await resetPassword(identifier.trim(), otpCode, newPassword);
      setIsLoading(false);
      slideTransition(3, "forward");
    } catch (err: any) {
      setIsLoading(false);
      setErrors({ password: err.message || "Failed to reset password. Try again." });
    }
  };

  // Rendering step content
  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <View style={s.stepContainer}>
            <Text style={s.title}>Reset password</Text>
            <Text style={s.sub}>
              Enter the email address or phone number associated with your account.
            </Text>
            <View style={{ height: 32 }} />

            <InputField
              icon="mail-outline"
              placeholder="Email or Phone Number"
              value={identifier}
              onChangeText={(t) => {
                setIdentifier(t);
                setErrors({});
              }}
              hasError={!!errors.identifier}
              keyboardType="default"
            />
            {errors.identifier ? (
              <Text style={s.errText}>{errors.identifier}</Text>
            ) : (
              <View style={{ height: 16 }} />
            )}

            <View style={{ height: 24 }} />

            <BouncyButton onTap={handleSendOTP} style={s.primaryBtn} disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={s.primaryBtnText}>Send Verification Code</Text>
                  <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 8 }} />
                </>
              )}
            </BouncyButton>
          </View>
        );

      case 1:
        return (
          <View style={s.stepContainer}>
            <Text style={s.title}>Verification</Text>
            <Text style={s.sub}>
              We sent a 6-digit verification code to {identifier}.
            </Text>
            <View style={{ height: 32 }} />

            {/* OTP character input */}
            {!isOtpVerified ? (
              <>
                <View style={s.otpWrapper}>
                  <TextInput
                    style={s.hiddenTextInput}
                    value={otpCode}
                    onChangeText={(t) => {
                      if (t.length <= 6) {
                        setOtpCode(t);
                        setErrors({});
                      }
                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                  />
                  <Pressable style={s.otpInputRow}>
                    {Array.from({ length: 6 }).map((_, index) => {
                      const char = otpCode[index] || "";
                      const isFocusedCell = otpCode.length === index;
                      return (
                        <View
                          key={index}
                          style={[
                            s.otpCell,
                            char ? s.otpCellFilled : null,
                            isFocusedCell ? s.otpCellFocused : null,
                          ]}
                        >
                          <Text style={s.otpCellText}>{char}</Text>
                        </View>
                      );
                    })}
                  </Pressable>
                </View>
                {errors.otp ? (
                  <Text style={s.errTextCenter}>{errors.otp}</Text>
                ) : (
                  <View style={{ height: 16 }} />
                )}

                <View style={s.resendRow}>
                  {resendTimer > 0 ? (
                    <Text style={s.resendText}>
                      Resend code in <Text style={{ color: V.coral }}>{resendTimer}s</Text>
                    </Text>
                  ) : (
                    <Pressable onPress={handleResendOTP}>
                      <Text style={[s.resendText, { color: V.coral, fontWeight: "600" }]}>
                        Resend code
                      </Text>
                    </Pressable>
                  )}
                </View>

                <View style={{ height: 24 }} />

                <BouncyButton onTap={handleVerifyOTP} style={s.primaryBtn} disabled={isLoading}>
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={s.primaryBtnText}>Verify Code</Text>
                      <Ionicons name="checkmark-circle-outline" size={18} color="#fff" style={{ marginLeft: 8 }} />
                    </>
                  )}
                </BouncyButton>
              </>
            ) : (
              // Option selection once verified
              <Animated.View style={s.choiceWrapper}>
                <Ionicons
                  name="checkmark-circle"
                  size={56}
                  color={V.coral}
                  style={{ alignSelf: "center", marginBottom: 16 }}
                />
                <Text style={[s.title, { fontSize: 22, textAlign: "center" }]}>
                  Identity Verified!
                </Text>
                <Text style={[s.sub, { textAlign: "center", marginBottom: 32 }]}>
                  Choose how you would like to proceed:
                </Text>

                <BouncyButton onTap={handleDirectLoginPress} style={s.primaryBtn}>
                  <Text style={s.primaryBtnText}>Log In Directly</Text>
                  <Ionicons name="log-in-outline" size={18} color="#fff" style={{ marginLeft: 8 }} />
                </BouncyButton>

                <View style={{ height: 14 }} />

                <BouncyButton
                  onTap={() => slideTransition(2, "forward")}
                  style={s.ghostBtn}
                >
                  <Text style={s.ghostBtnText}>Reset Password</Text>
                  <Ionicons name="key-outline" size={16} color="rgba(255,255,255,0.5)" style={{ marginLeft: 8 }} />
                </BouncyButton>
              </Animated.View>
            )}
          </View>
        );

      case 2:
        return (
          <View style={s.stepContainer}>
            <Text style={s.title}>New password</Text>
            <Text style={s.sub}>
              Set a strong password to protect your account.
            </Text>
            <View style={{ height: 32 }} />

            <InputField
              icon="lock-closed-outline"
              placeholder="New Password"
              value={newPassword}
              onChangeText={(t) => {
                setNewPassword(t);
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
              <View style={{ height: 12 }} />
            )}

            <InputField
              icon="lock-closed-outline"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChangeText={(t) => {
                setConfirmPassword(t);
                setErrors({});
              }}
              secure={!showPass}
              hasError={!!errors.confirm}
            />
            {errors.confirm ? (
              <Text style={s.errText}>{errors.confirm}</Text>
            ) : (
              <View style={{ height: 16 }} />
            )}

            <View style={{ height: 24 }} />

            <BouncyButton onTap={handleResetPassword} style={s.primaryBtn} disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={s.primaryBtnText}>Reset Password</Text>
                  <Ionicons name="save-outline" size={18} color="#fff" style={{ marginLeft: 8 }} />
                </>
              )}
            </BouncyButton>
          </View>
        );

      case 3:
        return (
          <View style={[s.stepContainer, { alignItems: "center", justifyContent: "center" }]}>
            <View style={s.successCircle}>
              <Ionicons name="checkmark-done" size={48} color={V.coral} />
            </View>
            <View style={{ height: 28 }} />
            <Text style={[s.title, { textAlign: "center" }]}>Password reset</Text>
            <Text style={[s.sub, { textAlign: "center", maxWidth: "80%" }]}>
              Your password has been changed successfully. You can now log in with your new credentials.
            </Text>

            <View style={{ height: 44 }} />

            <BouncyButton
              onTap={() => onBackToLogin(identifier.trim())}
              style={[s.primaryBtn, { width: "100%" }]}
            >
              <Text style={s.primaryBtnText}>Back to Sign In</Text>
            </BouncyButton>
          </View>
        );

      default:
        return null;
    }
  };

  const handleBackPress = () => {
    if (step === 0) {
      onBackToLogin();
    } else if (step === 1) {
      slideTransition(0, "back");
    } else if (step === 2) {
      slideTransition(1, "back");
    } else if (step === 3) {
      onBackToLogin(identifier.trim());
    }
  };

  const activeStepIndicatorIndex = step === 3 ? 2 : step > 2 ? 2 : step;

  return (
    <View style={s.screen}>
      <LinearGradient
        colors={["#0F0F1E", "#09090F", "#09090F"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[s.glow, { top: -80, right: -80, backgroundColor: V.coral, opacity: 0.09 }]} />
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

      {/* Header Bar */}
      <Animated.View
        style={[s.topBar, { opacity, transform: [{ translateY: slideY }] }]}
      >
        <Pressable onPress={handleBackPress} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </Pressable>

        <ProximityMark />
        <View style={{ width: 44 }} />
      </Animated.View>

      {/* Center Content */}
      <Animated.View
        style={[
          s.content,
          {
            opacity: transAnim,
            transform: [{ translateX: transX }],
          },
        ]}
      >
        {renderStepContent()}
      </Animated.View>

      {/* Footer step indicators */}
      <Animated.View
        style={[s.footer, { opacity, transform: [{ translateY: slideY }] }]}
      >
        {step < 3 && <StepDots total={3} current={activeStepIndicatorIndex} />}
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#09090F",
    paddingHorizontal: 24,
    paddingTop: 52,
    paddingBottom: 36,
    justifyContent: "space-between",
  },
  glow: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 44,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.03)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  stepContainer: {
    width: "100%",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontFamily: F.serif,
    lineHeight: 36,
  },
  sub: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 14,
    fontFamily: F.regular,
    marginTop: 8,
    lineHeight: 22,
  },
  errText: {
    color: "#FF6B6B",
    fontSize: 11,
    fontFamily: F.medium,
    marginTop: 6,
    marginLeft: 2,
  },
  errTextCenter: {
    color: "#FF6B6B",
    fontSize: 11,
    fontFamily: F.medium,
    marginTop: 10,
    textAlign: "center",
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
    fontFamily: F.semibold,
  },
  ghostBtn: {
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  ghostBtnText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 15,
    fontFamily: F.medium,
  },
  footer: {
    alignItems: "center",
  },
  // OTP Styles
  otpWrapper: {
    width: "100%",
    position: "relative",
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  hiddenTextInput: {
    ...StyleSheet.absoluteFill,
    opacity: 0,
    zIndex: 99,
  },
  otpInputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  otpCell: {
    width: 44,
    height: 52,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  otpCellFilled: {
    borderColor: "rgba(255,255,255,0.2)",
  },
  otpCellFocused: {
    borderColor: V.coral,
    backgroundColor: "rgba(240, 99, 90, 0.05)",
  },
  otpCellText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontFamily: F.semibold,
  },
  resendRow: {
    marginTop: 18,
    alignItems: "center",
  },
  resendText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 13,
    fontFamily: F.regular,
  },
  choiceWrapper: {
    width: "100%",
    paddingHorizontal: 8,
  },
  successCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(240, 99, 90, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(240, 99, 90, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
});
