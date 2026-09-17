// src/theme/shadow.ts
// -------------------
// Reusable elevation styles. Two levels only — resist adding more.
//
// Usage:
//   import { shadow } from '../theme/shadow';
//   style={[styles.card, shadow.card]}

export const shadow = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  floating: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
};
