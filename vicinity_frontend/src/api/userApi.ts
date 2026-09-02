import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config/api";
import axios, { AxiosError } from "axios";

export const getUserById = async () => {
  try {
    // Get user ID from AsyncStorage
    const userId = await AsyncStorage.getItem("userId");

    if (!userId) {
      return {
        success: false,
        message: "User ID not found in storage",
        user_data: null,
      };
    }

    // Make API call
    const response = await axios.get(
      `${API_URL}/api/user/getuserbyid/${userId}`,
    );

    return response.data; // { base_response: { success, message }, user_data: {...} }
  } catch (error) {
    console.error("Error fetching user:", error);

    // Type guard to check if error is an AxiosError
    if (axios.isAxiosError(error)) {
      // Server responded with error
      if (error.response) {
        return {
          base_response: {
            success: false,
            message: error.response.data?.message || "Server error occurred",
          },
          user_data: null,
        };
      }
      // Request was made but no response
      else if (error.request) {
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
};
