import { createServer, type IncomingMessage } from "node:http";
import { randomBytes, randomUUID } from "node:crypto";
import type { Socket } from "node:net";
import { EMOTE_CATALOG, createDefaultAppearance, type CharacterAppearance, type HomeState, type MovementState, type PlayerId, type PlayerProfile, type PlayerSnapshot, type RealtimeMessage, type SessionDescriptor } from "@afterlight/shared";
import { MemoryPersistenceAdapter, PlayerProfileRepository } from "@afterlight/database";
import { acceptWebSocket, type WebSocketPeer } from "./websocket.js";

const port = Number(process.env.PORT ?? 3001);
const maxPlayers = 8;
const worldId = "lumenfall" as const;
const persistence = new PlayerProfileRepository(new MemoryPersistenceAdapter());
const sessions = new Map<string, Session>();
const playersByConnection = new Map<WebSocketPeer, PlayerRecord>();

interface PlayerRecord {
  id: PlayerId;
  displayName: string;
  appearance: CharacterAppearance;
  session: Session;
  peer: WebSocketPeer | null;
  reconnectToken: string;
  snapshot: PlayerSnapshot;
  disconnectTimer?: NodeJS.Timeout;
}

interface Session {
  descriptor: SessionDescriptor;
  players: Map<PlayerId, PlayerRecord>;
  home?: HomeState;
}

function playerId(): PlayerId {
  return randomUUID() as PlayerId;
}

function inviteCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const bytes = randomBytes(6);
  for (const byte of bytes) code += alphabet[byte % alphabet.length];
  return code;
}

function uniqueInviteCode(): string {
  let code = inviteCode();
  while ([...sessions.values()].some((session) => session.descriptor.inviteCode === code)) code = inviteCode();
  return code;
}

function sanitizeName(name: unknown): string {
  const value = typeof name === "string" ? name.trim().replace(/\s+/g, " ") : "";
  return (value || "Traveler").slice(0, 20);
}

function sanitizeAppearance(value: unknown): CharacterAppearance {
  if (!value || typeof value !== "object") return createDefaultAppearance();
  const candidate = value as Partial<CharacterAppearance>;
  return {
    ...createDefaultAppearance(),
    skinTone: typeof candidate.skinTone === "string" ? candidate.skinTone : createDefaultAppearance().skinTone,
    bodyType: typeof candidate.bodyType === "string" ? candidate.bodyType : createDefaultAppearance().bodyType,
    face: typeof candidate.face === "string" ? candidate.face : createDefaultAppearance().face,
    eyes: typeof candidate.eyes === "string" ? candidate.eyes : createDefaultAppearance().eyes,
    hair: typeof candidate.hair === "string" ? candidate.hair : createDefaultAppearance().hair,
    hairColor: typeof candidate.hairColor === "string" ? candidate.hairColor : createDefaultAppearance().hairColor,
    outfit: typeof candidate.outfit === "string" ? candidate.outfit : createDefaultAppearance().outfit,
    accessories: Array.isArray(candidate.accessories) ? candidate.accessories.filter((item): item is string => typeof item === "string").slice(0, 3) : createDefaultAppearance().accessories
  };
}

