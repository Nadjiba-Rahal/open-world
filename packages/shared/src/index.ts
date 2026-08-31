export const CURRENT_PHASE = "multiplayer" as const;
export const PHASES = ["foundation", "world", "character", "multiplayer", "home", "gameplay", "exploration", "social", "progression", "mobile", "optimization"] as const;
export type BuildPhase = (typeof PHASES)[number];
export type WorldId = "lumenfall" | "moonwood" | "player-home" | "mystery" | "astral-vale";
export type PlayerId = string & { readonly __brand: "PlayerId" };
export interface CharacterAppearance { skinTone: string; bodyType: string; face: string; eyes: string; hair: string; hairColor: string; outfit: string; accessories: string[]; }
export type MovementState = "idle" | "walking" | "sprinting";
export type ItemCategory = "resource" | "food" | "tool" | "furniture" | "decoration" | "collectible";
export type ItemRarity = "common" | "uncommon" | "rare" | "epic";
export interface ItemDefinition { id: string; name: string; category: ItemCategory; stackSize: number; icon: string; rarity: ItemRarity; unlockLevel?: number; }
export interface InventorySlot { itemId: string; quantity: number; }
export type FurnitureCategory = "bed" | "seating" | "surface" | "lighting" | "plant" | "storage" | "kitchen" | "shelving" | "rug" | "work" | "outdoor" | "fireplace" | "decoration" | "wall";
export interface FurnitureDefinition { id: string; name: string; category: FurnitureCategory; color: string; footprint: [number, number]; unlockLevel?: number; }
export type HomeRole = "owner" | "co-owner" | "builder" | "decorator" | "visitor";
export interface HomeObject { id: string; furnitureId: string; position: { x: number; y: number; z: number }; rotation: number; }
export interface HomeState { ownerId: PlayerId; objects: HomeObject[]; permissions: Record<string, HomeRole>; revision: number; }
export type RecipeCategory = "tools" | "furniture" | "decorations" | "food" | "potions";
export type CraftingStation = "hands" | "workbench" | "kitchen";
export interface RecipeInput { itemId: string; quantity: number; }
export interface RecipeDefinition { id: string; name: string; category: RecipeCategory; inputs: RecipeInput[]; outputs: RecipeInput[]; station: CraftingStation; durationSeconds: number; unlockLevel?: number; }
export type QuestType = "talk" | "reach" | "collect" | "craft" | "discover" | "build" | "find";
export type QuestState = "available" | "active" | "completed" | "locked";
export interface QuestDefinition { id: string; name: string; description: string; type: QuestType; targetId: string; targetQuantity: number; rewardXp: number; rewardItems?: RecipeInput[]; prerequisiteIds?: string[]; region?: WorldId; }
export interface QuestProgress { questId: string; state: QuestState; progress: number; }
export type NpcState = "idle" | "walk" | "work" | "eat" | "socialize" | "sleep";
export interface NpcDefinition { id: string; name: string; location: WorldId; position: { x: number; y: number; z: number }; dialogue: string[]; quests: string[]; schedule: Array<{ start: number; end: number; state: NpcState }>; }
export type DiscoveryType = "location" | "resource" | "creature" | "recipe" | "portal" | "secret";
export interface DiscoveryDefinition { id: string; name: string; type: DiscoveryType; description: string; region?: WorldId; }
export type PortalState = "unlocked" | "quest-locked" | "discovery-locked" | "mysterious";
export interface PortalDefinition { id: string; name: string; destination: WorldId; position: { x: number; y: number; z: number }; state: PortalState; requirement?: string; }
export interface ProgressionState { experience: number; level: number; achievements: string[]; discoveredRecipes: string[]; discoveredLocations: string[]; collectibles: string[]; }
export type EmoteId = "wave" | "sit" | "dance" | "clap" | "bow" | "laugh" | "point" | "celebrate" | "sleep";
export interface EmoteDefinition { id: EmoteId; name: string; symbol: string; }
export interface CreatureDefinition { id: string; name: string; color: string; size: number; speed: number; spawn: { x: number; y: number; z: number }[]; region?: WorldId; }
export interface AchievementDefinition { id: string; name: string; description: string; }
export type WeatherKind = "clear" | "cloudy" | "rain" | "snow";
export interface WorldAtmosphere { dayProgress: number; weather: WeatherKind; }
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
export interface PlayerProfile {
  id: PlayerId;
  displayName: string;
  appearance: CharacterAppearance;
  inventory: InventorySlot[];
  progression: ProgressionState;
  quests: QuestProgress[];
  home: HomeState;
  updatedAt: number;
}

export type ResourceKind = "tree" | "boulder" | "plants" | "herbs" | "fruit" | "crystals" | "fishing" | "mushroom" | "glowshroom" | "starbloom";

export interface ResourceNodeDefinition {
  id: string;
  itemId: string;
  name: string;
  kind: ResourceKind;
  position: [number, number, number];
  color: string;
  respawnTimeSeconds: number;
  yieldQuantity: number;
  region?: WorldId;
}

