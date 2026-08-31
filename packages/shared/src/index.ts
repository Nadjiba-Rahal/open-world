export const CURRENT_PHASE = "multiplayer" as const;
export const PHASES = ["foundation", "world", "character", "multiplayer", "home", "gameplay", "exploration", "social", "progression", "mobile", "optimization"] as const;
export type BuildPhase = (typeof PHASES)[number];
export type WorldId = "lumenfall" | "moonwood" | "player-home" | "mystery";
export type PlayerId = string & { readonly __brand: "PlayerId" };
export interface CharacterAppearance { skinTone: string; bodyType: string; face: string; eyes: string; hair: string; hairColor: string; outfit: string; accessories: string[]; }
export type MovementState = "idle" | "walking" | "sprinting";
export type ItemCategory = "resource" | "food" | "tool" | "furniture" | "decoration" | "collectible";
export type ItemRarity = "common" | "uncommon" | "rare" | "epic";
export interface ItemDefinition { id: string; name: string; category: ItemCategory; stackSize: number; icon: string; rarity: ItemRarity; }
export interface InventorySlot { itemId: string; quantity: number; }
export type FurnitureCategory = "bed" | "seating" | "surface" | "lighting" | "plant" | "storage" | "kitchen" | "shelving" | "rug" | "work" | "outdoor" | "fireplace" | "decoration" | "wall";
export interface FurnitureDefinition { id: string; name: string; category: FurnitureCategory; color: string; footprint: [number, number]; }
export type HomeRole = "owner" | "co-owner" | "builder" | "decorator" | "visitor";
export interface HomeObject { id: string; furnitureId: string; position: { x: number; y: number; z: number }; rotation: number; }
export interface HomeState { ownerId: PlayerId; objects: HomeObject[]; permissions: Record<string, HomeRole>; revision: number; }
export type RecipeCategory = "tools" | "furniture" | "decorations" | "food" | "potions";
export type CraftingStation = "hands" | "workbench" | "kitchen";
export interface RecipeInput { itemId: string; quantity: number; }
export interface RecipeDefinition { id: string; name: string; category: RecipeCategory; inputs: RecipeInput[]; outputs: RecipeInput[]; station: CraftingStation; durationSeconds: number; }
export type QuestType = "talk" | "reach" | "collect" | "craft" | "discover" | "build" | "find";
export type QuestState = "available" | "active" | "completed" | "locked";
export interface QuestDefinition { id: string; name: string; description: string; type: QuestType; targetId: string; targetQuantity: number; rewardXp: number; rewardItems?: RecipeInput[]; prerequisiteIds?: string[]; }
export interface QuestProgress { questId: string; state: QuestState; progress: number; }
export type NpcState = "idle" | "walk" | "work" | "eat" | "socialize" | "sleep";
export interface NpcDefinition { id: string; name: string; location: WorldId; position: { x: number; y: number; z: number }; dialogue: string[]; quests: string[]; schedule: Array<{ start: number; end: number; state: NpcState }>; }
export type DiscoveryType = "location" | "resource" | "creature" | "recipe" | "portal" | "secret";
export interface DiscoveryDefinition { id: string; name: string; type: DiscoveryType; description: string; }
export type PortalState = "unlocked" | "quest-locked" | "discovery-locked" | "mysterious";
export interface PortalDefinition { id: string; name: string; destination: WorldId; position: { x: number; y: number; z: number }; state: PortalState; requirement?: string; }
export interface ProgressionState { experience: number; level: number; achievements: string[]; discoveredRecipes: string[]; discoveredLocations: string[]; collectibles: string[]; }
export type EmoteId = "wave" | "sit" | "dance" | "clap" | "bow" | "laugh" | "point" | "celebrate" | "sleep";
export interface EmoteDefinition { id: EmoteId; name: string; symbol: string; }
export interface CreatureDefinition { id: string; name: string; color: string; size: number; speed: number; spawn: { x: number; y: number; z: number }[]; }
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

export type ResourceKind = "tree" | "boulder" | "plants" | "herbs" | "fruit" | "crystals" | "fishing";

export interface ResourceNodeDefinition {
  id: string;
  itemId: string;
  name: string;
  kind: ResourceKind;
  position: [number, number, number];
  color: string;
  respawnTimeSeconds: number;
  yieldQuantity: number;
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
  { id: "fruit-tea", name: "Fruit tea", category: "food", stackSize: 20, icon: "☕", rarity: "common" },
  { id: "herb-soup", name: "Herb soup", category: "food", stackSize: 20, icon: "◌", rarity: "common" },
  { id: "forest-stew", name: "Forest stew", category: "food", stackSize: 20, icon: "♨", rarity: "uncommon" },
  { id: "honey-pastry", name: "Honey pastry", category: "food", stackSize: 20, icon: "⌁", rarity: "uncommon" },
  { id: "wooden-hammer", name: "Wooden hammer", category: "tool", stackSize: 1, icon: "⚒", rarity: "common" }
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
  { id: "wall-decoration", name: "Pressed leaves", category: "wall", color: "#8aab6b", footprint: [0.8, 0.15] }
];

