"use client";

import { addItems, applyQuestProgress, canBuild, canDecorate, craft, grantExperience, itemQuantity } from "@afterlight/game-core";
import { createDefaultHome, createDefaultProgression, FURNITURE_CATALOG, ITEM_CATALOG, QUEST_CATALOG, RECIPE_CATALOG, type HomeObject, type HomeRole, type HomeState, type InventorySlot, type PlayerId, type ProgressionState, type QuestProgress } from "@afterlight/shared";
import { useCallback, useEffect, useRef, useState } from "react";

interface WorldSystemsOptions {
  ownerId: PlayerId;
  remoteHome: HomeState | null;
  onHomeChange: (home: HomeState) => void;
}

export function useWorldSystems({ ownerId, remoteHome, onHomeChange }: WorldSystemsOptions) {
  const [inventory, setInventory] = useState<InventorySlot[]>([]);
  const [progression, setProgression] = useState<ProgressionState>(() => createDefaultProgression());
  const [quests, setQuests] = useState<QuestProgress[]>(() => QUEST_CATALOG.map((quest) => ({ questId: quest.id, state: "available", progress: 0 })));
  const [home, setHome] = useState<HomeState>(() => createDefaultHome(ownerId));
  const hydrated = useRef(false);

  useEffect(() => {
    const load = <T,>(key: string, fallback: T): T => {
      const stored = window.localStorage.getItem(key);
      if (!stored) return fallback;
      try { return JSON.parse(stored) as T; } catch { return fallback; }
    };
    setInventory(load("afterlight.inventory", []));
    setProgression(load("afterlight.progression", createDefaultProgression()));
    setQuests(load("afterlight.quests", QUEST_CATALOG.map((quest) => ({ questId: quest.id, state: "available", progress: 0 }))));
    const savedHome = load("afterlight.home", createDefaultHome(ownerId));
    setHome(savedHome.ownerId === ("local-player" as PlayerId) && ownerId !== ("local-player" as PlayerId)
      ? { ...savedHome, ownerId, permissions: { ...savedHome.permissions, [ownerId]: "owner" } }
      : savedHome);
    hydrated.current = true;
  }, [ownerId]);

  useEffect(() => {
    if (remoteHome && remoteHome.revision >= home.revision && remoteHome.ownerId !== ownerId) setHome(remoteHome);
  }, [home.revision, ownerId, remoteHome]);

  const persist = useCallback((key: string, value: unknown) => {
    if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(value));
  }, []);

  const gather = useCallback((itemId: string, quantity = 1) => {
    setInventory((current) => {
      const next = addItems(current, [{ itemId, quantity }], ITEM_CATALOG);
      persist("afterlight.inventory", next);
      return next;
    });
    setQuests((current) => {
      const next = QUEST_CATALOG.reduce((list, quest) => quest.type === "collect" && quest.targetId === itemId ? applyQuestProgress(list, quest, quantity) : list, current);
      persist("afterlight.quests", next);
      return next;
    });
    setProgression((current) => {
      const next = grantExperience(current, 5);
      persist("afterlight.progression", next);
      return next;
    });
  }, [persist]);

  const craftRecipe = useCallback((recipeId: string) => {
    const recipe = RECIPE_CATALOG.find((candidate) => candidate.id === recipeId);
    if (!recipe) return false;
    const nextInventory = craft(inventory, recipe, ITEM_CATALOG);
    if (!nextInventory) return false;
    setInventory(nextInventory);
    persist("afterlight.inventory", nextInventory);
    setProgression((current) => {
      const next = grantExperience(current, 12);
      persist("afterlight.progression", next);
      return next;
    });
    setQuests((current) => {
      const next = QUEST_CATALOG.reduce((list, quest) => quest.type === "craft" && quest.targetId === recipeId ? applyQuestProgress(list, quest) : list, current);
      persist("afterlight.quests", next);
      return next;
    });
    return true;
  }, [inventory, persist]);

  const discover = useCallback((discoveryId: string) => {
    setProgression((current) => {
      if (current.discoveredLocations.includes(discoveryId)) return current;
      const next = { ...current, discoveredLocations: [...current.discoveredLocations, discoveryId] };
      persist("afterlight.progression", next);
      return next;
    });
    setQuests((current) => {
      const next = QUEST_CATALOG.reduce((list, quest) => quest.type === "discover" && quest.targetId === discoveryId ? applyQuestProgress(list, quest) : list, current);
      persist("afterlight.quests", next);
      return next;
    });
  }, [persist]);

  const updateHome = useCallback((change: (current: HomeState) => HomeState) => {
    setHome((current) => {
      const role = current.permissions[ownerId] ?? "visitor";
      if (!canDecorate(role)) return current;
      const next = { ...change(current), ownerId: current.ownerId, revision: current.revision + 1 };
      persist("afterlight.home", next);
      onHomeChange(next);
      return next;
    });
  }, [onHomeChange, ownerId, persist]);

  const placeFurniture = useCallback((furnitureId: string) => updateHome((current) => {
    const index = current.objects.length;
    const object: HomeObject = { id: `home-object-${Date.now()}-${index}`, furnitureId, position: { x: (index % 4) * 2 - 3, y: 0, z: Math.floor(index / 4) * 1.8 - 1.5 }, rotation: 0 };
    return { ...current, objects: [...current.objects, object] };
  }), [updateHome]);
  const moveFurniture = useCallback((id: string, dx: number, dz: number) => updateHome((current) => ({ ...current, objects: current.objects.map((object) => object.id === id ? { ...object, position: { ...object.position, x: object.position.x + dx, z: object.position.z + dz } } : object) })), [updateHome]);
  const rotateFurniture = useCallback((id: string) => updateHome((current) => ({ ...current, objects: current.objects.map((object) => object.id === id ? { ...object, rotation: object.rotation + Math.PI / 2 } : object) })), [updateHome]);
  const deleteFurniture = useCallback((id: string) => updateHome((current) => ({ ...current, objects: current.objects.filter((object) => object.id !== id) })), [updateHome]);
  const setHomePermission = useCallback((playerId: string, role: HomeRole) => updateHome((current) => ({ ...current, permissions: { ...current.permissions, [playerId]: role } })), [updateHome]);
  const role = home.permissions[ownerId] ?? "visitor";

  return {
    inventory,
    progression,
    quests,
    home,
    role,
    itemQuantity: (itemId: string) => itemQuantity(inventory, itemId),
    gather,
    craftRecipe,
    discover,
    canBuild: canBuild(role),
    canDecorate: canDecorate(role),
    placeFurniture,
    moveFurniture,
    rotateFurniture,
    deleteFurniture,
    setHomePermission,
    saveHome: () => persist("afterlight.home", home),
    loadHome: () => setHome((current) => {
      const stored = typeof window !== "undefined" ? window.localStorage.getItem("afterlight.home") : null;
      if (!stored) return current;
      try { return JSON.parse(stored) as HomeState; } catch { return current; }
    }),
    hydrated: hydrated.current
  };
}