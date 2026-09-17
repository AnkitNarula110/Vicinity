// src/ble/permissions.ts
// ----------------------
// Requests every permission Vicinity needs for background BLE.
//
// Platform differences:
//   - iOS: Bluetooth is prompted implicitly by BleManager on first use.
//     We only need to request location (foreground + background).
//   - Android 12+ (API 31+): three runtime BT permissions required.
//   - Android <12: only ACCESS_FINE_LOCATION is runtime; BT is install-time.
//
// Returns `true` only if every required permission is granted.
// Callers should gate the app on this — Vicinity can't function without it.

import { Platform, PermissionsAndroid } from "react-native";
import * as Location from "expo-location";

export async function ensureBlePermissions(): Promise<boolean> {
  if (Platform.OS === "android") {
    const api = Platform.Version as number;

    if (api >= 31) {
      // Android 12+ — request the three BLE permissions together.
      const bt = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);
      const allBt =
        bt[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === "granted" &&
        bt[PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE] === "granted" &&
        bt[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === "granted";
      if (!allBt) return false;
    } else {
      // Android 11 and below — fine location is required for BLE scanning.
      const fine = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      if (fine !== "granted") return false;
    }

    // Background location is needed for venue_hint while backgrounded.
    const bg = await Location.requestBackgroundPermissionsAsync();
    return bg.status === "granted";
  }

  if (Platform.OS === "ios") {
    // Foreground location first (the OS shows the "While Using" prompt).
    const fg = await Location.requestForegroundPermissionsAsync();
    if (fg.status !== "granted") return false;

    // Then background — iOS shows the "Always" upgrade prompt.
    const bg = await Location.requestBackgroundPermissionsAsync();
    return bg.status === "granted";
  }

  // Web or unknown platform — BLE isn't supported.
  return false;
}
