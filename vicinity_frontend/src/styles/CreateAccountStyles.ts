import { StyleSheet } from "react-native";
import { V } from "../theme/colors";

export const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#09090F",
    paddingHorizontal: 24,
    paddingTop: 52,
    paddingBottom: 36,
    justifyContent: "space-between",
  },
  glow: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    opacity: 0.06,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: 24,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  sub: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 13,
    marginTop: 8,
    fontWeight: "300",
    lineHeight: 20,
  },
  errText: {
    color: "#FF6B6B",
    fontSize: 11,
    fontWeight: "500",
    marginTop: -6,
    marginBottom: 8,
    marginLeft: 2,
  },
  terms: {
    color: "rgba(255,255,255,0.22)",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 17,
  },
  primaryBtn: {
    height: 54,
    borderRadius: 27,
    backgroundColor: V.coral,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: V.coral,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  loginLink: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 13,
  },
  footer: {},
});

export const inp = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 52,
  },
  icon: {
    marginRight: 12,
  },
  text: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
    height: "100%",
    outlineStyle: "none",
  } as any,
  eye: {
    padding: 4,
  },
});

export const mk = StyleSheet.create({
  container: {
    width: 80,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  glow: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: V.coral,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    position: "absolute",
  },
  left: {
    backgroundColor: "#F5F0E8",
  },
  right: {
    backgroundColor: V.coral,
  },
});
