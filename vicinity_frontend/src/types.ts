export type UUID = string;

export interface UserProfile {
  full_name: string;
  dateOfBirth: string;
  college: string;
  playlist: string;
  artist: string;
  movie: string;
  spots: string;
  smoker: boolean;
  drinker: boolean;
  favColor: string;
  photoUri: string | null;
  intent: string;
  intentIndex: number;
  vibes: string[];
  mood: string;
  moodIndex: number;
  promptRaw: string;
  promptIndex: number;
  colorIndex: number;
  prompt: string;
  distance: number;
  direction: number;
  matchPercent: number;
  picsUnlocked: boolean;
}

export interface Person {
  id: string;
  name: string;
  age: string;
  college: string;
  distance: number;
  matchPercent: number;
  favColor: string;
  mood: string;
  vibes: string[];
  prompt: string;
  playlist: string;
  artist: string;
  movie: string;
  spots: string;
  smoker: boolean;
  drinker: boolean;
  direction: number;
  picsUnlocked: boolean;
}

export interface Match {
  id: string;
  name: string;
  age: string;
  distance: number;
  favColor: string;
  lastMsg: string;
  time: string;
  unread: number;
  isOnline: boolean;
}

export interface OnboardingData {
  full_name: string;
  college: string;
  intent: string;
  intent_index: number;
  color_index: number;
  vibe_tags: string[];
  playlist: string;
  artist: string;
  movie: string;
  spots: string;
  is_smoker: boolean;
  is_drinker: boolean;
  mood: string;
  mood_index: number;
  prompt_raw: string;
  prompt_index: number;
  prompt: string;
  profile_picture: string | null;
}

export interface CompleteRegistrationRequest {
  username: string;
  email: string;
  password: string;
  phone: string;
  dob: string | null;
  aadharnumber: string | null;
  address: string | null;
  onboarding_data: OnboardingData;
}

export interface LoginRequest {
  login: string;
  password: string;
}

export interface LoginResponse {
  base_response: BaseResponse;
  user_data: UserData;
}

interface BaseResponse {
  success: boolean;
  message: String;
}

export interface UserData {
  userid: string;
  username: string;
  email: string;
  dob: Date | null;
  password: string;
  aadharnumber: string | null;
  address: string | null;
  isactive: boolean;
  createddate: Date;
  phone: string;
  onboarding_data: Record<string, any>;
  completed_onboarding: boolean;
}

export interface GetUserByIdRes {
  base_response: BaseResponse;
  user_data: UserData | null;
}

export interface NearbyUser {
  id: UUID;
  display_name: string;
  avatar_url: string | null;
  interest_tags: string[];
  distance_label: "here" | "close" | "near";
  match_score: number;
}

export interface TokenResponse {
  token: string;
  expires_in: number;
}

export interface Detection {
  token: string;
  rssi: number;
  timestamp: number;
}

export type NudgeStatus =
  | "pending"
  | "mutual"
  | "declined"
  | "expired"
  | "notified";

export interface Nudge {
  id: UUID;
  from_user_id: UUID | null;
  to_user_id: UUID | null;
  status: NudgeStatus;
  created_at: string;
  updated_at: string;
}

export interface Meet {
  id: UUID;
  user_a_id: UUID;
  user_b_id: UUID;
  nudge_id: UUID;
  confirmed_at: string | null;
  location_expires_at: string | null;
  location?: { lat: number; lng: number; landmark: string };
}

export interface CompleteRegistrationResponse {
  userid: UUID;
  message: string;
  onboarding_complete: boolean;
}
