"use client";

import type { PlayerSnapshot, SessionDescriptor } from "@afterlight/shared";
import { useState, type FormEvent } from "react";
import { playSfx } from "../audio/gameAudio";
import type { MultiplayerConnectionStatus } from "./useMultiplayerSession";

interface MultiplayerPanelProps {
  status: MultiplayerConnectionStatus;
  session: SessionDescriptor | null;
  selfId: string | null;
  players: PlayerSnapshot[];
  error: string;
  onCreate: (displayName: string) => void;
  onJoin: (inviteCode: string, displayName: string) => void;
  onLeave: () => void;
}

function statusLabel(status: MultiplayerConnectionStatus): string {
  if (status === "connected") return "Ready";
  if (status === "connecting") return "Connecting…";
  if (status === "error") return "Offline";
  return "Reconnecting…";
}

export function MultiplayerPanel({ status, session, selfId, players, error, onCreate, onJoin, onLeave }: MultiplayerPanelProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const submitCreate = (event: FormEvent) => {
    event.preventDefault();
    playSfx("ui-click");
    onCreate(name.trim() || "Traveler");
  };
  const submitJoin = (event: FormEvent) => {
    event.preventDefault();
    playSfx("ui-click");
    if (code.trim()) onJoin(code, name.trim() || "Traveler");
  };

  return (
    <aside className={`multiplayer ${open ? "is-open" : ""}`}>
      <button className="multiplayer-toggle" type="button" onClick={() => { playSfx("ui-click"); setOpen((value) => !value); }} onMouseEnter={() => playSfx("ui-hover")} aria-expanded={open}>
        <span><i className={`connection-dot ${status}`} />Friends in Lumenfall</span>
        <span aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="multiplayer-body">
        <div className="multiplayer-heading">
          <div><p className="multiplayer-kicker">Private sessions</p><h2>{session ? "Travel together." : "Bring a friend."}</h2></div>
          <span className={`connection-label ${status}`}>{statusLabel(status)}</span>
        </div>
        {session ? (
          <>
            <div className="invite-code"><span>Invite code</span><strong>{session.inviteCode}</strong></div>
            <p className="multiplayer-copy">Share this code with up to {session.maxPlayers - 1} friends. Everyone enters the same Lumenfall.</p>
            <div className="player-list">
              {players.map((player) => <div className="player-row" key={player.id}><span className={`player-dot ${player.connected ? "online" : "away"}`} /><span>{player.displayName}{player.id === selfId ? " (you)" : ""}</span><small>{player.connected ? "here" : "reconnecting"}</small></div>)}
            </div>
            <button type="button" className="leave-action" onClick={() => { playSfx("ui-click"); onLeave(); }}>Leave session</button>
          </>
        ) : (
          <>
            <p className="multiplayer-copy">Open a small invite-only room, or step into one with a friend.</p>
            <label className="multiplayer-field"><span>Your name</span><input value={name} maxLength={20} placeholder="Traveler" onChange={(event) => setName(event.target.value)} /></label>
            <div className="multiplayer-actions">
              <form onSubmit={submitCreate}><button type="submit" className="primary-action" disabled={status !== "connected"}>Create room</button></form>
              <form onSubmit={submitJoin}><input className="code-input" value={code} maxLength={6} placeholder="CODE" aria-label="Invite code" onChange={(event) => setCode(event.target.value.toUpperCase())} /><button type="submit" className="secondary-action" disabled={status !== "connected" || code.trim().length < 4}>Join</button></form>
            </div>
          </>
        )}
        {error && <p className="multiplayer-error" role="alert">{error}</p>}
      </div>}
    </aside>
  );
}