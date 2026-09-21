import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { V } from "../theme/colors";
import { F } from "../theme/fonts";
import { spacing } from "../theme/spacing";
import { radius } from "../theme/radius";

export const NudgeWaitingScreen: React.FC = () => {
  const nav = useNavigation<any>();
  const route = useRoute<any>();

  return (
    <View style={styles.flex}>
      <Text style={styles.title}>Nudge sent</Text>
      <Text style={styles.body}>
        If they nudge back, you'll both see each other's photos and can confirm
        a meet.
      </Text>

      <View style={styles.locks}>
        <View style={styles.lock}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.lockLabel}>Location hidden</Text>
        </View>
        <View style={styles.lock}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.lockLabel}>Extra photos locked</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.cta} onPress={() => nav.goBack()}>
        <Text style={styles.ctaText}>Back to nearby</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: V.bg,
    padding: spacing(6),
    justifyContent: "center",
  },
  title: {
    fontFamily: F.serif,
    fontSize: 36,
    color: V.textPrimary,
    textAlign: "center",
  },
  body: {
    fontFamily: F.regular,
    fontSize: 16,
    lineHeight: 24,
    color: V.textSecondary,
    textAlign: "center",
    marginTop: spacing(4),
    marginBottom: spacing(8),
  },
  locks: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: spacing(8),
  },
  lock: { alignItems: "center" },
  lockIcon: { fontSize: 32, marginBottom: spacing(2) },
  lockLabel: { fontFamily: F.medium, fontSize: 13, color: V.textMuted },
  cta: {
    backgroundColor: V.coral,
    borderRadius: radius.lg,
    paddingVertical: spacing(4),
    alignItems: "center",
  },
  ctaText: { fontFamily: F.semibold, fontSize: 16, color: V.textPrimary },
});
