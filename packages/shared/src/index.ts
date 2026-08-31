export const CURRENT_PHASE = "foundation" as const;
export const PHASES = ["foundation", "world", "character", "multiplayer", "home", "gameplay", "exploration", "social", "progression", "mobile", "optimization"] as const;
export type BuildPhase = (typeof PHASES)[number];
export type WorldId = "lumenfall" | "moonwood" | "player-home" | "mystery";
export type PlayerId = string & { readonly __brand: "PlayerId" };
export interface CharacterAppearance { skinTone: string; bodyType: string; face: string; eyes: string; hair: string; hairColor: string; outfit: string; accessories: string[]; }
export interface PlayerSnapshot { id: PlayerId; displayName: string; worldId: WorldId; position: { x: number; y: number; z: number }; rotation: { y: number }; }
export type RealtimeMessage =
  | { type: "session.create"; requestId: string }
  | { type: "session.join"; requestId: string; sessionId: string }
  | { type: "session.leave"; requestId: string; sessionId: string }
  | { type: "player.snapshot"; player: PlayerSnapshot }
  | { type: "player.emote"; playerId: PlayerId; emote: string };
