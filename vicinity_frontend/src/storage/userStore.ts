import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserProfile } from "../types";

const KEYS = {
  AUTH: "vicinity_auth",
  PROFILE: "vicinity_profile",
  USER_DATA: "userData",
};

// ─── Auth ──────────────────────────────────────────────────────────────────────
export async function saveAuth(
  email: string,
  password?: string,
): Promise<void> {
  await AsyncStorage.setItem(KEYS.AUTH, JSON.stringify({ email, password }));
}

export async function loadAuth(): Promise<{
  email: string;
  password?: string;
} | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.AUTH);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ─── Profile ───────────────────────────────────────────────────────────────────
export async function saveProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
}

export async function loadProfile(): Promise<UserProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.PROFILE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const loadUserData = async (): Promise<UserProfile | null> => {
  try {
    const raw = await AsyncStorage.getItem(KEYS.USER_DATA);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error loading user data:", error);
    return null;
  }
};

// ─── Clear everything (logout) ────────────────────────────────────────────────
export async function clearAll(): Promise<void> {
  await AsyncStorage.multiRemove([KEYS.AUTH, KEYS.PROFILE]);
}

const TEMP_REG_DATA_KEY = "@vicinity_temp_reg_data";

export const saveTempRegistrationData = async (data: any) => {
  try {
    await AsyncStorage.setItem(TEMP_REG_DATA_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Error saving temp registration data:", error);
    return false;
  }
};

export const getTempRegistrationData = async () => {
  try {
    const data = await AsyncStorage.getItem(TEMP_REG_DATA_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error getting temp registration data:", error);
    return null;
  }
};

export const clearTempRegistrationData = async () => {
  try {
    await AsyncStorage.removeItem(TEMP_REG_DATA_KEY);
    return true;
  } catch (error) {
    console.error("Error clearing temp registration data:", error);
    return false;
  }
};
