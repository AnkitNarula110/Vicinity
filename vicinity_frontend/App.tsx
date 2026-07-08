import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  useWindowDimensions,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  DMSerifDisplay_400Regular,
} from "@expo-google-fonts/dm-serif-display";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

import { V } from "./src/theme/colors";
import { loadAuth, loadProfile } from "./src/storage/userStore";
import { UserProfile, Person, Match } from "./src/types";

// Screens
import LoginScreen from "./src/screens/LoginScreen";
import CreateAccountScreen from "./src/screens/CreateAccountScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import RadarScreen from "./src/screens/RadarScreen";
import MatchesScreen from "./src/screens/MatchesScreen";
import MyProfileScreen from "./src/screens/MyProfileScreen";
import ProfileDetailScreen from "./src/screens/ProfileDetailScreen";
import ChatScreen from "./src/screens/ChatScreen";
import CompassScreen from "./src/screens/CompassScreen";

// Components
import BottomTabBar from "./src/components/BottomTabBar";

// ─── App States ───────────────────────────────────────────────────────────────
// 'loading'    - checking AsyncStorage
// 'auth'       - login / create-account flow
// 'onboarding' - first-time setup
// 'main'       - tabbed main app
// 'edit'       - re-onboarding for profile edit

type AppState = "loading" | "auth" | "onboarding" | "main" | "edit";
type TabName = "nearby" | "matches" | "profile";
type OverlayName = "profile_detail" | "chat" | "compass" | null;

