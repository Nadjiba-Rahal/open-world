export interface WorldDefinition { id: "lumenfall" | "moonwood" | "player-home" | "mystery"; name: string; seed: number; status: "available" | "locked"; }
export function createWorldDefinition(seed: number): WorldDefinition[] { return [
  { id: "lumenfall", name: "Lumenfall", seed, status: "available" },
  { id: "moonwood", name: "Moonwood", seed: seed + 1, status: "available" },
  { id: "player-home", name: "Player Home", seed: seed + 2, status: "available" },
  { id: "mystery", name: "The Locked Beyond", seed: seed + 3, status: "locked" }
]; }
