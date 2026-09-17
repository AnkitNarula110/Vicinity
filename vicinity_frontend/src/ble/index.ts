// src/ble/index.ts
// ----------------
import { ensureBlePermissions } from "./permissions";
import { bootstrapToken, stopRotation } from "./tokenRotation";
import { startScanning, stopScanning } from "./scanner";
import { stopAdvertising } from "./advertiser";

export async function startBle(userId: string) {
  const ok = await ensureBlePermissions();
  if (!ok) throw new Error("BLE permissions denied");
  await bootstrapToken(userId);
  startScanning(userId);
}

export async function stopBle() {
  stopScanning();
  stopRotation();
  await stopAdvertising();
}
