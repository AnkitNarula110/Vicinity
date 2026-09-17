import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config/api";
import type { Detection, TokenResponse } from "../types";

export const fetchBleToken = async (userId: string): Promise<TokenResponse> => {
  const response = await fetch(`${API_URL}/ble/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId }),
  });

  if (!response.ok) {
    throw new Error((await response.text()) || "Token fetch failed");
  }
  return response.json();
};

export const reportDetections = async (payload: {
  scanner_user_id: string;
  detections: Detection[];
  venue_hint: { lat: number; lng: number };
}): Promise<void> => {
  const response = await fetch(`${API_URL}/ble/detections`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error((await response.text()) || "Detections failed");
  }
};

export const sendHeartbeat = async (body: {
  user_id: string;
  venue_hint: { lat: number; lng: number };
}): Promise<void> => {
  const response = await fetch(`${API_URL}/ble/heartbeat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error((await response.text()) || "Heartbeat failed");
  }
};
