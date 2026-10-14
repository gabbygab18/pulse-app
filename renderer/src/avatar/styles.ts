// One-click looks: each sets the finish, eye style, face screen and an eye color that reads well with them.
// Shape, size and body color stay the user's.
import type { Avatar } from "./engine";

export type StylePreset = { id: string; label: string; apply: Pick<Avatar, "finish" | "eyeStyle" | "screen" | "eyeColor"> & Partial<Avatar> };

export const STYLES: StylePreset[] = [
  { id: "glossy", label: "Glossy", apply: { finish: "soft", eyeStyle: "solid", screen: false, eyeColor: "#241a2e" } },
  { id: "googly", label: "Googly", apply: { finish: "soft", eyeStyle: "googly", screen: false, eyeColor: "#0b0b12", shine: true } },
  { id: "robot", label: "Robot", apply: { finish: "soft", eyeStyle: "glow", screen: true, eyeColor: "#7ef0ff", screenColor: "#16122b" } },
  { id: "clay", label: "Clay", apply: { finish: "matte", eyeStyle: "solid", screen: false, eyeColor: "#2b2233" } },
  { id: "glass", label: "Glass", apply: { finish: "glass", eyeStyle: "googly", screen: false, eyeColor: "#0b0b12", shine: true } },
  { id: "toon", label: "Toon", apply: { finish: "toon", eyeStyle: "solid", screen: false, eyeColor: "#1a1420", shine: true } },
  { id: "neon", label: "Neon", apply: { finish: "neon", eyeStyle: "glow", screen: false, eyeColor: "#fef08a" } },
  { id: "flat", label: "Flat", apply: { finish: "flat", eyeStyle: "solid", screen: false, eyeColor: "#241a2e" } },
];

/** The preset whose look the avatar currently has, if any. */
export const activeStyle = (a: Avatar) =>
  STYLES.find((s) => s.apply.finish === a.finish && s.apply.eyeStyle === a.eyeStyle && s.apply.screen === a.screen)?.id;
