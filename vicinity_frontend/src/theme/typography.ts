// src/theme/typography.ts
// -----------------------
// Pre-composed text styles.
//
// Each entry bundles fontFamily + fontSize + lineHeight + colour so
// screens don't repeat them. Spread into StyleSheet:
//
//   import { typography } from '../theme/typography';
//   <Text style={typography.h1}>Nearby</Text>
//
// For one-off overrides, spread first then add:
//   <Text style={[typography.body, { color: V.textSecondary }]}>...</Text>

import { V } from "./colors";
import { F } from "./fonts";

export const typography = {
  // ── Headlines (serif) ────────────────────────────────────────────
  h1: {
    fontFamily: F.serif,
    fontSize: 40,
    lineHeight: 46,
    color: V.textPrimary,
  },
  h2: {
    fontFamily: F.serif,
    fontSize: 28,
    lineHeight: 34,
    color: V.textPrimary,
  },
  h3: {
    fontFamily: F.serif,
    fontSize: 22,
    lineHeight: 28,
    color: V.textPrimary,
  },

  // ── Body (Inter) ─────────────────────────────────────────────────
  body: {
    fontFamily: F.regular,
    fontSize: 16,
    lineHeight: 22,
    color: V.textPrimary,
  },
  bodyMedium: {
    fontFamily: F.medium,
    fontSize: 16,
    lineHeight: 22,
    color: V.textPrimary,
  },

  // ── Supporting text ──────────────────────────────────────────────
  label: {
    fontFamily: F.medium,
    fontSize: 14,
    lineHeight: 18,
    color: V.textSecondary,
  },
  caption: {
    fontFamily: F.regular,
    fontSize: 12,
    lineHeight: 16,
    color: V.textMuted,
  },

  // ── Buttons ──────────────────────────────────────────────────────
  button: {
    fontFamily: F.semibold,
    fontSize: 16,
    color: V.textPrimary,
  },
};
