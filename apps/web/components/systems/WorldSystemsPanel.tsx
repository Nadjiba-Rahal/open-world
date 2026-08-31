"use client";

import { DISCOVERY_CATALOG, EMOTE_CATALOG, FURNITURE_CATALOG, ITEM_CATALOG, QUEST_CATALOG, RECIPE_CATALOG, type EmoteId, type HomeRole, type PlayerSnapshot } from "@afterlight/shared";
import { useState } from "react";
import { playSfx } from "../audio/gameAudio";

type SystemsTab = "pack" | "craft" | "quests" | "home" | "journal" | "social";
interface WorldSystemsPanelProps {
  systems: ReturnType<typeof import("./useWorldSystems").useWorldSystems>;
  players: PlayerSnapshot[];
  onDiscoverMoonwood: () => void;
  emotes: Record<string, EmoteId>;
  onEmote: (emote: EmoteId) => void;
}

export function WorldSystemsPanel({ systems, players, onDiscoverMoonwood, emotes, onEmote }: WorldSystemsPanelProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<SystemsTab>("pack");
  const [homeMode, setHomeMode] = useState(false);
  const roles: HomeRole[] = ["visitor", "decorator", "builder", "co-owner"];

  return (
    <aside className={`systems ${open ? "is-open" : ""}`}>
      <button className="systems-toggle" type="button" onClick={() => { playSfx("ui-click"); setOpen((value) => !value); }} onMouseEnter={() => playSfx("ui-hover")} aria-expanded={open}>
        <span><i className="systems-spark" />Field journal</span><span aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="systems-body">
        <div className="systems-tabs">
          {(["pack", "craft", "quests", "home", "journal", "social"] as SystemsTab[]).map((item) => <button type="button" className={tab === item ? "active" : ""} key={item} onClick={() => { playSfx("ui-click"); setTab(item); }}>{item}</button>)}
        </div>
        {tab === "pack" && <section className="systems-section">
          <div className="systems-title"><span>Pack</span><small>Level {systems.progression.level} · {systems.progression.experience} xp</small></div>
          <div className="resource-grid">
            {ITEM_CATALOG.filter((item) => item.category === "resource").map((item) => <button type="button" key={item.id} onClick={() => { playSfx("reward"); systems.gather(item.id); }}><b>{item.icon}</b><span>{item.name}</span><strong>{systems.itemQuantity(item.id)}</strong></button>)}
          </div>
          <p className="systems-hint">Survey a resource to gather one. Completed threads pay their listed rewards.</p>
        </section>}
        {tab === "craft" && <section className="systems-section">
          <div className="systems-title"><span>Recipes</span><small>Kitchen & workbench</small></div>
          <div className="recipe-list">{RECIPE_CATALOG.map((recipe) => <div className="recipe-row" key={recipe.id}><div><b>{recipe.name}</b><small>{recipe.inputs.map((input) => `${input.quantity} ${ITEM_CATALOG.find((item) => item.id === input.itemId)?.name ?? input.itemId}`).join(" · ")}</small></div><button type="button" onClick={() => systems.craftRecipe(recipe.id)}>Craft</button></div>)}</div>
        </section>}
        {tab === "quests" && <section className="systems-section">
          <div className="systems-title"><span>Threads</span><small>{systems.quests.filter((quest) => quest.state === "completed").length}/{systems.quests.length} complete</small></div>
          <div className="quest-list">{QUEST_CATALOG.map((quest) => { const progress = systems.quests.find((entry) => entry.questId === quest.id); return <div className={`quest-row ${progress?.state ?? ""}`} key={quest.id}><div><b>{quest.name}</b><small>{quest.description}</small></div><span>{progress?.state === "completed" ? "done" : `${progress?.progress ?? 0}/${quest.targetQuantity}`}</span></div>; })}</div>
        </section>}
        {tab === "home" && <section className="systems-section">
          <div className="systems-title"><span>Home studio</span><small>{systems.role}</small></div>
          <p className="systems-hint">Place, move, rotate, and remove furniture. Changes are saved locally and shared with the private session.</p>
          <button type="button" className="primary-action home-enter" onClick={() => { playSfx("ui-click"); setHomeMode((value) => !value); }}>{homeMode ? "Close build mode" : "Enter home"}</button>
          {homeMode && <><div className="furniture-grid">{FURNITURE_CATALOG.map((item) => <button type="button" key={item.id} disabled={!systems.canDecorate} onClick={() => systems.placeFurniture(item.id)}>{item.name}</button>)}</div><div className="home-objects">{systems.home.objects.map((object) => <div className="home-object-row" key={object.id}><span>{FURNITURE_CATALOG.find((item) => item.id === object.furnitureId)?.name ?? object.furnitureId}</span><button type="button" onClick={() => systems.moveFurniture(object.id, .5, 0)}>＋</button><button type="button" onClick={() => systems.rotateFurniture(object.id)}>↻</button><button type="button" onClick={() => systems.deleteFurniture(object.id)}>×</button></div>)}</div><div className="home-actions"><button type="button" onClick={systems.saveHome}>Save home</button><button type="button" onClick={systems.loadHome}>Load saved</button></div></>}
          {players.filter((player) => player.id !== systems.home.ownerId).length > 0 && <div className="permission-list">{players.filter((player) => player.id !== systems.home.ownerId).map((player) => <label key={player.id}><span>{player.displayName}</span><select value={systems.home.permissions[player.id] ?? "visitor"} onChange={(event) => systems.setHomePermission(player.id, event.target.value as HomeRole)}>{roles.map((role) => <option value={role} key={role}>{role}</option>)}</select></label>)}</div>}
        </section>}
        {tab === "journal" && <section className="systems-section">
          <div className="systems-title"><span>Discoveries</span><small>{systems.progression.discoveredLocations.length}/{DISCOVERY_CATALOG.length} found</small></div>
          <div className="discovery-list">{DISCOVERY_CATALOG.map((entry) => <div className={`discovery-row ${systems.progression.discoveredLocations.includes(entry.id) ? "found" : ""}`} key={entry.id}><span>{systems.progression.discoveredLocations.includes(entry.id) ? "✦" : "·"}</span><div><b>{entry.name}</b><small>{entry.description}</small></div></div>)}</div>
          <button type="button" className="secondary-action journal-action" onClick={() => { playSfx("ui-click"); onDiscoverMoonwood(); }}>Survey Moonwood trail</button>
        </section>}
        {tab === "social" && <section className="systems-section">
          <div className="systems-title"><span>Campfire</span><small>{players.length} traveler{players.length === 1 ? "" : "s"}</small></div>
          <div className="emote-grid">{EMOTE_CATALOG.map((emote) => <button type="button" key={emote.id} onClick={() => { playSfx("emote"); onEmote(emote.id); }}><b>{emote.symbol}</b><span>{emote.name}</span></button>)}</div>
          <div className="presence-list">{players.map((player) => <div className="presence-row" key={player.id}><span><i className={player.connected ? "presence-dot online" : "presence-dot"} />{player.displayName}</span><small>{emotes[player.id] ? `${EMOTE_CATALOG.find((entry) => entry.id === emotes[player.id])?.name ?? "Emote"} · ` : ""}{player.connected ? "nearby" : "away"}</small></div>)}</div>
        </section>}
      </div>}
    </aside>
  );
}