export interface RegionDefinition {
  id: WorldId;
  name: string;
  description: string;
  skyColor: string;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  groundColor: string;
  ambientColor: string;
  ambientIntensity: number;
  sunColor: string;
  sunIntensity: number;
  sunPosition: [number, number, number];
  music: MusicTrack;
  ambience: AmbienceTrack;
  unlockRequirement?: string;
}

export type MusicTrack = "lumenfall-day" | "lumenfall-night" | "moonwood" | "astral-vale" | "homestead";
export type AmbienceTrack = "forest-day" | "forest-night" | "moonwood-ambience" | "astral-ambience" | "home-ambience" | "rain" | "snow";

export type SfxId =
  | "gather-tree" | "gather-stone" | "gather-ore" | "gather-plant" | "gather-herb" | "gather-fruit" | "gather-crystal" | "gather-fish"
  | "craft" | "cook" | "place-furniture" | "store-furniture" | "rotate-furniture"
  | "npc-talk" | "quest-accept" | "quest-complete" | "xp-gain" | "level-up" | "reward"
  | "discovery" | "portal-travel" | "world-event" | "ui-click" | "ui-hover" | "footstep" | "emote";

export interface AudioSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  ambienceVolume: number;
  muted: boolean;
}

export type RealtimeMessage =
  | { type: "session.create"; requestId: string; displayName: string; appearance: CharacterAppearance }
  | { type: "session.join"; requestId: string; inviteCode: string; displayName: string; appearance: CharacterAppearance; reconnectToken?: string }
  | { type: "session.leave"; requestId: string }
  | { type: "player.update"; player: Pick<PlayerSnapshot, "position" | "rotation" | "movement"> }
  | { type: "session.created"; requestId: string; session: SessionDescriptor; self: PlayerSnapshot; players: PlayerSnapshot[]; home?: HomeState; reconnectToken: string }
  | { type: "session.joined"; requestId: string; session: SessionDescriptor; self: PlayerSnapshot; players: PlayerSnapshot[]; home?: HomeState; reconnectToken: string }
  | { type: "player.joined"; player: PlayerSnapshot }
  | { type: "player.updated"; player: PlayerSnapshot }
  | { type: "player.emote"; playerId: PlayerId; emote: string }
  | { type: "player.left"; playerId: PlayerId; reason: "left" | "disconnected" }
  | { type: "home.updated"; ownerId: PlayerId; state: HomeState }
  | { type: "home.update"; state: HomeState }
  | { type: "profile.sync"; profile: Partial<PlayerProfile> }
  | { type: "profile.updated"; profile: Partial<PlayerProfile> }
  | { type: "world.interact"; interactionType: string; targetId: string; position?: { x: number; y: number; z: number } }
  | { type: "world.event"; eventType: string; targetId: string; playerId: PlayerId }
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

export const ITEM_CATALOG: ItemDefinition[] = [
  { id: "wood", name: "Wood", category: "resource", stackSize: 99, icon: "枝", rarity: "common" },
  { id: "stone", name: "Stone", category: "resource", stackSize: 99, icon: "◆", rarity: "common" },
  { id: "ore", name: "Ore", category: "resource", stackSize: 50, icon: "◈", rarity: "uncommon" },
  { id: "flowers", name: "Flowers", category: "resource", stackSize: 99, icon: "✿", rarity: "common" },
  { id: "herbs", name: "Herbs", category: "resource", stackSize: 99, icon: "❧", rarity: "common" },
  { id: "fruit", name: "Forest fruit", category: "resource", stackSize: 50, icon: "●", rarity: "common" },
  { id: "fish", name: "River fish", category: "resource", stackSize: 20, icon: "≈", rarity: "uncommon" },
  { id: "crystals", name: "Moon crystals", category: "resource", stackSize: 20, icon: "✦", rarity: "rare" },
  { id: "moonwood-mushroom", name: "Glow mushroom", category: "resource", stackSize: 50, icon: "🍄", rarity: "uncommon" },
  { id: "moonwood-bark", name: "Silver bark", category: "resource", stackSize: 50, icon: "❘", rarity: "uncommon" },
  { id: "star-essence", name: "Star essence", category: "resource", stackSize: 20, icon: "✧", rarity: "epic" },
  { id: "astral-crystal", name: "Astral crystal", category: "resource", stackSize: 20, icon: "◇", rarity: "rare" },
  { id: "starbloom-petal", name: "Starbloom petal", category: "resource", stackSize: 50, icon: "❀", rarity: "rare" },
  { id: "fruit-tea", name: "Fruit tea", category: "food", stackSize: 20, icon: "☕", rarity: "common" },
  { id: "herb-soup", name: "Herb soup", category: "food", stackSize: 20, icon: "◌", rarity: "common" },
  { id: "forest-stew", name: "Forest stew", category: "food", stackSize: 20, icon: "♨", rarity: "uncommon" },
  { id: "honey-pastry", name: "Honey pastry", category: "food", stackSize: 20, icon: "⌁", rarity: "uncommon" },
  { id: "moonwood-broth", name: "Moonwood broth", category: "food", stackSize: 20, icon: "🍵", rarity: "uncommon", unlockLevel: 3 },
  { id: "astral-elixir", name: "Astral elixir", category: "food", stackSize: 10, icon: "☄", rarity: "epic", unlockLevel: 5 },
  { id: "glow-salad", name: "Glow salad", category: "food", stackSize: 20, icon: "🥗", rarity: "uncommon", unlockLevel: 3 },
  { id: "wooden-hammer", name: "Wooden hammer", category: "tool", stackSize: 1, icon: "⚒", rarity: "common" },
  { id: "silver-chisel", name: "Silver chisel", category: "tool", stackSize: 1, icon: "⚒", rarity: "uncommon", unlockLevel: 4 },
  { id: "starlight-lantern", name: "Starlight lantern", category: "decoration", stackSize: 5, icon: "🏮", rarity: "rare", unlockLevel: 5 },
  { id: "moonwood-compass", name: "Moonwood compass", category: "collectible", stackSize: 1, icon: "🧭", rarity: "rare" }
];

