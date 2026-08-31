export type VoiceStatus = "idle" | "connecting" | "connected" | "muted" | "unavailable";

export interface VoiceTransport {
  readonly status: VoiceStatus;
  connect(sessionId: string): Promise<void>;
  setMuted(muted: boolean): void;
  disconnect(): void;
}

/**
 * Explicit boundary for the future proximity-voice implementation.
 * It fails loudly instead of pretending that browser/mobile audio is live.
 */
export class UnavailableVoiceTransport implements VoiceTransport {
  readonly status = "unavailable" as const;
  async connect(_sessionId: string): Promise<void> {
    throw new Error("Voice transport is not configured for this build.");
  }
  setMuted(_muted: boolean): void {}
  disconnect(): void {}
}