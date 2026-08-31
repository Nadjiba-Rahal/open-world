import type { InventorySlot, ItemDefinition, NpcDefinition, NpcState, PlayerId, ProgressionState, QuestDefinition, QuestProgress, RecipeDefinition } from "@afterlight/shared";

export interface GameClock { elapsedSeconds: number; dayProgress: number; }
export function createGameClock(nowMs: number, dayLengthMs = 1_200_000): GameClock { return { elapsedSeconds: nowMs / 1000, dayProgress: (nowMs % dayLengthMs) / dayLengthMs }; }
export function deterministicSeed(input: string): number { let hash = 2166136261; for (let index = 0; index < input.length; index += 1) { hash ^= input.charCodeAt(index); hash = Math.imul(hash, 16777619); } return hash >>> 0; }

export function itemQuantity(inventory: InventorySlot[], itemId: string): number {
  return inventory.filter((slot) => slot.itemId === itemId).reduce((total, slot) => total + slot.quantity, 0);
}

export function addItems(inventory: InventorySlot[], additions: InventorySlot[], catalog: ItemDefinition[]): InventorySlot[] {
  const result = inventory.map((slot) => ({ ...slot }));
  for (const addition of additions) {
    const definition = catalog.find((item) => item.id === addition.itemId);
    if (!definition || addition.quantity <= 0) continue;
    let remaining = addition.quantity;
    for (const slot of result.filter((candidate) => candidate.itemId === addition.itemId && candidate.quantity < definition.stackSize)) {
      const amount = Math.min(remaining, definition.stackSize - slot.quantity);
      slot.quantity += amount;
      remaining -= amount;
      if (remaining === 0) break;
    }
    while (remaining > 0) {
      const amount = Math.min(remaining, definition.stackSize);
      result.push({ itemId: addition.itemId, quantity: amount });
      remaining -= amount;
    }
  }
  return result;
}

export function removeItems(inventory: InventorySlot[], removals: InventorySlot[]): InventorySlot[] | null {
  if (removals.some((item) => itemQuantity(inventory, item.itemId) < item.quantity)) return null;
  const result = inventory.map((slot) => ({ ...slot }));
  for (const removal of removals) {
    let remaining = removal.quantity;
    for (const slot of result.filter((candidate) => candidate.itemId === removal.itemId)) {
      const amount = Math.min(remaining, slot.quantity);
      slot.quantity -= amount;
      remaining -= amount;
      if (remaining === 0) break;
    }
  }
  return result.filter((slot) => slot.quantity > 0);
}

export function sortInventory(inventory: InventorySlot[], catalog: ItemDefinition[]): InventorySlot[] {
  return [...inventory].sort((a, b) => {
    const categoryA = catalog.find((item) => item.id === a.itemId)?.category ?? "";
    const categoryB = catalog.find((item) => item.id === b.itemId)?.category ?? "";
    return `${categoryA}-${a.itemId}`.localeCompare(`${categoryB}-${b.itemId}`);
  });
}

export function craft(inventory: InventorySlot[], recipe: RecipeDefinition, catalog: ItemDefinition[]): InventorySlot[] | null {
  const remaining = removeItems(inventory, recipe.inputs);
  return remaining ? addItems(remaining, recipe.outputs, catalog) : null;
}

export function applyQuestProgress(progress: QuestProgress[], quest: QuestDefinition, amount = 1): QuestProgress[] {
  return progress.map((entry) => entry.questId !== quest.id || entry.state === "completed"
    ? entry
    : { ...entry, state: entry.state === "available" ? "active" : entry.state, progress: Math.min(quest.targetQuantity, entry.progress + amount) });
}

export function completeQuest(progress: QuestProgress[], quest: QuestDefinition): QuestProgress[] {
  return progress.map((entry) => entry.questId === quest.id && entry.progress >= quest.targetQuantity ? { ...entry, state: "completed" } : entry);
}

export function grantExperience(state: ProgressionState, amount: number): ProgressionState {
  const experience = Math.max(0, state.experience + amount);
  return { ...state, experience, level: Math.max(1, Math.floor(experience / 100) + 1) };
}

export function unlockAchievement(state: ProgressionState, achievementId: string): ProgressionState {
  if (state.achievements.includes(achievementId)) return state;
  return grantExperience({ ...state, achievements: [...state.achievements, achievementId] }, 25);
}

export function distance3D(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function formatTimeOfDay(dayProgress: number): { timeString: string; isDay: boolean; phase: "dawn" | "day" | "dusk" | "night" } {
  const hours = Math.floor(dayProgress * 24);
  const minutes = Math.floor((dayProgress * 24 - hours) * 60);
  const formattedHours = hours.toString().padStart(2, "0");
  const formattedMinutes = minutes.toString().padStart(2, "0");
  let phase: "dawn" | "day" | "dusk" | "night" = "day";
  if (hours >= 5 && hours < 8) phase = "dawn";
  else if (hours >= 8 && hours < 18) phase = "day";
  else if (hours >= 18 && hours < 21) phase = "dusk";
  else phase = "night";
  const isDay = phase === "dawn" || phase === "day";
  return { timeString: `${formattedHours}:${formattedMinutes}`, isDay, phase };
}

export function canBuild(role: string): boolean { return role === "owner" || role === "co-owner" || role === "builder"; }
export function canDecorate(role: string): boolean { return canBuild(role) || role === "decorator"; }
export function playerKey(playerId: PlayerId): string { return playerId; }

export function npcStateAt(npc: NpcDefinition, dayProgress: number): NpcState {
  const normalized = ((dayProgress % 1) + 1) % 1;
  return npc.schedule.find((entry) => normalized >= entry.start && normalized < entry.end)?.state ?? "idle";
}


