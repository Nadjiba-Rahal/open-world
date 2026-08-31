export interface GameClock { elapsedSeconds: number; dayProgress: number; }
export function createGameClock(nowMs: number, dayLengthMs = 1_200_000): GameClock { return { elapsedSeconds: nowMs / 1000, dayProgress: (nowMs % dayLengthMs) / dayLengthMs }; }
export function deterministicSeed(input: string): number { let hash = 2166136261; for (let index = 0; index < input.length; index += 1) { hash ^= input.charCodeAt(index); hash = Math.imul(hash, 16777619); } return hash >>> 0; }