export const FURNITURE_CATALOG: FurnitureDefinition[] = [
  { id: "bed", name: "Moss bed", category: "bed", color: "#637b70", footprint: [2.2, 1.3] },
  { id: "chair", name: "Willow chair", category: "seating", color: "#9d7556", footprint: [0.8, 0.8] },
  { id: "table", name: "Round table", category: "surface", color: "#89664d", footprint: [1.6, 1.6] },
  { id: "sofa", name: "Fireside sofa", category: "seating", color: "#66718a", footprint: [2.4, 0.9] },
  { id: "lamp", name: "Lantern lamp", category: "lighting", color: "#d1b56b", footprint: [0.5, 0.5] },
  { id: "plant", name: "Fern plant", category: "plant", color: "#6d8f68", footprint: [0.7, 0.7] },
  { id: "storage", name: "Cedar storage", category: "storage", color: "#73533f", footprint: [1.3, 0.8] },
  { id: "kitchen", name: "Clay kitchen", category: "kitchen", color: "#9b6651", footprint: [2.4, 0.8] },
  { id: "bookshelf", name: "Moon bookshelf", category: "shelving", color: "#536477", footprint: [1.4, 0.5] },
  { id: "rug", name: "River rug", category: "rug", color: "#477b7a", footprint: [2.3, 1.5] },
  { id: "desk", name: "Cartographer desk", category: "work", color: "#596355", footprint: [1.5, 0.8] },
  { id: "bench", name: "Garden bench", category: "outdoor", color: "#86644d", footprint: [1.8, 0.7] },
  { id: "fireplace", name: "Stone fireplace", category: "fireplace", color: "#7e6b65", footprint: [1.8, 0.7] },
  { id: "decorations", name: "Memory shelf", category: "decoration", color: "#a28a66", footprint: [0.8, 0.5] },
  { id: "wall-decoration", name: "Pressed leaves", category: "wall", color: "#8aab6b", footprint: [0.8, 0.15] },
  { id: "starlight-orb", name: "Starlight orb", category: "lighting", color: "#9fc5e8", footprint: [0.6, 0.6], unlockLevel: 5 },
  { id: "astral-tapestry", name: "Astral tapestry", category: "wall", color: "#6b5d8c", footprint: [1.2, 0.15], unlockLevel: 5 },
  { id: "moonwood-shelf", name: "Moonwood shelf", category: "shelving", color: "#8a9bb5", footprint: [1.4, 0.5], unlockLevel: 3 }
];

