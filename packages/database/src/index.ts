import type { HomeState, PlayerId, PlayerProfile } from "@afterlight/shared";
import { createDefaultProfile } from "@afterlight/shared";

export interface PersistenceAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
}

export class MemoryPersistenceAdapter implements PersistenceAdapter {
  private readonly values = new Map<string, unknown>();
  async get<T>(key: string): Promise<T | null> {
    return (this.values.get(key) as T | undefined) ?? null;
  }
  async set<T>(key: string, value: T): Promise<void> {
    this.values.set(key, value);
  }
  async delete(key: string): Promise<void> {
    this.values.delete(key);
  }
}

export class LocalStoragePersistenceAdapter implements PersistenceAdapter {
  constructor(private readonly prefix = "afterlight.") {}

  async get<T>(key: string): Promise<T | null> {
    if (typeof window === "undefined" || !window.localStorage) return null;
    try {
      const item = window.localStorage.getItem(this.prefix + key);
      return item ? (JSON.parse(item) as T) : null;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (typeof window === "undefined" || !window.localStorage) return;
    try {
      window.localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch {
      // Ignore quota issues
    }
  }

  async delete(key: string): Promise<void> {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.removeItem(this.prefix + key);
  }
}

export class PlayerProfileRepository {
  constructor(private readonly adapter: PersistenceAdapter) {}

  async loadProfile(id: PlayerId, displayName = "Traveler"): Promise<PlayerProfile> {
    const key = `profile:${id}`;
    const saved = await this.adapter.get<PlayerProfile>(key);
    if (saved) return saved;
    const defaultProfile = createDefaultProfile(id, displayName);
    await this.adapter.set(key, defaultProfile);
    return defaultProfile;
  }

  async saveProfile(profile: PlayerProfile): Promise<void> {
    profile.updatedAt = Date.now();
    await this.adapter.set(`profile:${profile.id}`, profile);
  }

  async loadHome(ownerId: PlayerId): Promise<HomeState | null> {
    return this.adapter.get<HomeState>(`home:${ownerId}`);
  }

  async saveHome(home: HomeState): Promise<void> {
    await this.adapter.set(`home:${home.ownerId}`, home);
  }
}

