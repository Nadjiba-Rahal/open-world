import type { RealtimeMessage } from "@afterlight/shared";
export interface RealtimeTransport { connect(): Promise<void>; send(message: RealtimeMessage): void; disconnect(): Promise<void>; subscribe(listener: (message: RealtimeMessage) => void): () => void; }
export interface SessionDescriptor { sessionId: string; worldId: string; maxPlayers: number; inviteOnly: boolean; }
