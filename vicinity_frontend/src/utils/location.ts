import * as Location from "expo-location";

let last: { lat: number; lng: number } | null = null;
let lastAt = 0;

export async function currentVenueHint(): Promise<{
  lat: number;
  lng: number;
}> {
  const now = Date.now();
  if (last && now - lastAt < 2 * 60 * 1000) return last;

  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  last = {
    lat: Math.round(pos.coords.latitude * 1000) / 1000,
    lng: Math.round(pos.coords.longitude * 1000) / 1000,
  };
  lastAt = now;
  return last;
}
