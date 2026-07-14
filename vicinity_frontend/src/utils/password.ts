import { V } from "../theme/colors";

export interface PasswordStrength {
  score: number; // 0 to 4
  label: "Too Short" | "Weak" | "Fair" | "Good" | "Strong";
  color: string;
  criteria: {
    length: boolean;
    uppercase: boolean;
    numberOrSymbol: boolean;
  };
}

export const checkPasswordStrength = (password: string): PasswordStrength => {
  const criteria = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password) && /[a-z]/.test(password),
    numberOrSymbol: /[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password),
  };

  if (!password) {
    return {
      score: 0,
      label: "Too Short",
      color: "#FF6B6B",
      criteria,
    };
  }

  if (password.length < 6) {
    return {
      score: 1,
      label: "Too Short",
      color: "#FF6B6B",
      criteria,
    };
  }

  let score = 1; // Base score for >= 6 chars

  if (criteria.length) score++;
  if (criteria.uppercase) score++;
  if (criteria.numberOrSymbol) score++;

  let label: PasswordStrength["label"] = "Weak";
  let color = "#FF6B6B"; // Red

  if (score === 2) {
    label = "Fair";
    color = "#F59E0B"; // Orange/Yellow
  } else if (score === 3) {
    label = "Good";
    color = "#10B981"; // Teal/Green
  } else if (score >= 4) {
    label = "Strong";
    color = "#059669"; // Emerald/Deep Green
  }

  return {
    score,
    label,
    color,
    criteria,
  };
};

export const generateStrongPassword = (): string => {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+~`|}{[]:;?><,./-=";

  const allChars = lowercase + uppercase + numbers + symbols;
  let password = "";

  // Ensure at least one character from each set is included
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Fill up the rest to 12 characters
  for (let i = 0; i < 8; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => 0.5 - Math.random())
    .join("");
};