export default function App() {
  const [appState, setAppState] = useState<AppState>("loading");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Load Google Fonts
  const [fontsLoaded] = useFonts({
    DMSerifDisplay_400Regular,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Tab
  const [activeTab, setActiveTab] = useState<TabName>("nearby");
  const [unreadMatches, setUnreadMatches] = useState(1); // demo: 1 unread

  // Auth sub-screen
  const [authScreen, setAuthScreen] = useState<"login" | "create_account">(
    "login",
  );

  // Overlays (shown above tabs)
  const [overlay, setOverlay] = useState<OverlayName>(null);
  const [activeProfile, setActiveProfile] = useState<any>(null); // Can be Person or Match
  const [isUnlocked, setIsUnlocked] = useState(false);

  const { width } = useWindowDimensions();
  const isWeb = width > 500;
  const accent = userProfile?.favColor || V.coral;

  // ── Boot: check AsyncStorage ─────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const auth = await loadAuth();
      const profile = await loadProfile();
      if (auth && profile) {
        setUserProfile(profile);
        setAppState("main");
      } else if (auth) {
        setAppState("onboarding");
      } else {
        setAppState("auth");
      }
    })();
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleLogin = () => setAppState("onboarding");
  const handleRegisterSuccess = () => setAppState("onboarding");

  const handleOnboardingComplete = (data: UserProfile) => {
    setUserProfile(data);
    setAppState("main");
    setActiveTab("nearby");
  };

  const handleEditComplete = (data: UserProfile) => {
    setUserProfile(data);
    setAppState("main");
    setActiveTab("profile");
  };

  const handleViewProfile = (profile: Person) => {
    setActiveProfile(profile);
    setOverlay("profile_detail");
  };

  const handleNudgeSent = () => {
    setTimeout(() => {
      setIsUnlocked(true);
      setUnreadMatches(1);
      setOverlay("chat");
    }, 2000);
  };

  const handleOpenChat = (match: Match) => {
    setActiveProfile(match);
    setOverlay("chat");
    setUnreadMatches(0);
  };

  const handleLogout = () => {
    setUserProfile(null);
    setActiveProfile(null);
    setIsUnlocked(false);
    setOverlay(null);
    setActiveTab("nearby");
    setAppState("auth");
    setAuthScreen("login");
  };

  // ── Render helpers ────────────────────────────────────────────────────────────
  const renderAuthFlow = () => {
    if (authScreen === "create_account") {
      return (
        <CreateAccountScreen
          onRegisterSuccess={handleRegisterSuccess}
          onNavigateToLogin={() => setAuthScreen("login")}
        />
      );
    }
    return (
      <LoginScreen
        onLogin={handleLogin}
        onNavigateToRegister={() => setAuthScreen("create_account")}
      />
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "nearby":
        return (
          <RadarScreen
            userProfile={userProfile}
            isMatched={isUnlocked}
            onViewProfile={handleViewProfile}
            onOpenMyProfile={() => setActiveTab("profile")}
          />
        );
      case "matches":
        return (
          <MatchesScreen
            userProfile={userProfile}
            onOpenChat={handleOpenChat}
          />
        );
      case "profile":
        return (
          <MyProfileScreen
            profile={userProfile}
            onBack={() => setActiveTab("nearby")}
            onEditProfile={() => setAppState("edit")}
            onLogout={handleLogout}
          />
        );
      default:
        return null;
    }
  };

  const renderOverlay = () => {
    if (!overlay) return null;

    const screens: Record<string, React.ReactNode> = {
      profile_detail: (
        <ProfileDetailScreen
          profile={activeProfile}
          onBack={() => setOverlay(null)}
          onNudgeSent={handleNudgeSent}
        />
      ),
      chat: (
        <ChatScreen
          profile={activeProfile}
          isUnlocked={isUnlocked}
          onUnlock={() => setIsUnlocked(true)}
          onOpenCompass={() => setOverlay("compass")}
          onBack={() => setOverlay(null)}
        />
      ),
      compass: (
        <CompassScreen
          profile={activeProfile}
          onBack={() => setOverlay("chat")}
        />
      ),
    };

    return (
      <View style={StyleSheet.absoluteFill}>{screens[overlay] || null}</View>
    );
  };

  const renderContent = () => {
    // Loading spinner while checking storage + loading fonts
    if (appState === "loading" || !fontsLoaded) {
      return (
        <View style={styles.loader}>
          <ActivityIndicator color={V.coral} size="large" />
        </View>
      );
    }

    // Auth flow (login / register) — fullscreen, no tabs
    if (appState === "auth") {
      return renderAuthFlow();
    }

    // First-time onboarding — fullscreen, no tabs
    if (appState === "onboarding") {
      return <OnboardingScreen onComplete={handleOnboardingComplete} />;
    }

    // Edit mode — fullscreen, no tabs
    if (appState === "edit") {
      return (
        <OnboardingScreen
          initialData={userProfile ?? undefined}
          onComplete={handleEditComplete}
        />
      );
    }

    // Main tabbed app
    return (
      <View style={styles.mainContainer}>
        {/* Tab content */}
        <View style={styles.tabContent}>{renderTabContent()}</View>

        {/* Bottom tab bar — always visible in main state */}
        {!overlay && (
          <BottomTabBar
            activeTab={activeTab}
            onTabPress={(tabKey) => setActiveTab(tabKey as TabName)}
            accent={accent}
            unreadMatches={unreadMatches}
          />
        )}

        {/* Overlay screens (slide over tabs) */}
        {renderOverlay()}
      </View>
    );
  };

  // ── Frame wrapper ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.outerContainer}>
      <StatusBar style="light" />
      {isWeb ? (
        <View style={styles.phoneBezel}>
          <View style={styles.notch} />
          <SafeAreaView style={styles.screenInner}>
            {renderContent()}
          </SafeAreaView>
        </View>
      ) : (
        <SafeAreaView style={styles.fullscreen}>{renderContent()}</SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    backgroundColor: "#09090F",
    justifyContent: "center",
    alignItems: "center",
  },
  outerContainer: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  phoneBezel: {
    width: 375,
    height: 812,
    borderRadius: 44,
    borderWidth: 12,
    borderColor: "#1C1C24",
    backgroundColor: V.bg,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  notch: {
    position: "absolute",
    top: 0,
    left: "50%",
    width: 140,
    height: 28,
    backgroundColor: "#1C1C24",
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    zIndex: 999,
    transform: [{ translateX: -70 }],
  },
  screenInner: {
    flex: 1,
    paddingTop: 28,
  },
  fullscreen: {
    flex: 1,
    width: "100%",
    backgroundColor: V.bg,
  },
  mainContainer: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
});