export const RECIPE_CATALOG: RecipeDefinition[] = [
  { id: "fruit-tea", name: "Fruit tea", category: "food", inputs: [{ itemId: "fruit", quantity: 2 }, { itemId: "flowers", quantity: 1 }], outputs: [{ itemId: "fruit-tea", quantity: 1 }], station: "kitchen", durationSeconds: 3 },
  { id: "herb-soup", name: "Herb soup", category: "food", inputs: [{ itemId: "herbs", quantity: 2 }, { itemId: "stone", quantity: 1 }], outputs: [{ itemId: "herb-soup", quantity: 1 }], station: "kitchen", durationSeconds: 4 },
  { id: "forest-stew", name: "Forest stew", category: "food", inputs: [{ itemId: "fruit", quantity: 1 }, { itemId: "herbs", quantity: 2 }, { itemId: "fish", quantity: 1 }], outputs: [{ itemId: "forest-stew", quantity: 1 }], station: "kitchen", durationSeconds: 6 },
  { id: "honey-pastry", name: "Honey pastry", category: "food", inputs: [{ itemId: "flowers", quantity: 2 }, { itemId: "fruit", quantity: 1 }], outputs: [{ itemId: "honey-pastry", quantity: 1 }], station: "kitchen", durationSeconds: 5 },
  { id: "wooden-hammer", name: "Wooden hammer", category: "tools", inputs: [{ itemId: "wood", quantity: 5 }, { itemId: "stone", quantity: 2 }], outputs: [{ itemId: "wooden-hammer", quantity: 1 }], station: "workbench", durationSeconds: 3 }
];

export const RESOURCE_NODES: ResourceNodeDefinition[] = [
  { id: "tree-north", itemId: "wood", name: "Ancient Willow Tree", kind: "tree", position: [-11, 0, -8], color: "#79543c", respawnTimeSeconds: 20, yieldQuantity: 2 },
  { id: "tree-west", itemId: "wood", name: "Silver Birch", kind: "tree", position: [-14, 0, 4], color: "#79543c", respawnTimeSeconds: 20, yieldQuantity: 2 },
  { id: "tree-south", itemId: "wood", name: "Moss Oak", kind: "tree", position: [-10, 0, 12], color: "#79543c", respawnTimeSeconds: 20, yieldQuantity: 2 },
  { id: "tree-east", itemId: "wood", name: "River Pine", kind: "tree", position: [14, 0, 7], color: "#79543c", respawnTimeSeconds: 20, yieldQuantity: 2 },
  { id: "boulder-hearth", itemId: "stone", name: "Granite Boulder", kind: "boulder", position: [-10, 0, -2], color: "#8b9690", respawnTimeSeconds: 25, yieldQuantity: 2 },
  { id: "boulder-grove", itemId: "ore", name: "Iron Vein", kind: "boulder", position: [12, 0, -5], color: "#a89078", respawnTimeSeconds: 30, yieldQuantity: 1 },
  { id: "blossom-clearing", itemId: "flowers", name: "Sun Blossoms", kind: "plants", position: [7, 0, 5], color: "#d08c91", respawnTimeSeconds: 15, yieldQuantity: 2 },
  { id: "herb-patch", itemId: "herbs", name: "Forest Herbs", kind: "herbs", position: [9, 0, -1], color: "#7fa26b", respawnTimeSeconds: 15, yieldQuantity: 2 },
  { id: "berry-bush", itemId: "fruit", name: "Wildberry Bush", kind: "fruit", position: [-5, 0, -9], color: "#bd6d5e", respawnTimeSeconds: 15, yieldQuantity: 2 },
  { id: "crystal-shrine", itemId: "crystals", name: "Moon Crystal Cluster", kind: "crystals", position: [11, 0, -8], color: "#9fc5e8", respawnTimeSeconds: 40, yieldQuantity: 1 },
  { id: "river-pier-spot", itemId: "fish", name: "Riverbank Shallows", kind: "fishing", position: [-8, 0, 1], color: "#5d9b9b", respawnTimeSeconds: 25, yieldQuantity: 1 }
];