export const RECIPE_CATALOG: RecipeDefinition[] = [
  { id: "fruit-tea", name: "Fruit tea", category: "food", inputs: [{ itemId: "fruit", quantity: 2 }, { itemId: "flowers", quantity: 1 }], outputs: [{ itemId: "fruit-tea", quantity: 1 }], station: "kitchen", durationSeconds: 3 },
  { id: "herb-soup", name: "Herb soup", category: "food", inputs: [{ itemId: "herbs", quantity: 2 }, { itemId: "stone", quantity: 1 }], outputs: [{ itemId: "herb-soup", quantity: 1 }], station: "kitchen", durationSeconds: 4 },
  { id: "forest-stew", name: "Forest stew", category: "food", inputs: [{ itemId: "fruit", quantity: 1 }, { itemId: "herbs", quantity: 2 }, { itemId: "fish", quantity: 1 }], outputs: [{ itemId: "forest-stew", quantity: 1 }], station: "kitchen", durationSeconds: 6 },
  { id: "honey-pastry", name: "Honey pastry", category: "food", inputs: [{ itemId: "flowers", quantity: 2 }, { itemId: "fruit", quantity: 1 }], outputs: [{ itemId: "honey-pastry", quantity: 1 }], station: "kitchen", durationSeconds: 5 },
  { id: "wooden-hammer", name: "Wooden hammer", category: "tools", inputs: [{ itemId: "wood", quantity: 5 }, { itemId: "stone", quantity: 2 }], outputs: [{ itemId: "wooden-hammer", quantity: 1 }], station: "workbench", durationSeconds: 3 },
  { id: "moonwood-broth", name: "Moonwood broth", category: "food", inputs: [{ itemId: "moonwood-mushroom", quantity: 2 }, { itemId: "herbs", quantity: 1 }], outputs: [{ itemId: "moonwood-broth", quantity: 1 }], station: "kitchen", durationSeconds: 5, unlockLevel: 3 },
  { id: "glow-salad", name: "Glow salad", category: "food", inputs: [{ itemId: "moonwood-mushroom", quantity: 1 }, { itemId: "fruit", quantity: 1 }, { itemId: "flowers", quantity: 1 }], outputs: [{ itemId: "glow-salad", quantity: 1 }], station: "kitchen", durationSeconds: 4, unlockLevel: 3 },
  { id: "silver-chisel", name: "Silver chisel", category: "tools", inputs: [{ itemId: "moonwood-bark", quantity: 3 }, { itemId: "ore", quantity: 2 }], outputs: [{ itemId: "silver-chisel", quantity: 1 }], station: "workbench", durationSeconds: 4, unlockLevel: 4 },
  { id: "astral-elixir", name: "Astral elixir", category: "potions", inputs: [{ itemId: "star-essence", quantity: 1 }, { itemId: "astral-crystal", quantity: 1 }, { itemId: "starbloom-petal", quantity: 2 }], outputs: [{ itemId: "astral-elixir", quantity: 1 }], station: "kitchen", durationSeconds: 8, unlockLevel: 5 },
  { id: "starlight-lantern", name: "Starlight lantern", category: "decorations", inputs: [{ itemId: "astral-crystal", quantity: 2 }, { itemId: "moonwood-bark", quantity: 2 }], outputs: [{ itemId: "starlight-lantern", quantity: 1 }], station: "workbench", durationSeconds: 6, unlockLevel: 5 }
];

export const RESOURCE_NODES: ResourceNodeDefinition[] = [
  { id: "tree-north", itemId: "wood", name: "Ancient Willow Tree", kind: "tree", position: [-11, 0, -8], color: "#79543c", respawnTimeSeconds: 20, yieldQuantity: 2, region: "lumenfall" },
  { id: "tree-west", itemId: "wood", name: "Silver Birch", kind: "tree", position: [-14, 0, 4], color: "#79543c", respawnTimeSeconds: 20, yieldQuantity: 2, region: "lumenfall" },
  { id: "tree-south", itemId: "wood", name: "Moss Oak", kind: "tree", position: [-10, 0, 12], color: "#79543c", respawnTimeSeconds: 20, yieldQuantity: 2, region: "lumenfall" },
  { id: "tree-east", itemId: "wood", name: "River Pine", kind: "tree", position: [14, 0, 7], color: "#79543c", respawnTimeSeconds: 20, yieldQuantity: 2, region: "lumenfall" },
  { id: "boulder-hearth", itemId: "stone", name: "Granite Boulder", kind: "boulder", position: [-10, 0, -2], color: "#8b9690", respawnTimeSeconds: 25, yieldQuantity: 2, region: "lumenfall" },
  { id: "boulder-grove", itemId: "ore", name: "Iron Vein", kind: "boulder", position: [12, 0, -5], color: "#a89078", respawnTimeSeconds: 30, yieldQuantity: 1, region: "lumenfall" },
  { id: "blossom-clearing", itemId: "flowers", name: "Sun Blossoms", kind: "plants", position: [7, 0, 5], color: "#d08c91", respawnTimeSeconds: 15, yieldQuantity: 2, region: "lumenfall" },
  { id: "herb-patch", itemId: "herbs", name: "Forest Herbs", kind: "herbs", position: [9, 0, -1], color: "#7fa26b", respawnTimeSeconds: 15, yieldQuantity: 2, region: "lumenfall" },
  { id: "berry-bush", itemId: "fruit", name: "Wildberry Bush", kind: "fruit", position: [-5, 0, -9], color: "#bd6d5e", respawnTimeSeconds: 15, yieldQuantity: 2, region: "lumenfall" },
  { id: "crystal-shrine", itemId: "crystals", name: "Moon Crystal Cluster", kind: "crystals", position: [11, 0, -8], color: "#9fc5e8", respawnTimeSeconds: 40, yieldQuantity: 1, region: "lumenfall" },
  { id: "river-pier-spot", itemId: "fish", name: "Riverbank Shallows", kind: "fishing", position: [-8, 0, 1], color: "#5d9b9b", respawnTimeSeconds: 25, yieldQuantity: 1, region: "lumenfall" },
  { id: "moonwood-glowshroom-1", itemId: "moonwood-mushroom", name: "Glow Mushroom Cluster", kind: "glowshroom", position: [-6, 0, -6], color: "#9fd8a8", respawnTimeSeconds: 18, yieldQuantity: 2, region: "moonwood" },
  { id: "moonwood-glowshroom-2", itemId: "moonwood-mushroom", name: "Lumin Cap", kind: "glowshroom", position: [5, 0, -8], color: "#9fd8a8", respawnTimeSeconds: 18, yieldQuantity: 2, region: "moonwood" },
  { id: "moonwood-glowshroom-3", itemId: "moonwood-mushroom", name: "Pale Spore", kind: "glowshroom", position: [8, 0, 3], color: "#9fd8a8", respawnTimeSeconds: 18, yieldQuantity: 2, region: "moonwood" },
  { id: "moonwood-tree-1", itemId: "moonwood-bark", name: "Silver Moonwood Tree", kind: "tree", position: [-10, 0, 4], color: "#a8b8c8", respawnTimeSeconds: 25, yieldQuantity: 2, region: "moonwood" },
  { id: "moonwood-tree-2", itemId: "moonwood-bark", name: "Pale Birch", kind: "tree", position: [12, 0, 6], color: "#a8b8c8", respawnTimeSeconds: 25, yieldQuantity: 2, region: "moonwood" },
  { id: "moonwood-crystal-1", itemId: "crystals", name: "Deep Moon Crystal", kind: "crystals", position: [-8, 0, 10], color: "#b8d8f8", respawnTimeSeconds: 45, yieldQuantity: 1, region: "moonwood" },
  { id: "astral-crystal-1", itemId: "astral-crystal", name: "Astral Crystal Formation", kind: "crystals", position: [-7, 0, -7], color: "#c8b8e8", respawnTimeSeconds: 50, yieldQuantity: 1, region: "astral-vale" },
  { id: "astral-crystal-2", itemId: "astral-crystal", name: "Void Shard", kind: "crystals", position: [6, 0, -5], color: "#c8b8e8", respawnTimeSeconds: 50, yieldQuantity: 1, region: "astral-vale" },
  { id: "astral-starbloom-1", itemId: "starbloom-petal", name: "Starbloom Flower", kind: "starbloom", position: [9, 0, 8], color: "#e8c8f8", respawnTimeSeconds: 30, yieldQuantity: 2, region: "astral-vale" },
  { id: "astral-starbloom-2", itemId: "starbloom-petal", name: "Nebula Bloom", kind: "starbloom", position: [-10, 0, 9], color: "#e8c8f8", respawnTimeSeconds: 30, yieldQuantity: 2, region: "astral-vale" },
  { id: "astral-essence-1", itemId: "star-essence", name: "Star Essence Pool", kind: "crystals", position: [0, 0, -10], color: "#fff0c8", respawnTimeSeconds: 60, yieldQuantity: 1, region: "astral-vale" }
];

