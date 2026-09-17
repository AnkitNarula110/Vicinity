// src/ble/manager.ts
// ------------------
// Singleton BleManager.
//
// Behaviour:
//   - One BleManager per app process. On iOS, creating more than one
//     throws a native error ("Bluetooth manager already created").
//   - `getManager()` lazily creates the manager on first call and returns
//     the cached instance on subsequent calls.
//   - `destroyManager()` releases the native radio. Call it on logout
//     or when BLE is no longer needed.
//
// Usage:
//   import { getManager } from './manager';
//   const manager = getManager();
//   manager.startDeviceScan(...);

import { BleManager } from "react-native-ble-plx";

// Module-level variable — holds the single instance across imports.
// `let` (not `const`) because `destroyManager` resets it to null.
let manager: BleManager | null = null;

/// Returns the singleton BleManager, creating it if needed.
export function getManager(): BleManager {
  if (!manager) {
    manager = new BleManager();
  }
  return manager;
}

/// Destroys the manager and releases the native BLE radio.
/// After this, the next `getManager()` call creates a fresh instance.
export async function destroyManager(): Promise<void> {
  if (manager) {
    // `destroy()` stops scanning + advertising and detaches listeners.
    manager.destroy();
    manager = null;
  }
}
