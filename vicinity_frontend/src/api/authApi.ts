import { API_URL } from "../config/api";
import {
  CompleteRegistrationRequest,
  LoginRequest,
  LoginResponse,
} from "../types";

export const completeRegistration = async (
  data: CompleteRegistrationRequest,
) => {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || "Registration failed");
    }

    return await response.json();
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
};

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    console.log({ response });
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || "Registration failed");
    }

    return await response.json();
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
};

export const sendForgotPasswordCode = async (identifier: string) => {
  try {
    const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ identifier }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || "Failed to send verification code");
    }

    return await response.json();
  } catch (error) {
    console.error("Send forgot password code error:", error);
    throw error;
  }
};

export const verifyForgotPasswordCode = async (identifier: string, code: string) => {
  try {
    const response = await fetch(`${API_URL}/api/auth/verify-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ identifier, code }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || "OTP verification failed");
    }

    return await response.json(); // Expected response: { token: string, user: UserProfile }
  } catch (error) {
    console.error("Verify OTP error:", error);
    throw error;
  }
};

export const resetPassword = async (
  identifier: string,
  code: string,
  newPassword: string
) => {
  try {
    const response = await fetch(`${API_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ identifier, code, newPassword }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || "Password reset failed");
    }

    return await response.json();
  } catch (error) {
    console.error("Reset password error:", error);
    throw error;
  }
};