export const QUEST_CATALOG: QuestDefinition[] = [
  { id: "first-gathering", name: "A handful of beginnings", description: "Gather five pieces of wood from the Lumenfall trees.", type: "collect", targetId: "wood", targetQuantity: 5, rewardXp: 40, rewardItems: [{ itemId: "flowers", quantity: 3 }], region: "lumenfall" },
  { id: "lantern-keeper", name: "The lantern keeper", description: "Find the glowing lantern stone monolith in the clearing.", type: "discover", targetId: "lantern-stone", targetQuantity: 1, rewardXp: 60, rewardItems: [{ itemId: "crystals", quantity: 2 }], region: "lumenfall" },
  { id: "warm-meal", name: "Something warm", description: "Cook a bowl of herb soup at the kitchen station.", type: "craft", targetId: "herb-soup", targetQuantity: 1, rewardXp: 75, rewardItems: [{ itemId: "fruit", quantity: 3 }], prerequisiteIds: ["first-gathering"], region: "lumenfall" },
  { id: "cozy-hearth", name: "Cozy hearth", description: "Place any piece of furniture on your home plot.", type: "build", targetId: "home-object", targetQuantity: 1, rewardXp: 80, rewardItems: [{ itemId: "wood", quantity: 5 }], prerequisiteIds: ["first-gathering"], region: "lumenfall" },
  { id: "moonwood-footfall", name: "Under older branches", description: "Discover the Moonwood trail portal.", type: "discover", targetId: "moonwood", targetQuantity: 1, rewardXp: 120, rewardItems: [{ itemId: "crystals", quantity: 3 }], prerequisiteIds: ["lantern-keeper"], region: "lumenfall" },
  { id: "moonwood-gathering", name: "Glow of the forest", description: "Gather three glow mushrooms in Moonwood.", type: "collect", targetId: "moonwood-mushroom", targetQuantity: 3, rewardXp: 100, rewardItems: [{ itemId: "moonwood-bark", quantity: 3 }], prerequisiteIds: ["moonwood-footfall"], region: "moonwood" },
  { id: "moonwood-bark-quest", name: "Silver harvest", description: "Gather three pieces of silver bark from Moonwood trees.", type: "collect", targetId: "moonwood-bark", targetQuantity: 3, rewardXp: 110, rewardItems: [{ itemId: "crystals", quantity: 2 }], prerequisiteIds: ["moonwood-footfall"], region: "moonwood" },
  { id: "moonwood-broth-quest", name: "A taste of Moonwood", description: "Cook a bowl of Moonwood broth.", type: "craft", targetId: "moonwood-broth", targetQuantity: 1, rewardXp: 150, rewardItems: [{ itemId: "star-essence", quantity: 1 }], prerequisiteIds: ["moonwood-gathering"], region: "moonwood" },
  { id: "astral-discovery", name: "Beyond the veil", description: "Discover the Astral Vale portal.", type: "discover", targetId: "astral-vale", targetQuantity: 1, rewardXp: 200, rewardItems: [{ itemId: "astral-crystal", quantity: 2 }], prerequisiteIds: ["moonwood-broth-quest"], region: "moonwood" },
  { id: "astral-crystals", name: "Shards of the void", description: "Gather two astral crystals from the Astral Vale.", type: "collect", targetId: "astral-crystal", targetQuantity: 2, rewardXp: 180, rewardItems: [{ itemId: "starbloom-petal", quantity: 3 }], prerequisiteIds: ["astral-discovery"], region: "astral-vale" },
  { id: "astral-essence", name: "Starlight harvest", description: "Gather star essence from the Astral Vale pools.", type: "collect", targetId: "star-essence", targetQuantity: 1, rewardXp: 220, rewardItems: [{ itemId: "astral-crystal", quantity: 2 }], prerequisiteIds: ["astral-discovery"], region: "astral-vale" },
  { id: "astral-elixir-quest", name: "The Astral elixir", description: "Craft an astral elixir at a kitchen station.", type: "craft", targetId: "astral-elixir", targetQuantity: 1, rewardXp: 300, rewardItems: [{ itemId: "starlight-lantern", quantity: 1 }], prerequisiteIds: ["astral-crystals", "astral-essence"], region: "astral-vale" }
];

