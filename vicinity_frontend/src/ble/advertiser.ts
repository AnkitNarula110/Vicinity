// src/ble/advertiser.ts
// ---------------------
// BLE advertising using react-native-peripheral.
//
// IMPORTANT: react-native-ble-plx does NOT support advertising.
// It only handles the central (scanning) role. Advertising requires
// react-native-peripheral, which is a separate library.

import Peripheral, { Service, Characteristic } from "react-native-peripheral";
import { VICINITY_SERVICE_UUID } from "./constants";
import { Buffer } from "buffer";

let advertising = false;
let currentToken: string | null = null;

/// Convert a token string to base64 (required by react-native-peripheral).
function tokenToBase64(token: string): string {
  return Buffer.from(token, "utf8").toString("base64");
}

/// Start advertising the token as a characteristic on our service UUID.
export async function startAdvertising(token: string): Promise<void> {
  // Stop any existing advertising first — Peripheral is a singleton.
  if (advertising) {
    try {
      await Peripheral.stopAdvertising();
    } catch {
      /* ignore */
    }
    advertising = false;
  }

  currentToken = token;
  const base64 = tokenToBase64(token);

  // Define a characteristic that carries the token value.
  const characteristic = new Characteristic({
    uuid: "00000001-0000-1000-8000-00805F9B34FB",
    value: base64,
    properties: ["read"],
    permissions: ["readable"],
  });

  // Define a service that groups the characteristic.
  const service = new Service({
    uuid: VICINITY_SERVICE_UUID,
    characteristics: [characteristic],
  });

  // Register the service with the OS.
  await Peripheral.addService(service);

  // Start advertising — peers will see our service UUID.
  await Peripheral.startAdvertising({
    name: "Vicinity",
    serviceUuids: [VICINITY_SERVICE_UUID],
  });

  advertising = true;
  console.log("[BLE] advertising with token", token);
}

/// Stop advertising and remove the service.
export async function stopAdvertising(): Promise<void> {
  if (!advertising) return;
  try {
    await Peripheral.stopAdvertising();
    // Remove the service so it doesn't linger in the OS BLE cache.
    await Peripheral.removeAllServices();
  } finally {
    advertising = false;
    currentToken = null;
  }
}
