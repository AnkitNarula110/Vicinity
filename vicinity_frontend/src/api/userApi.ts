import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config/api";
import axios, { AxiosError } from "axios";
import { GetUserByIdResponse } from "../types";
import { api } from "./client";
export function getUserById(): Promise<GetUserByIdResponse>;
export function getUserById(userId: string): Promise<GetUserByIdResponse>;

// Actual implementation
export async function getUserById(
  userId?: string,
): Promise<GetUserByIdResponse> {
  try {
    // Use the provided userId.
    // If it is not provided, get it from AsyncStorage.
    const id = userId ?? (await AsyncStorage.getItem("userId"));

    if (!id) {
      return {
        base_response: {
          success: false,
          message: "User ID not found in storage",
        },
        user_data: null,
      };
    }

    // Make API call
    const response = await axios.get<GetUserByIdResponse>(
      `${API_URL}/user/getuserbyid/${id}`,
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching user:", error);

    // Check if error is an AxiosError
    if (axios.isAxiosError(error)) {
      // Server responded with an error
      if (error.response) {
        return {
          base_response: {
            success: false,
            message: error.response.data?.message || "Server error occurred",
          },
          user_data: null,
        };
      }

      // Request was made but no response was received
      if (error.request) {
        return {
          base_response: {
            success: false,
            message: "Network error - Could not connect to server",
          },
          user_data: null,
        };
      }
    }

    // Handle non-Axios errors or unexpected errors
    return {
      base_response: {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      },
      user_data: null,
    };
  }
}

export async function updateProfile(payload: {
  userid: string;
  onboarding_data: any;
}): Promise<{ success: boolean; userid: string }> {
  const res = await fetch(`${API_URL}/profile/update`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Update failed: ${txt}`);
  }
  return res.json();
}
