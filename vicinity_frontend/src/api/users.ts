// src/api/users.ts
// ----------------
// user_id travels in the body or query — no header.

import { API_URL } from "../config/api";
import type { UserProfile, UserData } from "../types";

interface GetMeResponse {
  base_response: { success: boolean; message: string };
  user_data: UserData | null;
  interests?: { tag: string; weight: number }[];
}

export const getMe = async (userId: string): Promise<GetMeResponse> => {
  const response = await fetch(
    `${API_URL}/users/me?user_id=${encodeURIComponent(userId)}`,
  );
  if (!response.ok)
    throw new Error((await response.text()) || "Profile fetch failed");
  return response.json();
};

export const patchMe = async (
  userId: string,
  patch: { bio?: string; display_name?: string },
): Promise<UserProfile> => {
  const response = await fetch(`${API_URL}/users/me`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, ...patch }),
  });
  if (!response.ok)
    throw new Error((await response.text()) || "Profile update failed");
  const data = await response.json();
  return data.user;
};

export const putInterests = async (
  userId: string,
  interests: { tag: string; weight: number }[],
): Promise<void> => {
  const response = await fetch(`${API_URL}/users/me/interests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, interests }),
  });
  if (!response.ok)
    throw new Error((await response.text()) || "Interests failed");
};

export const getPublicProfile = async (id: string): Promise<UserProfile> => {
  const response = await fetch(`${API_URL}/users/${id}/profile`);
  if (!response.ok)
    throw new Error((await response.text()) || "Profile fetch failed");
  const data = await response.json();
  return data.user;
};

export const getPhotos = async (
  id: string,
): Promise<{ id: string; url: string; position: number }[]> => {
  const response = await fetch(`${API_URL}/users/${id}/photos`);
  if (!response.ok) throw new Error((await response.text()) || "Photos failed");
  const data = await response.json();
  return data.photos ?? [];
};

export const uploadPhoto = async (
  userId: string,
  file: { uri: string; type: string; name: string },
  position: number,
): Promise<void> => {
  const form = new FormData();
  form.append("user_id", userId);
  form.append("position", String(position));
  form.append("file", file as any);

  const response = await fetch(`${API_URL}/users/me/photos`, {
    method: "POST",
    // Do NOT set Content-Type — fetch sets the multipart boundary.
    body: form,
  });
  if (!response.ok) throw new Error((await response.text()) || "Upload failed");
};
