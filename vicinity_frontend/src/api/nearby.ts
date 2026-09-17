import { API_URL } from "../config/api";
import type { NearbyUser, Nudge } from "../types";

export const getNearby = async (userId: string): Promise<NearbyUser[]> => {
  const response = await fetch(
    `${API_URL}/nearby?user_id=${encodeURIComponent(userId)}`,
  );
  if (!response.ok) throw new Error((await response.text()) || "Nearby failed");
  const data = await response.json();
  return data.users ?? [];
};

export const getMatches = async (userId: string): Promise<Nudge[]> => {
  const response = await fetch(
    `${API_URL}/matches?user_id=${encodeURIComponent(userId)}`,
  );
  if (!response.ok)
    throw new Error((await response.text()) || "Matches failed");
  const data = await response.json();
  return data.matches ?? [];
};
