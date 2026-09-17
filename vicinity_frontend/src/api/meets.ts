// src/api/meets.ts
// ----------------
import { API_URL } from "../config/api";
import type { Meet } from "../types";

export const confirmMeet = async (
  userId: string,
  nudge_id: string,
): Promise<Meet> => {
  const response = await fetch(`${API_URL}/meets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, nudge_id }),
  });
  if (!response.ok) throw new Error((await response.text()) || "Meet failed");
  const data = await response.json();
  return data.meet;
};

export const getMeet = async (id: string): Promise<Meet> => {
  const response = await fetch(`${API_URL}/meets/${id}`);
  if (!response.ok)
    throw new Error((await response.text()) || "Meet fetch failed");
  const data = await response.json();
  return data.meet;
};

export const triggerSafeWord = async (
  id: string,
  userId: string,
  note?: string,
): Promise<void> => {
  const response = await fetch(`${API_URL}/meets/${id}/safe-word`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, note }),
  });
  if (!response.ok)
    throw new Error((await response.text()) || "Safe word failed");
};
