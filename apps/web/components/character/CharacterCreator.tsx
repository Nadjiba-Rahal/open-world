"use client";

import { CHARACTER_OPTIONS, type CharacterAppearance } from "@afterlight/shared";
import { useState, type ChangeEvent } from "react";
import { playSfx } from "../audio/gameAudio";

interface CharacterCreatorProps {
  appearance: CharacterAppearance;
  onChange: (appearance: CharacterAppearance) => void;
  onSave: () => void;
  onLoad: () => void;
  saved: boolean;
}

type SelectableKey = "skinTone" | "bodyType" | "face" | "eyes" | "hair" | "hairColor" | "outfit";

const fields: Array<{ key: SelectableKey; label: string }> = [
  { key: "skinTone", label: "Skin tone" },
  { key: "bodyType", label: "Body type" },
  { key: "face", label: "Face" },
  { key: "eyes", label: "Eyes" },
  { key: "hair", label: "Hair" },
  { key: "hairColor", label: "Hair color" },
  { key: "outfit", label: "Outfit" }
];

export function CharacterCreator({ appearance, onChange, onSave, onLoad, saved }: CharacterCreatorProps) {
  const [open, setOpen] = useState(true);
  const update = (key: SelectableKey) => (event: ChangeEvent<HTMLSelectElement>) => onChange({ ...appearance, [key]: event.target.value });
  const updateAccessory = (event: ChangeEvent<HTMLSelectElement>) => onChange({ ...appearance, accessories: [event.target.value] });

  return (
    <aside className={`creator ${open ? "is-open" : ""}`}>
      <button className="creator-toggle" type="button" onClick={() => { playSfx("ui-click"); setOpen((value) => !value); }} onMouseEnter={() => playSfx("ui-hover")} aria-expanded={open}>
        <span>Character</span><span aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="creator-body">
        <p className="creator-kicker">Shape your traveler</p>
        <h2>Make a beginning.</h2>
        <p className="creator-copy">Every choice is data. The same appearance can travel from web to mobile.</p>
        <div className="creator-fields">
          {fields.map(({ key, label }) => <label key={key}><span>{label}</span><select value={appearance[key]} onChange={update(key)}>{CHARACTER_OPTIONS[key].map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select></label>)}
          <label><span>Accessory</span><select value={appearance.accessories[0] ?? "none"} onChange={updateAccessory}>{CHARACTER_OPTIONS.accessories.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select></label>
        </div>
        <div className="creator-actions">
          <button type="button" className="primary-action" onClick={() => { playSfx("ui-click"); onSave(); }}>Save appearance</button>
          <button type="button" className="secondary-action" onClick={() => { playSfx("ui-click"); onLoad(); }}>Load saved</button>
        </div>
        <p className="save-state" role="status">{saved ? "Appearance saved for this browser." : "Unsaved changes"}</p>
      </div>}
    </aside>
  );
}