export const DISCOVERY_CATALOG: DiscoveryDefinition[] = [
  { id: "lumenfall", name: "Lumenfall Hearth", type: "location", description: "A lantern-lit gathering place where travelers rest.", region: "lumenfall" },
  { id: "moonwood", name: "Moonwood Trail", type: "portal", description: "An ancient river path beneath towering glowing branches.", region: "lumenfall" },
  { id: "lantern-stone", name: "Lantern Stone Monolith", type: "secret", description: "An ancient runic beacon humming with warm resonant energy.", region: "lumenfall" },
  { id: "mysterious-portal", name: "The Quiet Portal", type: "portal", description: "A sealed archway pulsing with enigmatic violet starlight.", region: "lumenfall" },
  { id: "moon-crystals", name: "Moon Crystal Grove", type: "resource", description: "Luminescent crystals found clustered near ancient ruins.", region: "lumenfall" },
  { id: "riverbank-pier", name: "Riverbank Shallows", type: "location", description: "Calm waters frequented by playful river otters.", region: "lumenfall" },
  { id: "homestead-meadow", name: "Homestead Meadow", type: "location", description: "Your private clearing designated for hearth and home building.", region: "lumenfall" },
  { id: "moonwood-grove", name: "Moonwood Grove", type: "location", description: "A bioluminescent forest of silver-barked trees and glowing mushrooms.", region: "moonwood" },
  { id: "moonwood-ruins", name: "Moonwood Ruins", type: "secret", description: "Crumbling stone remnants of a forgotten civilization.", region: "moonwood" },
  { id: "astral-vale", name: "Astral Vale", type: "portal", description: "A shimmering rift between worlds, filled with starlight and void crystals.", region: "moonwood" },
  { id: "astral-garden", name: "Astral Garden", type: "location", description: "A floating garden of starbloom flowers and crystalline formations.", region: "astral-vale" },
  { id: "star-essence-pool", name: "Star Essence Pool", type: "resource", description: "A pool of pure starlight essence, shimmering with cosmic energy.", region: "astral-vale" }
];

