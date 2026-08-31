"use client";

import type { AudioSettings } from "@afterlight/shared";
import { playSfx } from "./gameAudio";

const sliders: Array<{ key: keyof Pick<AudioSettings, "masterVolume" | "musicVolume" | "ambienceVolume" | "sfxVolume">; label: string }> = [
  { key: "masterVolume", label: "Master" },
  { key: "musicVolume", label: "Music" },
  { key: "ambienceVolume", label: "Ambience" },
  { key: "sfxVolume", label: "SFX" }
];

export function AudioSettingsPanel({
  settings,
  onChange
}: {
  settings: AudioSettings;
  onChange: (partial: Partial<AudioSettings>) => void;
}) {
  return (
    <div className="audio-dock">
      <button
        className="audio-mute"
        type="button"
        aria-pressed={settings.muted}
        onClick={() => {
          playSfx("ui-click");
          onChange({ muted: !settings.muted });
        }}
      >
        {settings.muted ? "Unmute" : "Mute"}
      </button>
      {sliders.map((slider) => (
        <label key={slider.key} className="audio-slider">
          <span>{slider.label}</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings[slider.key]}
            disabled={settings.muted}
            onChange={(event) => onChange({ [slider.key]: Number(event.target.value) })}
          />
        </label>
      ))}
    </div>
  );
}
