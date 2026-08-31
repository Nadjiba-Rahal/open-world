"use client";

import { WebSocketRealtimeTransport, type TransportStatus } from "@afterlight/networking";
import type { CharacterAppearance, EmoteId, HomeState, PlayerSnapshot, RealtimeMessage, SessionDescriptor } from "@afterlight/shared";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type MultiplayerConnectionStatus = TransportStatus | "error";

export interface MultiplayerSessionState {
  status: MultiplayerConnectionStatus;
  session: SessionDescriptor | null;
  selfId: string | null;
  players: PlayerSnapshot[];
  home: HomeState | null;
  emotes: Record<string, EmoteId>;
  error: string;
  updatePlayer: (update: Pick<PlayerSnapshot, "position" | "rotation" | "movement">) => void;
  updateHome: (state: HomeState) => void;
  sendEmote: (emote: EmoteId) => void;
  createSession: (displayName: string) => void;
  joinSession: (inviteCode: string, displayName: string) => void;
  leaveSession: () => void;
}

function realtimeUrl(): string {
  const configured = process.env.NEXT_PUBLIC_REALTIME_URL;
  if (configured) return configured;
  if (typeof window === "undefined") return "ws://localhost:3001/ws";
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.hostname}:3001/ws`;
}

function requestId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useMultiplayerSession(appearance: CharacterAppearance): MultiplayerSessionState {
  const transport = useMemo(() => new WebSocketRealtimeTransport(realtimeUrl()), []);
  const [status, setStatus] = useState<MultiplayerConnectionStatus>("connecting");
  const [session, setSession] = useState<SessionDescriptor | null>(null);
  const [selfId, setSelfId] = useState<string | null>(null);
  const [playersById, setPlayersById] = useState<Record<string, PlayerSnapshot>>({});
  const [home, setHome] = useState<HomeState | null>(null);
  const [emotes, setEmotes] = useState<Record<string, EmoteId>>({});
  const [error, setError] = useState("");
  const statusRef = useRef(status);
  const appearanceRef = useRef(appearance);
  const sessionIntent = useRef<{ inviteCode: string; displayName: string; reconnectToken: string } | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaving = useRef(false);

  useEffect(() => {
    appearanceRef.current = appearance;
  }, [appearance]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    const replacePlayers = (players: PlayerSnapshot[]) => {
      setPlayersById(Object.fromEntries(players.map((player) => [player.id, player])));
    };
    const handleMessage = (message: RealtimeMessage) => {
      if (message.type === "session.created" || message.type === "session.joined") {
        setSession(message.session);
        setSelfId(message.self.id);
        replacePlayers(message.players);
        setHome(message.home ?? null);
        sessionIntent.current = {
          inviteCode: message.session.inviteCode,
          displayName: message.self.displayName,
          reconnectToken: message.reconnectToken
        };
        if (typeof window !== "undefined") window.sessionStorage.setItem("afterlight.session", JSON.stringify(sessionIntent.current));
        setError("");
        return;
      }
      if (message.type === "player.joined" || message.type === "player.updated") {
        setPlayersById((current) => ({ ...current, [message.player.id]: message.player }));
        return;
      }
      if (message.type === "player.left") {
        setPlayersById((current) => {
          const next = { ...current };
          delete next[message.playerId];
          return next;
        });
        return;
      }
      if (message.type === "home.updated") {
        setHome(message.state);
        return;
      }
      if (message.type === "player.emote") {
        setEmotes((current) => ({ ...current, [message.playerId]: message.emote as EmoteId }));
        return;
      }
      if (message.type === "session.error") {
        setError(message.message);
      }
    };
    const handleStatus = (next: TransportStatus) => {
      setStatus(next);
      statusRef.current = next;
      if (next === "connected") {
        const intent = sessionIntent.current;
        if (intent && !leaving.current) {
          transport.send({
            type: "session.join",
            requestId: requestId(),
            inviteCode: intent.inviteCode,
            displayName: intent.displayName,
            appearance: appearanceRef.current,
            reconnectToken: intent.reconnectToken
          });
        }
      } else if (next === "disconnected" && sessionIntent.current && !leaving.current) {
        if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
        reconnectTimer.current = setTimeout(() => {
          void transport.connect().catch(() => setStatus("error"));
        }, 1200);
      }
    };
    const unsubscribeMessages = transport.subscribe(handleMessage);
    const unsubscribeStatus = transport.subscribeStatus(handleStatus);
    void transport.connect().catch(() => setStatus("error"));
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      leaving.current = true;
      unsubscribeMessages();
      unsubscribeStatus();
      void transport.disconnect();
    };
  }, [transport]);

  const connectIfNeeded = useCallback(() => {
    if (statusRef.current !== "connected") void transport.connect().catch(() => setStatus("error"));
  }, [transport]);

  const createSession = useCallback((displayName: string) => {
    leaving.current = false;
    setError("");
    connectIfNeeded();
    transport.send({ type: "session.create", requestId: requestId(), displayName, appearance: appearanceRef.current });
  }, [connectIfNeeded, transport]);

  const joinSession = useCallback((inviteCode: string, displayName: string) => {
    leaving.current = false;
    setError("");
    connectIfNeeded();
    transport.send({
      type: "session.join",
      requestId: requestId(),
      inviteCode: inviteCode.trim().toUpperCase(),
      displayName,
      appearance: appearanceRef.current
    });
  }, [connectIfNeeded, transport]);

  const leaveSession = useCallback(() => {
    leaving.current = true;
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    if (session) transport.send({ type: "session.leave", requestId: requestId() });
    sessionIntent.current = null;
    if (typeof window !== "undefined") window.sessionStorage.removeItem("afterlight.session");
    setSession(null);
    setSelfId(null);
    setPlayersById({});
    setHome(null);
    setEmotes({});
    setError("");
    void transport.disconnect();
  }, [session, transport]);

  const updatePlayer = useCallback((update: Pick<PlayerSnapshot, "position" | "rotation" | "movement">) => {
    if (session && statusRef.current === "connected") transport.send({ type: "player.update", player: update });
  }, [session, transport]);

  const updateHome = useCallback((state: HomeState) => {
    if (session && statusRef.current === "connected") transport.send({ type: "home.update", state });
  }, [session, transport]);

  const sendEmote = useCallback((emote: EmoteId) => {
    if (selfId) setEmotes((current) => ({ ...current, [selfId]: emote }));
    if (session && statusRef.current === "connected") transport.send({ type: "player.emote", playerId: (selfId ?? "") as PlayerSnapshot["id"], emote });
  }, [selfId, session, transport]);

  return {
    status,
    session,
    selfId,
    players: Object.values(playersById),
    home,
    emotes,
    error,
    updatePlayer,
    updateHome,
    sendEmote,
    createSession,
    joinSession,
    leaveSession
  };
}