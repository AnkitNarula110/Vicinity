// src/api/auth.ts
// ---------------
// Register + login. No JWT — only userId is persisted.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config/api";
import type {
  CompleteRegistrationRequest,
  LoginRequest,
  LoginResponse,
  CompleteRegistrationResponse,
} from "../types";

/// Store the user id after a successful register/login.
async function persistUserLogin(res: LoginResponse): Promise<void> {
  if (!res?.user_data.userid) return;
  await AsyncStorage.setItem("userId", res.user_data.userid);
}

async function persistUserRegister(res: CompleteRegistrationResponse) {
  if (!res?.userid) return;
  await AsyncStorage.setItem("userId", res.userid);
}

export const completeRegistration = async (
  data: CompleteRegistrationRequest,
): Promise<CompleteRegistrationResponse> => {
  try {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || "Registration failed");
    }

    const json: CompleteRegistrationResponse = await response.json();
    await persistUserRegister(json);
    return json;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
};

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || "Login failed");
    }

    const json: LoginResponse = await response.json();
    await persistUserLogin(json);
    return json;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

/// Clear the stored user id (logout).
export const logout = async (): Promise<void> => {
  await AsyncStorage.removeItem("userId");
};