export const NPC_CATALOG: NpcDefinition[] = [
  {
    id: "mira",
    name: "Mira",
    location: "lumenfall",
    position: { x: -3, y: 0, z: -1 },
    dialogue: [
      "Welcome to Lumenfall! The forest is alive today.",
      "Bring me five pieces of wood from the surrounding trees and we'll keep the hearth lit.",
      "Once the hearth is warm, the ancient lantern stone will guide your path.",
      "The Moonwood trail lies beyond the northern trees. It calls to those who listen.",
      "You've grown stronger. The Astral Vale awaits those who prove themselves."
    ],
    quests: ["first-gathering", "cozy-hearth", "warm-meal"],
    schedule: [{ start: 0, end: 0.7, state: "work" }, { start: 0.7, end: 0.85, state: "socialize" }, { start: 0.85, end: 1, state: "sleep" }]
  },
  {
    id: "oren",
    name: "Oren",
    location: "lumenfall",
    position: { x: 3, y: 0, z: -3 },
    dialogue: [
      "The Moonwood river changes its mind after sunset.",
      "Look for the glowing lantern monolith south of the trail.",
      "Beyond the trees lies Moonwood... its portal hums with ancient magic.",
      "The glow mushrooms of Moonwood are prized by cooks and healers alike.",
      "When you've tasted Moonwood broth, the Astral Vale will reveal itself."
    ],
    quests: ["lantern-keeper", "moonwood-footfall", "moonwood-gathering"],
    schedule: [{ start: 0, end: 0.45, state: "work" }, { start: 0.45, end: 0.75, state: "eat" }, { start: 0.75, end: 1, state: "idle" }]
  },
  {
    id: "lyra",
    name: "Lyra",
    location: "moonwood",
    position: { x: -3, y: 0, z: 3 },
    dialogue: [
      "Welcome to Moonwood, traveler. The mushrooms here glow with forest memory.",
      "Silver bark from the moonwood trees is strong and light. It sings when you work it.",
      "Cook with the glow mushrooms and you'll taste the forest's heart.",
      "The Astral Vale lies beyond. Only those who have proven themselves may enter.",
      "Star essence flows through the Vale. Bring me some, and I will show you wonders."
    ],
    quests: ["moonwood-gathering", "moonwood-bark-quest", "moonwood-broth-quest", "astral-discovery"],
    schedule: [{ start: 0, end: 0.5, state: "work" }, { start: 0.5, end: 0.8, state: "socialize" }, { start: 0.8, end: 1, state: "sleep" }]
  },
  {
    id: "orion",
    name: "Orion",
    location: "astral-vale",
    position: { x: 0, y: 0, z: 5 },
    dialogue: [
      "You found the Vale. Few do. The starlight here remembers everything.",
      "Astral crystals form where the veil is thinnest. Gather them carefully.",
      "Starbloom petals and star essence... with these, you can craft the Astral elixir.",
      "The elixir is the key. It opens doors the eye cannot see.",
      "You have come far, traveler. The cosmos acknowledges your journey."
    ],
    quests: ["astral-crystals", "astral-essence", "astral-elixir-quest"],
    schedule: [{ start: 0, end: 0.6, state: "work" }, { start: 0.6, end: 0.9, state: "idle" }, { start: 0.9, end: 1, state: "sleep" }]
  }
];

export const PORTAL_CATALOG: PortalDefinition[] = [
  { id: "moonwood-gate", name: "Moonwood trail", destination: "moonwood", position: { x: -13, y: 0, z: -10 }, state: "unlocked" },
  { id: "astral-gate", name: "Astral Vale rift", destination: "astral-vale", position: { x: 13, y: 0, z: -10 }, state: "quest-locked", requirement: "Complete the Moonwood broth quest" },
  { id: "return-lumenfall", name: "Return to Lumenfall", destination: "lumenfall", position: { x: 13, y: 0, z: 10 }, state: "unlocked" },
  { id: "return-lumenfall-from-astral", name: "Return to Lumenfall", destination: "lumenfall", position: { x: 13, y: 0, z: 10 }, state: "unlocked" }
];

export const REGION_CATALOG: RegionDefinition[] = [
  {
    id: "lumenfall",
    name: "Lumenfall",
    description: "A lantern-lit gathering place where travelers rest.",
    skyColor: "#9fb5aa",
    fogColor: "#9fb5aa",
    fogNear: 18,
    fogFar: 42,
    groundColor: "#71856c",
    ambientColor: "#fff0d2",
    ambientIntensity: 0.5,
    sunColor: "#fff0ce",
    sunIntensity: 1.2,
    sunPosition: [-8, 14, 6],
    music: "lumenfall-day",
    ambience: "forest-day"
  },
  {
    id: "moonwood",
    name: "Moonwood",
    description: "A bioluminescent forest of silver-barked trees and glowing mushrooms.",
    skyColor: "#2a3a4a",
    fogColor: "#3a4a5a",
    fogNear: 12,
    fogFar: 35,
    groundColor: "#3a4a3e",
    ambientColor: "#8ab8d8",
    ambientIntensity: 0.35,
    sunColor: "#a8c8e8",
    sunIntensity: 0.6,
    sunPosition: [5, 12, -4],
    music: "moonwood",
    ambience: "moonwood-ambience",
    unlockRequirement: "Discover the Moonwood trail portal"
  },
  {
    id: "astral-vale",
    name: "Astral Vale",
    description: "A shimmering rift between worlds, filled with starlight and void crystals.",
    skyColor: "#1a1a2e",
    fogColor: "#2a2a4e",
    fogNear: 10,
    fogFar: 30,
    groundColor: "#2a2a3e",
    ambientColor: "#c8b8e8",
    ambientIntensity: 0.4,
    sunColor: "#e8d8f8",
    sunIntensity: 0.5,
    sunPosition: [0, 10, 0],
    music: "astral-vale",
    ambience: "astral-ambience",
    unlockRequirement: "Complete the Moonwood broth quest"
  },
  {
    id: "player-home",
    name: "Homestead Meadow",
    description: "Your private clearing designated for hearth and home building.",
    skyColor: "#9fb5aa",
    fogColor: "#9fb5aa",
    fogNear: 18,
    fogFar: 42,
    groundColor: "#71856c",
    ambientColor: "#fff0d2",
    ambientIntensity: 0.5,
    sunColor: "#fff0ce",
    sunIntensity: 1.2,
    sunPosition: [-8, 14, 6],
    music: "homestead",
    ambience: "home-ambience"
  }
];

