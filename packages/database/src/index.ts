export interface PersistenceAdapter { get<T>(key: string): Promise<T | null>; set<T>(key: string, value: T): Promise<void>; delete(key: string): Promise<void>; }
export class MemoryPersistenceAdapter implements PersistenceAdapter {
  private readonly values = new Map<string, unknown>();
  async get<T>(key: string): Promise<T | null> { return (this.values.get(key) as T | undefined) ?? null; }
  async set<T>(key: string, value: T): Promise<void> { this.values.set(key, value); }
  async delete(key: string): Promise<void> { this.values.delete(key); }
}
