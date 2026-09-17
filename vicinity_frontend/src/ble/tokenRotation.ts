import { fetchBleToken } from "../api/ble";
import { startAdvertising, stopAdvertising } from "./advertiser";
import { TOKEN_REFRESH_MS } from "./constants";

let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let currentUserId: string | null = null;

export async function bootstrapToken(userId: string): Promise<string> {
  currentUserId = userId;
  const { token } = await fetchBleToken(userId);
  await startAdvertising(token);
  scheduleRefresh();
  return token;
}

function scheduleRefresh() {
  if (refreshTimer) clearTimeout(refreshTimer);
  refreshTimer = setTimeout(async () => {
    if (!currentUserId) return;
    try {
      const { token } = await fetchBleToken(currentUserId);
      await stopAdvertising();
      await startAdvertising(token);
    } catch (err) {
      console.warn("[BLE] token refresh failed", err);
    } finally {
      scheduleRefresh();
    }
  }, TOKEN_REFRESH_MS);
}

export function stopRotation() {
  if (refreshTimer) clearTimeout(refreshTimer);
  refreshTimer = null;
  currentUserId = null;
}