export const EMOTE_CATALOG: EmoteDefinition[] = [
  { id: "wave", name: "Wave", symbol: "👋" }, { id: "sit", name: "Sit", symbol: "◡" },
  { id: "dance", name: "Dance", symbol: "✧" }, { id: "clap", name: "Clap", symbol: "👏" },
  { id: "bow", name: "Bow", symbol: "⌄" }, { id: "laugh", name: "Laugh", symbol: "☼" },
  { id: "point", name: "Point", symbol: "→" }, { id: "celebrate", name: "Celebrate", symbol: "✦" },
  { id: "sleep", name: "Sleep", symbol: "z" }
];

export const CREATURE_CATALOG: CreatureDefinition[] = [
  { id: "moss-rabbit", name: "Moss rabbit", color: "#b4c68e", size: .28, speed: .7, spawn: [{ x: -8, y: 0, z: 9 }, { x: 8, y: 0, z: 8 }], region: "lumenfall" },
  { id: "river-otter", name: "River otter", color: "#795b4d", size: .34, speed: .45, spawn: [{ x: -8, y: 0, z: 1 }, { x: -9, y: 0, z: 2 }], region: "lumenfall" },
  { id: "lantern-moth", name: "Lantern moth", color: "#e1b96f", size: .12, speed: .9, spawn: [{ x: 4, y: 1.8, z: -3 }, { x: 5, y: 2.1, z: -3 }], region: "lumenfall" },
  { id: "stone-tortoise", name: "Stone tortoise", color: "#7c8881", size: .42, speed: .18, spawn: [{ x: 10, y: 0, z: 10 }], region: "lumenfall" },
  { id: "moonwood-firefly", name: "Moonwood firefly", color: "#a8e8c8", size: .08, speed: 1.2, spawn: [{ x: -5, y: 1.5, z: 0 }, { x: 5, y: 2, z: -3 }, { x: 0, y: 1.8, z: 5 }], region: "moonwood" },
  { id: "moonwood-deer", name: "Pale deer", color: "#c8d8e8", size: .4, speed: .5, spawn: [{ x: -10, y: 0, z: 8 }, { x: 10, y: 0, z: -3 }], region: "moonwood" },
  { id: "astral-wisp", name: "Astral wisp", color: "#e8c8f8", size: .1, speed: 1.5, spawn: [{ x: -5, y: 1.5, z: -3 }, { x: 5, y: 2, z: 3 }, { x: 0, y: 1.8, z: -8 }], region: "astral-vale" },
  { id: "star-fox", name: "Star fox", color: "#d8c8e8", size: .25, speed: .8, spawn: [{ x: -8, y: 0, z: 6 }, { x: 8, y: 0, z: 4 }], region: "astral-vale" }
];

export const ACHIEVEMENT_CATALOG: AchievementDefinition[] = [
  { id: "first-steps", name: "First steps", description: "Arrive in Lumenfall." },
  { id: "gatherer", name: "A generous handful", description: "Gather your first resource." },
  { id: "maker", name: "Make something", description: "Craft your first recipe." },
  { id: "wayfinder", name: "Wayfinder", description: "Discover a new location." },
  { id: "homestead-builder", name: "Homestead Builder", description: "Place your first piece of furniture." },
  { id: "woodsman", name: "Woodsman", description: "Chop wood from the ancient trees." },
  { id: "moonwood-explorer", name: "Moonwood Explorer", description: "Enter the Moonwood forest." },
  { id: "astral-traveler", name: "Astral Traveler", description: "Enter the Astral Vale." },
  { id: "master-chef", name: "Master Chef", description: "Cook every recipe." },
  { id: "completionist", name: "Completionist", description: "Complete every quest." }
];

export function createEmptyInventory(): InventorySlot[] { return []; }
export function createDefaultHome(ownerId: PlayerId): HomeState { return { ownerId, objects: [], permissions: { [ownerId]: "owner" }, revision: 0 }; }
export function createDefaultProgression(): ProgressionState { return { experience: 0, level: 1, achievements: ["first-steps"], discoveredRecipes: [], discoveredLocations: ["lumenfall"], collectibles: [] }; }
export function createDefaultProfile(id: PlayerId, displayName = "Traveler", appearance = createDefaultAppearance()): PlayerProfile {
  return {
    id,
    displayName,
    appearance,
    inventory: createEmptyInventory(),
    progression: createDefaultProgression(),
    quests: QUEST_CATALOG.map((quest) => ({ questId: quest.id, state: "available" as const, progress: 0 })),
    home: createDefaultHome(id),
    updatedAt: Date.now()
  };
}

export function createDefaultAudioSettings(): AudioSettings {
  return { masterVolume: 0.7, musicVolume: 0.5, sfxVolume: 0.7, ambienceVolume: 0.4, muted: false };
}

export function xpForLevel(level: number): number {
  return 100 * level * level;
}

export function levelFromXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level += 1;
  return level;
}
