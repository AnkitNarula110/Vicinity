// All BLE identifiers and timings in one place.
//
// Behaviour:
//   - VICINITY_SERVICE_UUID is the custom 128-bit service UUID that
//     every Vicinity peer advertises and filters on. Must match on
//     both sides or devices won't see each other.
//   - VICINITY_MANUFACTURER_ID goes in the manufacturerData field
//     (2 bytes) so the scanner knows the packet is ours.
//   - Timing constants mirror the backend spec.

export const VICINITY_SERVICE_UUID = "8f0a1c00-9e3f-4c1a-8a4f-5f2e0a6c1b01";

// Manufacturer ID for our BLE packets. 0xFFFF is "reserved for testing" —
// replace with a real Bluetooth SIG ID before shipping to app stores.
export const VICINITY_MANUFACTURER_ID = 0xffff;

// Backend gate: anything weaker than this is dropped client-side too.
// -80 dBm ≈ 10 m in open space.
export const RSSI_THRESHOLD_DBM = -80;

// Refresh the BLE token every 13 minutes. Backend TTL is 17 min,
// leaving a 2-minute overlap window for in-flight detections.
export const TOKEN_REFRESH_MS = 13 * 60 * 1000;

// Flush batched detections to the backend every 30 s.
export const DETECTION_BATCH_MS = 30 * 1000;

// Heartbeat presence every 30 s so the venue set stays fresh.
export const HEARTBEAT_MS = 30 * 1000;

// Same token seen within 5 s → just update timestamp, don't add a new entry.
export const DEDUP_WINDOW_MS = 5 * 1000;
