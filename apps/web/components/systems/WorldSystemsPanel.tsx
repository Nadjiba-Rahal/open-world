"use client";

import { DISCOVERY_CATALOG, FURNITURE_CATALOG, ITEM_CATALOG, QUEST_CATALOG, RECIPE_CATALOG, type HomeRole, type PlayerSnapshot } from "@afterlight/shared";
import { useState } from "react";

type SystemsTab = "pack" | "craft" | "quests" | "home" | "journal";
interface WorldSystemsPanelProps {
  systems: ReturnType<typeof import("./useWorldSystems").useWorldSystems>;
  players: PlayerSnapshot[];
  onDiscoverMoonwood: () => void;
}

export function WorldSystemsPanel({ systems, players, onDiscoverMoonwood }: WorldSystemsPanelProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<SystemsTab>("pack");
  const [homeMode, setHomeMode] = useState(false);
  const roles: HomeRole[] = ["visitor", "decorator", "builder", "co-owner"];

  return (
    <aside className={`systems ${open ? "is-open" : ""}`}>
      <button className="systems-toggle" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span><i className="systems-spark" />Field journal</span><span aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="systems-body">
        <div className="systems-tabs">
          {(["pack", "craft", "quests", "home", "journal"] as SystemsTab[]).map((item) => <button type="button" className={tab === item ? "active" : ""} key={item} onClick={() => setTab(item)}>{item}</button>)}
        </div>
        {tab === "pack" && <section className="systems-section">
          <div className="systems-title"><span>Pack</span><small>Level {systems.progression.level} · {systems.progression.experience} xp</small></div>
          <div className="resource-grid">
            {ITEM_CATALOG.filter((item) => item.category === "resource").map((item) => <button type="button" key={item.id} onClick={() => systems.gather(item.id)}><b>{item.icon}</b><span>{item.name}</span><strong>{systems.itemQuantity(item.id)}</strong></button>)}
          </div>
          <p className="systems-hint">Survey a resource to gather one. The catalog controls stacking and rarity.</p>
        </section>}
        {tab === "craft" && <section className="systems-section">
          <div className="systems-title"><span>Recipes</span><small>Kitchen & workbench</small></div>
          <div className="recipe-list">{RECIPE_CATALOG.map((recipe) => <div className="recipe-row" key={recipe.id}><div><b>{recipe.name}</b><small>{recipe.inputs.map((input) => `${input.quantity} ${ITEM_CATALOG.find((item) => item.id === input.itemId)?.name ?? input.itemId}`).join(" · ")}</small></div><button type="button" onClick={() => systems.craftRecipe(recipe.id)}>Craft</button></div>)}</div>
        </section>}
        {tab === "quests" && <section className="systems-section">
          <div className="systems-title"><span>Threads</span><small>{systems.quests.filter((quest) => quest.state === "completed").length}/{systems.quests.length} complete</small></div>
          <div className="quest-list">{QUEST_CATALOG.map((quest) => { const progress = systems.quests.find((entry) => entry.questId === quest.id); return <div className={`quest-row ${progress?.state ?? ""}`} key={quest.id}><div><b>{quest.name}</b><small>{quest.description}</small></div><span>{progress?.progress ?? 0}/{quest.targetQuantity}</span></div>; })}</div>
        </section>}
        {tab === "home" && <section className="systems-section">
          <div className="systems-title"><span>Home studio</span><small>{systems.role}</small></div>
          <p className="systems-hint">Place, move, rotate, and remove furniture. Changes are saved locally and shared with the private session.</p>
          <button type="button" className="primary-action home-enter" onClick={() => setHomeMode((value) => !value)}>{homeMode ? "Close build mode" : "Enter home"}</button>
          {homeMode && <><div className="furniture-grid">{FURNITURE_CATALOG.map((item) => <button type="button" key={item.id} disabled={!systems.canDecorate} onClick={() => systems.placeFurniture(item.id)}>{item.name}</button>)}</div><div className="home-objects">{systems.home.objects.map((object) => <div className="home-object-row" key={object.id}><span>{FURNITURE_CATALOG.find((item) => item.id === object.furnitureId)?.name ?? object.furnitureId}</span><button type="button" onClick={() => systems.moveFurniture(object.id, .5, 0)}>＋</button><button type="button" onClick={() => systems.rotateFurniture(object.id)}>↻</button><button type="button" onClick={() => systems.deleteFurniture(object.id)}>×</button></div>)}</div><div className="home-actions"><button type="button" onClick={systems.saveHome}>Save home</button><button type="button" onClick={systems.loadHome}>Load saved</button></div></>}
          {players.filter((player) => player.id !== systems.home.ownerId).length > 0 && <div className="permission-list">{players.filter((player) => player.id !== systems.home.ownerId).map((player) => <label key={player.id}><span>{player.displayName}</span><select value={systems.home.permissions[player.id] ?? "visitor"} onChange={(event) => systems.setHomePermission(player.id, event.target.value as HomeRole)}>{roles.map((role) => <option value={role} key={role}>{role}</option>)}</select></label>)}</div>}
        </section>}
        {tab === "journal" && <section className="systems-section">
          <div className="systems-title"><span>Discoveries</span><small>{systems.progression.discoveredLocations.length}/{DISCOVERY_CATALOG.length} found</small></div>
          <div className="discovery-list">{DISCOVERY_CATALOG.map((entry) => <div className={`discovery-row ${systems.progression.discoveredLocations.includes(entry.id) ? "found" : ""}`} key={entry.id}><span>{systems.progression.discoveredLocations.includes(entry.id) ? "✦" : "·"}</span><div><b>{entry.name}</b><small>{entry.description}</small></div></div>)}</div>
          <button type="button" className="secondary-action journal-action" onClick={onDiscoverMoonwood}>Survey Moonwood trail</button>
        </section>}
      </div>}
    </aside>
  );
}