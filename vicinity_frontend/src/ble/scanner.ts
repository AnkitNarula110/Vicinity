// src/ble/scanner.ts
// ------------------
// BLE scanning. Uses react-native-ble-plx (central role).
//
// Behaviour:
//   - Filters by VICINITY_SERVICE_UUID so we ignore other BLE traffic.
//   - For each packet: parse manufacturerData → token, drop weak RSSI.
//   - Dedupes: same token within 5 s only updates the timestamp.
//   - Every 30 s: flushes batch to POST /ble/detections.
//   - Every 30 s: sends POST /ble/heartbeat.

import { Device } from "react-native-ble-plx";
import { getManager } from "./manager";
import {
  VICINITY_SERVICE_UUID,
  VICINITY_MANUFACTURER_ID,
  RSSI_THRESHOLD_DBM,
  DEDUP_WINDOW_MS,
  DETECTION_BATCH_MS,
  HEARTBEAT_MS,
} from "./constants";
import { reportDetections, sendHeartbeat } from "../api/ble";
import { currentVenueHint } from "../utils/location";
import type { Detection } from "../types";

// In-memory buffer: token → latest detection.
const buffer = new Map<string, Detection>();

// Timers. Null when not scanning.
let batchTimer: ReturnType<typeof setInterval> | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

// Track the userId so we can include it in detections + heartbeats.
let scannerUserId: string | null = null;

// Module-level flag so stopScanning() is idempotent.
let scanning = false;

/// Base64 → hex, without a Node Buffer polyfill.
function base64ToHex(b64: string): string {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let hex = "";
  let bits = 0;
  let value = 0;

  for (let i = 0; i < b64.length; i++) {
    const c = b64[i];
    if (c === "=") break;
    const idx = alphabet.indexOf(c);
    if (idx === -1) continue;

    value = (value << 6) | idx;
    bits += 6;

    if (bits >= 8) {
      bits -= 8;
      hex += ((value >> bits) & 0xff).toString(16).padStart(2, "0");
    }
  }

  return hex;
}

/// Decode manufacturerData → token string, or null if not ours.
function parseToken(manufacturerData: string | null): string | null {
  if (!manufacturerData) return null;

  const hex = /^[0-9a-fA-F]+$/.test(manufacturerData)
    ? manufacturerData
    : base64ToHex(manufacturerData);

  // 2 bytes id + 36 bytes uuid string = 76 hex chars.
  if (hex.length < 4 + 72) return null;

  const idHex = hex.slice(0, 4);
  if (parseInt(idHex, 16) !== VICINITY_MANUFACTURER_ID) return null;

  const tokenHex = hex.slice(4, 4 + 72);
  let token = "";
  for (let i = 0; i < tokenHex.length; i += 2) {
    token += String.fromCharCode(parseInt(tokenHex.substr(i, 2), 16));
  }
  return token;
}

function onDevice(device: Device) {
  if ((device.rssi ?? -999) < RSSI_THRESHOLD_DBM) return;

  const token = parseToken(device.manufacturerData ?? null);
  if (!token) return;

  const now = Date.now();
  const existing = buffer.get(token);
  if (existing && now - existing.timestamp * 1000 < DEDUP_WINDOW_MS) {
    existing.timestamp = Math.floor(now / 1000);
    return;
  }

  buffer.set(token, {
    token,
    rssi: device.rssi ?? -100,
    timestamp: Math.floor(now / 1000),
  });
}

async function flushBatch() {
  if (buffer.size === 0 || !scannerUserId) return;

  const detections = Array.from(buffer.values());
  buffer.clear();

  try {
    const venue_hint = await currentVenueHint();
    await reportDetections({
      scanner_user_id: scannerUserId,
      detections,
      venue_hint,
    });
  } catch (err) {
    // Re-queue on failure so we don't lose data.
    detections.forEach((d) => buffer.set(d.token, d));
    console.warn("[BLE] flush failed", err);
  }
}

async function heartbeatTick() {
  if (!scannerUserId) return;
  try {
    const venue_hint = await currentVenueHint();
    await sendHeartbeat({ user_id: scannerUserId, venue_hint });
  } catch (err) {
    console.warn("[BLE] heartbeat failed", err);
  }
}

/// Start scanning. Call once after login.
/// `startDeviceScan` is async — it resolves when scanning has begun,
/// and does NOT return a Subscription. To stop, call `stopDeviceScan`.
export function startScanning(userId: string) {
  if (scanning) {
    console.warn("[BLE] already scanning — ignoring startScanning");
    return;
  }

  scannerUserId = userId;
  const manager = getManager();

  // Fire-and-forget: we don't await this. Errors surface in the callback.
  manager.startDeviceScan(
    [VICINITY_SERVICE_UUID],
    { allowDuplicates: true },
    (error, device) => {
      if (error) {
        console.warn("[BLE] scan error", error);
        return;
      }
      if (device) onDevice(device);
    },
  );

  batchTimer = setInterval(flushBatch, DETECTION_BATCH_MS);
  heartbeatTimer = setInterval(heartbeatTick, HEARTBEAT_MS);
  scanning = true;
}

/// Stop scanning, clear timers, and drop buffered detections.
/// `stopDeviceScan()` returns `Promise<void>` — we await it.
export async function stopScanning(): Promise<void> {
  if (!scanning) return;

  if (batchTimer) clearInterval(batchTimer);
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  batchTimer = null;
  heartbeatTimer = null;

  buffer.clear();
  scannerUserId = null;
  scanning = false;

  try {
    await getManager().stopDeviceScan();
  } catch (err) {
    console.warn("[BLE] stopDeviceScan failed", err);
  }
}