function finite(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function snapshot(record: PlayerRecord): PlayerSnapshot {
  return {
    ...record.snapshot,
    appearance: record.appearance,
    displayName: record.displayName,
    connected: record.peer !== null
  };
}

function send(peer: WebSocketPeer | null, message: RealtimeMessage): void {
  peer?.send(JSON.stringify(message));
}

function broadcast(session: Session, message: RealtimeMessage, except?: WebSocketPeer): void {
  for (const player of session.players.values()) {
    if (player.peer && player.peer !== except) send(player.peer, message);
  }
}

function error(peer: WebSocketPeer, requestId: string | undefined, code: "invalid" | "not_found" | "full" | "not_member", message: string): void {
  send(peer, { type: "session.error", requestId, code, message });
}

function createPlayer(session: Session, peer: WebSocketPeer, displayName: unknown, appearance: unknown, reconnectToken?: string): PlayerRecord {
  const id = playerId();
  const index = session.players.size;
  const record: PlayerRecord = {
    id,
    displayName: sanitizeName(displayName),
    appearance: sanitizeAppearance(appearance),
    session,
    peer,
    reconnectToken: reconnectToken ?? randomUUID(),
    snapshot: {
      id,
      displayName: sanitizeName(displayName),
      worldId,
      appearance: sanitizeAppearance(appearance),
      position: { x: index * 1.8 - 3.6, y: 1.2, z: 7 },
      rotation: { y: 0 },
      movement: "idle",
      connected: true
    }
  };
  session.players.set(id, record);
  playersByConnection.set(peer, record);
  return record;
}

function removePlayer(record: PlayerRecord, reason: "left" | "disconnected"): void {
  if (record.disconnectTimer) clearTimeout(record.disconnectTimer);
  record.session.players.delete(record.id);
  if (record.peer) playersByConnection.delete(record.peer);
  broadcast(record.session, { type: "player.left", playerId: record.id, reason });
  if (record.session.players.size === 0) sessions.delete(record.session.descriptor.sessionId);
}

function reconnectPlayer(existing: PlayerRecord, peer: WebSocketPeer, displayName: unknown, appearance: unknown): void {
  if (existing.disconnectTimer) clearTimeout(existing.disconnectTimer);
  existing.peer = peer;
  existing.displayName = sanitizeName(displayName) || existing.displayName;
  existing.appearance = sanitizeAppearance(appearance);
  existing.snapshot = { ...existing.snapshot, displayName: existing.displayName, appearance: existing.appearance, connected: true };
  playersByConnection.set(peer, existing);
}

function handleMessage(peer: WebSocketPeer, raw: string): void {
  if (raw.length > 64_000) {
    peer.close();
    return;
  }
  let message: RealtimeMessage;
  try {
    message = JSON.parse(raw) as RealtimeMessage;
  } catch {
    error(peer, undefined, "invalid", "Message must be valid JSON.");
    return;
  }

  if (message.type === "session.create") {
    if (playersByConnection.has(peer)) {
      error(peer, message.requestId, "invalid", "Leave your current session before creating another.");
      return;
    }
    const descriptor: SessionDescriptor = { sessionId: randomUUID(), inviteCode: uniqueInviteCode(), worldId, maxPlayers, inviteOnly: true };
    const session: Session = { descriptor, players: new Map() };
    sessions.set(descriptor.sessionId, session);
    const player = createPlayer(session, peer, message.displayName, message.appearance);
    send(peer, { type: "session.created", requestId: message.requestId, session: descriptor, self: snapshot(player), players: [...session.players.values()].map(snapshot), home: session.home, reconnectToken: player.reconnectToken });
    return;
  }

  if (message.type === "session.join") {
    if (playersByConnection.has(peer)) {
      error(peer, message.requestId, "invalid", "Leave your current session before joining another.");
      return;
    }
    const session = [...sessions.values()].find((candidate) => candidate.descriptor.inviteCode === message.inviteCode.trim().toUpperCase());
    if (!session) {
      error(peer, message.requestId, "not_found", "That session code is not active.");
      return;
    }
    const existing = message.reconnectToken ? [...session.players.values()].find((candidate) => candidate.reconnectToken === message.reconnectToken) : undefined;
    if (existing) {
      reconnectPlayer(existing, peer, message.displayName, message.appearance);
      send(peer, { type: "session.joined", requestId: message.requestId, session: session.descriptor, self: snapshot(existing), players: [...session.players.values()].map(snapshot), home: session.home, reconnectToken: existing.reconnectToken });
      broadcast(session, { type: "player.updated", player: snapshot(existing) }, peer);
      return;
    }
    if (session.players.size >= session.descriptor.maxPlayers) {
      error(peer, message.requestId, "full", "This private session is full.");
      return;
    }
    const player = createPlayer(session, peer, message.displayName, message.appearance);
    send(peer, { type: "session.joined", requestId: message.requestId, session: session.descriptor, self: snapshot(player), players: [...session.players.values()].map(snapshot), home: session.home, reconnectToken: player.reconnectToken });
    broadcast(session, { type: "player.joined", player: snapshot(player) }, peer);
    return;
  }

  const player = playersByConnection.get(peer);
  if (!player) {
    error(peer, undefined, "not_member", "Create or join a session first.");
    return;
  }
  if (message.type === "session.leave") {
    removePlayer(player, "left");
    peer.close();
    return;
  }
  if (message.type === "player.update") {
    const next = message.player;
    const position = next?.position;
    const rotation = next?.rotation;
    const movement = next?.movement;
    if (!position || !rotation || !["idle", "walking", "sprinting"].includes(movement)) {
      error(peer, undefined, "invalid", "Invalid player state.");
      return;
    }
    player.snapshot = {
      ...player.snapshot,
      position: {
        x: Math.max(-20, Math.min(20, finite(position.x, player.snapshot.position.x))),
        y: Math.max(0, Math.min(8, finite(position.y, player.snapshot.position.y))),
        z: Math.max(-20, Math.min(20, finite(position.z, player.snapshot.position.z)))
      },
      rotation: { y: finite(rotation.y, player.snapshot.rotation.y) },
      movement: movement as MovementState,
      connected: true
    };
    broadcast(player.session, { type: "player.updated", player: snapshot(player) });
    return;
  }
  if (message.type === "home.update") {
    const ownerId = player.session.home?.ownerId ?? player.id;
    const role = player.session.home?.permissions[player.id] ?? (player.id === ownerId ? "owner" : "visitor");
    if (message.state.ownerId !== ownerId || !["owner", "co-owner", "builder", "decorator"].includes(role)) {
      error(peer, undefined, "not_member", "You do not have permission to edit this home.");
      return;
    }
    const objects = message.state.objects.slice(0, 100).map((object) => ({
      id: String(object.id).slice(0, 60),
      furnitureId: String(object.furnitureId).slice(0, 60),
      position: {
        x: Math.max(-20, Math.min(20, finite(object.position?.x, 0))),
        y: Math.max(0, Math.min(8, finite(object.position?.y, 0))),
        z: Math.max(-20, Math.min(20, finite(object.position?.z, 0)))
      },
      rotation: finite(object.rotation, 0)
    }));
    const permissions = player.id === ownerId
      ? { ...(player.session.home?.permissions ?? {}), ...message.state.permissions, [ownerId]: "owner" as const }
      : { ...(player.session.home?.permissions ?? {}), [ownerId]: "owner" as const };
    const home = { ownerId, objects, permissions, revision: (player.session.home?.revision ?? 0) + 1 };
    player.session.home = home;
    void persistence.saveHome(home);
    broadcast(player.session, { type: "home.updated", ownerId: player.id, state: home });
    return;
  }
  if (message.type === "profile.sync") {
    if (message.profile) {
      void persistence.loadProfile(player.id, player.displayName).then((profile) => {
        const merged: PlayerProfile = {
          ...profile,
          ...message.profile,
          id: player.id,
          displayName: player.displayName,
          appearance: player.appearance,
          updatedAt: Date.now()
        };
        void persistence.saveProfile(merged);
        send(peer, { type: "profile.updated", profile: merged });
      });
    }
    return;
  }
  if (message.type === "world.interact") {
    broadcast(player.session, { type: "world.event", eventType: message.interactionType, targetId: message.targetId, playerId: player.id }, peer);
    return;
  }
  if (message.type === "player.emote") {
    if (EMOTE_CATALOG.some((emote) => emote.id === message.emote)) broadcast(player.session, { type: "player.emote", playerId: player.id, emote: message.emote }, peer);
  }
}

function attach(peer: WebSocketPeer): void {
  peer.onMessage((raw) => handleMessage(peer, raw));
  peer.onClose(() => {
    const player = playersByConnection.get(peer);
    if (!player) return;
    playersByConnection.delete(peer);
    if (player.peer !== peer) return;
    player.peer = null;
    player.snapshot = { ...player.snapshot, connected: false, movement: "idle" };
    broadcast(player.session, { type: "player.updated", player: snapshot(player) });
    player.disconnectTimer = setTimeout(() => removePlayer(player, "disconnected"), 30_000);
  });
}

const server = createServer((request, response) => {
  if (request.url === "/health") {
    response.writeHead(200, { "content-type": "application/json", "access-control-allow-origin": process.env.CORS_ORIGIN ?? "*" });
    response.end(JSON.stringify({ ok: true, phase: "multiplayer", sessions: sessions.size }));
    return;
  }
  response.writeHead(200, { "content-type": "text/plain" });
  response.end("Afterlight realtime server");
});

server.on("upgrade", (request: IncomingMessage, socket: Socket) => {
  if (request.url !== "/ws") {
    socket.destroy();
    return;
  }
  const key = request.headers["sec-websocket-key"];
  if (typeof key !== "string") {
    socket.destroy();
    return;
  }
  attach(acceptWebSocket(socket, key));
});

server.listen(port, () => console.log(`Afterlight realtime server listening on port ${port}`));