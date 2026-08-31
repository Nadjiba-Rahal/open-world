export const CURRENT_PHASE = "multiplayer" as const;
export const PHASES = ["foundation", "world", "character", "multiplayer", "home", "gameplay", "exploration", "social", "progression", "mobile", "optimization"] as const;
export type BuildPhase = (typeof PHASES)[number];
export type WorldId = "lumenfall" | "moonwood" | "player-home" | "mystery";
export type PlayerId = string & { readonly __brand: "PlayerId" };
export interface CharacterAppearance { skinTone: string; bodyType: string; face: string; eyes: string; hair: string; hairColor: string; outfit: string; accessories: string[]; }
export type MovementState = "idle" | "walking" | "sprinting";
export interface PlayerSnapshot {
  id: PlayerId;
  displayName: string;
  worldId: WorldId;
  appearance: CharacterAppearance;
  position: { x: number; y: number; z: number };
  rotation: { y: number };
  movement: MovementState;
  connected: boolean;
}
export interface SessionDescriptor { sessionId: string; inviteCode: string; worldId: WorldId; maxPlayers: number; inviteOnly: true; }
export type RealtimeMessage =
  | { type: "session.create"; requestId: string; displayName: string; appearance: CharacterAppearance }
  | { type: "session.join"; requestId: string; inviteCode: string; displayName: string; appearance: CharacterAppearance; reconnectToken?: string }
  | { type: "session.leave"; requestId: string }
  | { type: "player.update"; player: Pick<PlayerSnapshot, "position" | "rotation" | "movement"> }
  | { type: "session.created"; requestId: string; session: SessionDescriptor; self: PlayerSnapshot; players: PlayerSnapshot[]; reconnectToken: string }
  | { type: "session.joined"; requestId: string; session: SessionDescriptor; self: PlayerSnapshot; players: PlayerSnapshot[]; reconnectToken: string }
  | { type: "player.joined"; player: PlayerSnapshot }
  | { type: "player.updated"; player: PlayerSnapshot }
  | { type: "player.left"; playerId: PlayerId; reason: "left" | "disconnected" }
  | { type: "session.error"; requestId?: string; code: "invalid" | "not_found" | "full" | "not_member"; message: string };

export const CHARACTER_OPTIONS = {
  skinTone: [
    { id: "porcelain", label: "Porcelain", color: "#f3d3bf" },
    { id: "sand", label: "Sand", color: "#e5b998" },
    { id: "honey", label: "Honey", color: "#c98b64" },
    { id: "amber", label: "Amber", color: "#ad6d4d" },
    { id: "copper", label: "Copper", color: "#8e513d" },
    { id: "sienna", label: "Sienna", color: "#713f34" },
    { id: "umber", label: "Umber", color: "#4f2e29" },
    { id: "ebony", label: "Ebony", color: "#2d1e21" }
  ],
  bodyType: [
    { id: "willow", label: "Willow", scale: [0.88, 1.06, 0.88] },
    { id: "meadow", label: "Meadow", scale: [1, 1, 1] },
    { id: "oak", label: "Oak", scale: [1.12, 0.98, 1.12] }
  ],
  face: [
    { id: "soft", label: "Soft" },
    { id: "bright", label: "Bright" },
    { id: "curious", label: "Curious" },
    { id: "serene", label: "Serene" },
    { id: "bold", label: "Bold" }
  ],
  eyes: [
    { id: "lake", label: "Lake", color: "#6e9f9a" },
    { id: "moss", label: "Moss", color: "#78935d" },
    { id: "honey", label: "Honey", color: "#c89955" },
    { id: "night", label: "Night", color: "#3f4e70" },
    { id: "violet", label: "Violet", color: "#8c729d" }
  ],
  hair: [
    { id: "cropped", label: "Cropped" },
    { id: "bob", label: "Bob" },
    { id: "braids", label: "Braids" },
    { id: "waves", label: "Waves" },
    { id: "long", label: "Long" },
    { id: "topknot", label: "Topknot" },
    { id: "curl", label: "Curl" },
    { id: "shaved", label: "Shaved" }
  ],
  hairColor: [
    { id: "ink", label: "Ink", color: "#211b1f" },
    { id: "chestnut", label: "Chestnut", color: "#604033" },
    { id: "copper", label: "Copper", color: "#a55d3d" },
    { id: "wheat", label: "Wheat", color: "#c7a66c" },
    { id: "moss", label: "Moss", color: "#556348" },
    { id: "silver", label: "Silver", color: "#a8aca3" },
    { id: "plum", label: "Plum", color: "#694a68" },
    { id: "blue", label: "Blue", color: "#4d7184" }
  ],
  outfit: [
    { id: "fern-traveler", label: "Fern Traveler", color: "#355247" },
    { id: "clay-weaver", label: "Clay Weaver", color: "#8a5344" },
    { id: "moon-scribe", label: "Moon Scribe", color: "#4e5873" },
    { id: "sun-gardener", label: "Sun Gardener", color: "#ad824b" },
    { id: "river-runner", label: "River Runner", color: "#477b7a" },
    { id: "moss-keeper", label: "Moss Keeper", color: "#64724f" },
    { id: "rose-apothecary", label: "Rose Apothecary", color: "#8d5d68" },
    { id: "ash-cartographer", label: "Ash Cartographer", color: "#5a6262" },
    { id: "dawn-cook", label: "Dawn Cook", color: "#b36f4f" },
    { id: "star-shepherd", label: "Star Shepherd", color: "#464b6b" }
  ],
  accessories: [
    { id: "none", label: "None", color: "#000000" },
    { id: "leaf-pin", label: "Leaf pin", color: "#8aab6b" },
    { id: "sun-charm", label: "Sun charm", color: "#d1b56b" },
    { id: "blue-ribbon", label: "Blue ribbon", color: "#6d9ba1" },
    { id: "travel-scarf", label: "Travel scarf", color: "#9b6253" },
    { id: "lantern-brooch", label: "Lantern brooch", color: "#e1b96f" },
    { id: "mushroom-cap", label: "Mushroom cap", color: "#a85d53" },
    { id: "feather", label: "Feather", color: "#b3c7b0" },
    { id: "shell-necklace", label: "Shell necklace", color: "#d5c6a6" },
    { id: "moon-earring", label: "Moon earring", color: "#a29cc7" },
    { id: "copper-cuff", label: "Copper cuff", color: "#b2764f" }
  ]
} as const;

export function createDefaultAppearance(): CharacterAppearance {
  return {
    skinTone: "honey",
    bodyType: "meadow",
    face: "soft",
    eyes: "lake",
    hair: "waves",
    hairColor: "chestnut",
    outfit: "fern-traveler",
    accessories: ["leaf-pin"]
  };
}
