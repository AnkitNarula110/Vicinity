export interface UserProfile {
  name: string;
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
