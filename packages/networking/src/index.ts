import type { RealtimeMessage, SessionDescriptor } from "@afterlight/shared";
export type { SessionDescriptor } from "@afterlight/shared";

export type TransportStatus = "connecting" | "connected" | "disconnected";
export interface RealtimeTransport {
  connect(): Promise<void>;
  send(message: RealtimeMessage): void;
  disconnect(): Promise<void>;
  subscribe(listener: (message: RealtimeMessage) => void): () => void;
  subscribeStatus(listener: (status: TransportStatus) => void): () => void;
}

/**
 * Browser transport for the standalone realtime server. The game only depends
 * on RealtimeTransport, so a hosted WebSocket provider can replace this later.
 */
export class WebSocketRealtimeTransport implements RealtimeTransport {
  private socket: WebSocket | null = null;
  private readonly messageListeners = new Set<(message: RealtimeMessage) => void>();
  private readonly statusListeners = new Set<(status: TransportStatus) => void>();
  private pending: RealtimeMessage[] = [];
  private disconnectRequested = false;

  constructor(private readonly url: string) {}

  connect(): Promise<void> {
    this.disconnectRequested = false;
    if (this.socket?.readyState === WebSocket.OPEN) return Promise.resolve();
    this.emitStatus("connecting");
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(this.url);
      this.socket = socket;
      const onOpen = () => {
        socket.removeEventListener("error", onError);
        this.emitStatus("connected");
        for (const message of this.pending.splice(0)) socket.send(JSON.stringify(message));
        resolve();
      };
      const onError = () => {
        socket.removeEventListener("open", onOpen);
        this.emitStatus("disconnected");
        reject(new Error("Unable to connect to the Afterlight realtime server"));
      };
      socket.addEventListener("open", onOpen, { once: true });
      socket.addEventListener("error", onError, { once: true });
      socket.addEventListener("message", (event) => {
        try {
          const message = JSON.parse(String(event.data)) as RealtimeMessage;
          for (const listener of this.messageListeners) listener(message);
        } catch {
          // Ignore malformed frames; the server remains the source of truth.
        }
      });
      socket.addEventListener("close", () => {
        if (this.socket === socket) this.socket = null;
        if (!this.disconnectRequested) this.emitStatus("disconnected");
      });
    });
  }

  send(message: RealtimeMessage): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else if (!this.disconnectRequested) {
      this.pending.push(message);
    }
  }

  disconnect(): Promise<void> {
    this.disconnectRequested = true;
    this.pending = [];
    const socket = this.socket;
    if (!socket || socket.readyState === WebSocket.CLOSED) {
      this.emitStatus("disconnected");
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      socket.addEventListener("close", () => {
        this.socket = null;
        this.emitStatus("disconnected");
        resolve();
      }, { once: true });
      socket.close();
    });
  }

  subscribe(listener: (message: RealtimeMessage) => void): () => void {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  subscribeStatus(listener: (status: TransportStatus) => void): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  private emitStatus(status: TransportStatus): void {
    for (const listener of this.statusListeners) listener(status);
  }
}
