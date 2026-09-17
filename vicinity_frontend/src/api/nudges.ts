// src/api/nudges.ts
// -----------------
import { API_URL } from "../config/api";
import type { Nudge } from "../types";

export const sendNudge = async (
  fromUserId: string,
  toUserId: string,
): Promise<Nudge> => {
  const response = await fetch(`${API_URL}/nudges`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from_user_id: fromUserId, to_user_id: toUserId }),
  });
  if (!response.ok) throw new Error((await response.text()) || "Nudge failed");
  const data = await response.json();
  return data.nudge;
};

export const listNudges = async (userId: string): Promise<Nudge[]> => {
  const response = await fetch(
    `${API_URL}/nudges?user_id=${encodeURIComponent(userId)}`,
  );
  if (!response.ok) throw new Error((await response.text()) || "Nudges failed");
  const data = await response.json();
  return data.nudges ?? [];
};

export const cancelNudge = async (
  userId: string,
  id: string,
): Promise<void> => {
  const response = await fetch(`${API_URL}/nudges/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId }),
  });
  if (!response.ok) throw new Error((await response.text()) || "Cancel failed");
};