export const QUEST_CATALOG: QuestDefinition[] = [
  { id: "first-gathering", name: "A handful of beginnings", description: "Gather five pieces of wood from the Lumenfall trees.", type: "collect", targetId: "wood", targetQuantity: 5, rewardXp: 40, rewardItems: [{ itemId: "flowers", quantity: 3 }] },
  { id: "lantern-keeper", name: "The lantern keeper", description: "Find the glowing lantern stone monolith in the clearing.", type: "discover", targetId: "lantern-stone", targetQuantity: 1, rewardXp: 60, rewardItems: [{ itemId: "crystals", quantity: 2 }] },
  { id: "warm-meal", name: "Something warm", description: "Cook a bowl of herb soup at the kitchen station.", type: "craft", targetId: "herb-soup", targetQuantity: 1, rewardXp: 75, rewardItems: [{ itemId: "fruit", quantity: 3 }] },
  { id: "cozy-hearth", name: "Cozy hearth", description: "Place any piece of furniture on your home plot.", type: "build", targetId: "home-object", targetQuantity: 1, rewardXp: 80, rewardItems: [{ itemId: "wood", quantity: 5 }] },
  { id: "moonwood-footfall", name: "Under older branches", description: "Discover the Moonwood trail portal.", type: "discover", targetId: "moonwood", targetQuantity: 1, rewardXp: 120, rewardItems: [{ itemId: "crystals", quantity: 3 }] }
];

export const DISCOVERY_CATALOG: DiscoveryDefinition[] = [
  { id: "lumenfall", name: "Lumenfall Hearth", type: "location", description: "A lantern-lit gathering place where travelers rest." },
  { id: "moonwood", name: "Moonwood Trail", type: "portal", description: "An ancient river path beneath towering glowing branches." },
  { id: "lantern-stone", name: "Lantern Stone Monolith", type: "secret", description: "An ancient runic beacon humming with warm resonant energy." },
  { id: "mysterious-portal", name: "The Quiet Portal", type: "portal", description: "A sealed archway pulsing with enigmatic violet starlight." },
  { id: "moon-crystals", name: "Moon Crystal Grove", type: "resource", description: "Luminescent crystals found clustered near ancient ruins." },
  { id: "riverbank-pier", name: "Riverbank Shallows", type: "location", description: "Calm waters frequented by playful river otters." },
  { id: "homestead-meadow", name: "Homestead Meadow", type: "location", description: "Your private clearing designated for hearth and home building." }
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
      "Once the hearth is warm, the ancient lantern stone will guide your path."
    ],
    quests: ["first-gathering", "cozy-hearth"],
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
      "Beyond the trees lies Moonwood... its portal hums with ancient magic."
    ],
    quests: ["lantern-keeper", "moonwood-footfall"],
    schedule: [{ start: 0, end: 0.45, state: "work" }, { start: 0.45, end: 0.75, state: "eat" }, { start: 0.75, end: 1, state: "idle" }]
  }
];

export const PORTAL_CATALOG: PortalDefinition[] = [
  { id: "moonwood-gate", name: "Moonwood trail", destination: "moonwood", position: { x: -13, y: 0, z: -10 }, state: "unlocked" },
  { id: "mystery-gate", name: "The quiet portal", destination: "mystery", position: { x: 13, y: 0, z: -10 }, state: "mysterious", requirement: "A discovery still has no name." }
];

export const EMOTE_CATALOG: EmoteDefinition[] = [
  { id: "wave", name: "Wave", symbol: "👋" }, { id: "sit", name: "Sit", symbol: "◡" },
  { id: "dance", name: "Dance", symbol: "✧" }, { id: "clap", name: "Clap", symbol: "👏" },
  { id: "bow", name: "Bow", symbol: "⌄" }, { id: "laugh", name: "Laugh", symbol: "☼" },
  { id: "point", name: "Point", symbol: "→" }, { id: "celebrate", name: "Celebrate", symbol: "✦" },
  { id: "sleep", name: "Sleep", symbol: "z" }
];

export const CREATURE_CATALOG: CreatureDefinition[] = [
  { id: "moss-rabbit", name: "Moss rabbit", color: "#b4c68e", size: .28, speed: .7, spawn: [{ x: -8, y: 0, z: 9 }, { x: 8, y: 0, z: 8 }] },
  { id: "river-otter", name: "River otter", color: "#795b4d", size: .34, speed: .45, spawn: [{ x: -8, y: 0, z: 1 }, { x: -9, y: 0, z: 2 }] },
  { id: "lantern-moth", name: "Lantern moth", color: "#e1b96f", size: .12, speed: .9, spawn: [{ x: 4, y: 1.8, z: -3 }, { x: 5, y: 2.1, z: -3 }] },
  { id: "stone-tortoise", name: "Stone tortoise", color: "#7c8881", size: .42, speed: .18, spawn: [{ x: 10, y: 0, z: 10 }] }
];

export const ACHIEVEMENT_CATALOG: AchievementDefinition[] = [
  { id: "first-steps", name: "First steps", description: "Arrive in Lumenfall." },
  { id: "gatherer", name: "A generous handful", description: "Gather your first resource." },
  { id: "maker", name: "Make something", description: "Craft your first recipe." },
  { id: "wayfinder", name: "Wayfinder", description: "Discover a new location." },
  { id: "homestead-builder", name: "Homestead Builder", description: "Place your first piece of furniture." },
  { id: "woodsman", name: "Woodsman", description: "Chop wood from the ancient trees." }
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

