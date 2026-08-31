"use client";

import { isNight } from "@afterlight/game-core";
import { REGION_CATALOG, type AudioSettings, type WeatherKind, type WorldId } from "@afterlight/shared";
import { useCallback, useEffect, useState } from "react";
import { gameAudio } from "./gameAudio";

export function useGameAudio(worldId: WorldId, dayProgress: number, weather: WeatherKind) {
  const [settings, setSettings] = useState<AudioSettings>(() => gameAudio.getSettings());

  useEffect(() => gameAudio.subscribe(setSettings), []);

  useEffect(() => {
    const unlock = () => {
      void gameAudio.resume();
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  useEffect(() => {
    const region = REGION_CATALOG.find((entry) => entry.id === worldId) ?? REGION_CATALOG[0];
    const night = isNight(dayProgress);
    const music = region.id === "lumenfall" && night ? "lumenfall-night" : region.music;
    const ambience =
      region.id === "lumenfall" && night && region.ambience === "forest-day" ? "forest-night" : region.ambience;
    gameAudio.setBeds({ music, ambience, weather });
  }, [worldId, dayProgress, weather]);

  const updateSettings = useCallback((partial: Partial<AudioSettings>) => {
    setSettings(gameAudio.setSettings(partial));
  }, []);

  return { settings, updateSettings };
}
