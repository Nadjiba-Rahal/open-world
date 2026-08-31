"use client";

import { CHARACTER_OPTIONS, type CharacterAppearance } from "@afterlight/shared";
import { useMemo, type RefObject } from "react";
import type { Group } from "three";

interface CharacterAvatarProps {
  appearance: CharacterAppearance;
  groupRef?: RefObject<Group | null>;
}

function option<T extends readonly { id: string }[]>(options: T, id: string): T[number] {
  const selected = options.find((item) => item.id === id) ?? options[0];
  if (!selected) throw new Error("Character option catalog cannot be empty");
  return selected;
}

export function CharacterAvatar({ appearance, groupRef }: CharacterAvatarProps) {
  const skin = option(CHARACTER_OPTIONS.skinTone, appearance.skinTone);
  const body = option(CHARACTER_OPTIONS.bodyType, appearance.bodyType);
  const eyes = option(CHARACTER_OPTIONS.eyes, appearance.eyes);
  const hair = option(CHARACTER_OPTIONS.hair, appearance.hair);
  const hairColor = option(CHARACTER_OPTIONS.hairColor, appearance.hairColor);
  const outfit = option(CHARACTER_OPTIONS.outfit, appearance.outfit);
  const accessory = option(CHARACTER_OPTIONS.accessories, appearance.accessories[0] ?? "none");
  const faceOffset = appearance.face === "curious" ? 0.035 : appearance.face === "bold" ? -0.025 : 0;
  const hairScale = useMemo(() => {
    if (hair.id === "long") return [1.08, 1.38, 1.08] as const;
    if (hair.id === "bob") return [1.12, 0.85, 1.12] as const;
    if (hair.id === "braids") return [1.28, 1.18, 1.02] as const;
    if (hair.id === "topknot") return [0.92, 1.35, 0.92] as const;
    if (hair.id === "shaved") return [1.02, 0.52, 1.02] as const;
    return [1.05, 1, 1.05] as const;
  }, [hair.id]);

  return (
    <group ref={groupRef} scale={body.scale}>
      <mesh castShadow position={[0, 0.2, 0]}>
        <capsuleGeometry args={[0.42, 0.85, 6, 12]} />
        <meshStandardMaterial color={outfit.color} roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 1.05, 0]}>
        <sphereGeometry args={[0.34, 16, 12]} />
        <meshStandardMaterial color={skin.color} roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0, 1.31, 0]} scale={hairScale}>
        <sphereGeometry args={[0.36, 16, 12]} />
        <meshStandardMaterial color={hairColor.color} roughness={0.92} />
      </mesh>
      {hair.id === "topknot" && <mesh castShadow position={[0, 1.69, 0]}><sphereGeometry args={[0.18, 12, 8]} /><meshStandardMaterial color={hairColor.color} /></mesh>}
      {hair.id === "braids" && <><mesh castShadow position={[-0.29, 1.12, 0]}><capsuleGeometry args={[0.09, 0.48, 5, 8]} /><meshStandardMaterial color={hairColor.color} /></mesh><mesh castShadow position={[0.29, 1.12, 0]}><capsuleGeometry args={[0.09, 0.48, 5, 8]} /><meshStandardMaterial color={hairColor.color} /></mesh></>}
      <mesh position={[-0.12, 1.08 + faceOffset, 0.315]}><sphereGeometry args={[0.045, 8, 6]} /><meshStandardMaterial color={eyes.color} emissive={eyes.color} emissiveIntensity={0.2} /></mesh>
      <mesh position={[0.12, 1.08 + faceOffset, 0.315]}><sphereGeometry args={[0.045, 8, 6]} /><meshStandardMaterial color={eyes.color} emissive={eyes.color} emissiveIntensity={0.2} /></mesh>
      {accessory.id !== "none" && <mesh castShadow position={[0, 0.82, 0.37]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.16, 0.025, 6, 12]} /><meshStandardMaterial color={accessory.color} metalness={0.2} roughness={0.65} /></mesh>}
      {/* TODO(ASSET): Replace this data-driven geometric avatar with the licensed rigged character asset. */}
    </group>
  );
}