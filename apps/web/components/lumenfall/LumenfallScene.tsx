"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Physics, RigidBody, CapsuleCollider, CuboidCollider, type RapierRigidBody } from "@react-three/rapier";
import { Sky, Text } from "@react-three/drei";
import {
  CREATURE_CATALOG,
  DISCOVERY_CATALOG,
  EMOTE_CATALOG,
  FURNITURE_CATALOG,
  ITEM_CATALOG,
  NPC_CATALOG,
  PORTAL_CATALOG,
  QUEST_CATALOG,
  RESOURCE_NODES,
  createDefaultAppearance,
  type CharacterAppearance,
  type CreatureDefinition,
  type EmoteId,
  type FurnitureDefinition,
  type HomeObject,
  type MovementState,
  type NpcDefinition,
  type PlayerId,
  type PlayerSnapshot,
  type ResourceNodeDefinition,
  type WorldAtmosphere
} from "@afterlight/shared";
import { formatTimeOfDay, npcStateAt } from "@afterlight/game-core";
import { useCallback, useEffect, useRef, useState, type MutableRefObject, type PointerEvent as ReactPointerEvent } from "react";
import type { Group, PerspectiveCamera } from "three";
import { MathUtils, Vector3 } from "three";
import { CharacterAvatar } from "../character/CharacterAvatar";
import { CharacterCreator } from "../character/CharacterCreator";
import { MultiplayerPanel } from "../multiplayer/MultiplayerPanel";
import { useMultiplayerSession } from "../multiplayer/useMultiplayerSession";
import { WorldSystemsPanel } from "../systems/WorldSystemsPanel";
import { useWorldSystems } from "../systems/useWorldSystems";

const WALK_SPEED = 3.8;
const SPRINT_SPEED = 6.4;
const INTERACTION_DISTANCE = 3.6;
const LANTERN_STONE_POS = new Vector3(4.5, 0, -3.5);
const HOME_PLOT_CENTER = new Vector3(-6, 0, 7.5);

interface CameraInput {
  yaw: number;
  pitch: number;
}

interface PlayerControllerProps {
  cameraInput: MutableRefObject<CameraInput>;
  onPositionUpdate: (position: Vector3) => void;
  appearance: CharacterAppearance;
  onPlayerUpdate?: (update: Pick<PlayerSnapshot, "position" | "rotation" | "movement">) => void;
  onInteractKey: () => void;
  onBuildKey: () => void;
}

function PlayerController({ cameraInput, onPositionUpdate, appearance, onPlayerUpdate, onInteractKey, onBuildKey }: PlayerControllerProps) {
  const body = useRef<RapierRigidBody>(null);
  const model = useRef<Group>(null);
  const { camera } = useThree();
  const keys = useRef(new Set<string>());
  const lastPosition = useRef(new Vector3(0, 1.2, 7));
  const cameraTarget = useRef(new Vector3());
  const syncClock = useRef(0);
  const posUpdateClock = useRef(0);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      keys.current.add(key);
      if (key === "e") onInteractKey();
      if (key === "b") onBuildKey();
    };
    const up = (event: KeyboardEvent) => keys.current.delete(event.key.toLowerCase());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [onBuildKey, onInteractKey]);

  useFrame((_, delta) => {
    if (!body.current) return;
    const forward = Number(keys.current.has("w") || keys.current.has("arrowup")) - Number(keys.current.has("s") || keys.current.has("arrowdown"));
    const strafe = Number(keys.current.has("d") || keys.current.has("arrowright")) - Number(keys.current.has("a") || keys.current.has("arrowleft"));
    const input = new Vector3(strafe, 0, -forward);
    if (input.lengthSq() > 0) input.normalize();
    input.applyAxisAngle(new Vector3(0, 1, 0), cameraInput.current.yaw);
    const speed = keys.current.has("shift") ? SPRINT_SPEED : WALK_SPEED;
    const movement: MovementState = input.lengthSq() === 0 ? "idle" : keys.current.has("shift") ? "sprinting" : "walking";
    const velocity = body.current.linvel();
    body.current.setLinvel({ x: input.x * speed, y: velocity.y, z: input.z * speed }, true);

    const position = body.current.translation();
    const current = new Vector3(position.x, position.y, position.z);
    if (input.lengthSq() > 0) {
      model.current?.rotation.set(0, Math.atan2(input.x, input.z), 0);
    }
    lastPosition.current.lerp(current, Math.min(1, delta * 12));
    const distance = 8.5;
    const height = 4.8;
    const orbit = new Vector3(
      Math.sin(cameraInput.current.yaw) * distance,
      height + cameraInput.current.pitch,
      Math.cos(cameraInput.current.yaw) * distance
    );
    camera.position.lerp(lastPosition.current.clone().add(orbit), Math.min(1, delta * 5));
    cameraTarget.current.copy(lastPosition.current).add(new Vector3(0, 1.1, 0));
    (camera as PerspectiveCamera).lookAt(cameraTarget.current);

    posUpdateClock.current += delta;
    if (posUpdateClock.current >= 0.05) {
      posUpdateClock.current = 0;
      onPositionUpdate(current);
    }

    syncClock.current += delta;
    if (onPlayerUpdate && syncClock.current >= 0.1) {
      syncClock.current = 0;
      onPlayerUpdate({ position: { x: position.x, y: position.y, z: position.z }, rotation: { y: model.current?.rotation.y ?? 0 }, movement });
    }
  });

  return (
    <RigidBody ref={body} colliders={false} position={[0, 1.2, 7]} enabledRotations={[false, false, false]} linearDamping={5} lockRotations>
      <CapsuleCollider args={[0.55, 0.45]} />
      <CharacterAvatar appearance={appearance} groupRef={model} />
    </RigidBody>
  );
}

function RemotePlayer({ player, emote }: { player: PlayerSnapshot; emote?: EmoteId }) {
  const model = useRef<Group>(null);
  const target = useRef(new Vector3(player.position.x, player.position.y, player.position.z));
  const phase = useRef((player.id.charCodeAt(0) % 10) / 10);

  useFrame((_, delta) => {
    if (!model.current) return;
    target.current.set(player.position.x, player.position.y, player.position.z);
    model.current.position.lerp(target.current, Math.min(1, delta * 10));
    const bob = player.movement === "idle" ? 0 : Math.sin(performance.now() / 130 + phase.current) * 0.035;
    model.current.position.y += (bob - (model.current.userData.lastBob ?? 0));
    model.current.userData.lastBob = bob;
    const targetRotation = player.rotation.y;
    let difference = targetRotation - model.current.rotation.y;
    while (difference > Math.PI) difference -= Math.PI * 2;
    while (difference < -Math.PI) difference += Math.PI * 2;
    model.current.rotation.y += difference * Math.min(1, delta * 12);
  });

  return (
    <group ref={model} position={[player.position.x, player.position.y, player.position.z]}>
      <CharacterAvatar appearance={player.appearance} />
      <Text position={[0, emote ? 2.65 : 2.15, 0]} fontSize={0.22} color="#fff6d9" outlineColor="#17201b" outlineWidth={0.025} anchorX="center" anchorY="middle">
        {player.displayName}
      </Text>
      {emote && <Text position={[0, 2.4, 0]} fontSize={.34} color="#e6c983" outlineColor="#17201b" outlineWidth={.02} anchorX="center">{EMOTE_CATALOG.find((entry) => entry.id === emote)?.symbol ?? "✦"}</Text>}
    </group>
  );
}

function Creature({ definition, index }: { definition: CreatureDefinition; index: number }) {
  const ref = useRef<Group>(null);
  const origin = definition.spawn[index % definition.spawn.length] ?? definition.spawn[0];
  useFrame(({ clock }) => {
    if (!ref.current || !origin) return;
    const t = clock.elapsedTime * definition.speed + index * 2.3;
    ref.current.position.x = origin.x + Math.sin(t) * (definition.id === "lantern-moth" ? .8 : 1.4);
    ref.current.position.y = origin.y + (definition.id === "lantern-moth" ? Math.sin(t * 1.7) * .25 : 0);
    ref.current.position.z = origin.z + Math.cos(t * .72) * (definition.id === "lantern-moth" ? .6 : .9);
    ref.current.rotation.y = Math.atan2(Math.cos(t), -Math.sin(t));
  });
  return (
    <group ref={ref} position={[origin?.x ?? 0, origin?.y ?? 0, origin?.z ?? 0]}>
      <mesh castShadow position={[0, definition.size, 0]} scale={[1.3, .8, 1]}>
        <sphereGeometry args={[definition.size, 10, 7]} />
        <meshStandardMaterial color={definition.color} roughness={.9} emissive={definition.id === "lantern-moth" ? definition.color : "#000000"} emissiveIntensity={definition.id === "lantern-moth" ? 1.1 : 0} />
      </mesh>
      <mesh position={[0, definition.size * 1.8, 0]} scale={.55}>
        <sphereGeometry args={[definition.size, 8, 6]} />
        <meshStandardMaterial color={definition.color} roughness={.9} />
      </mesh>
    </group>
  );
}

function WorldAtmosphereScene({ atmosphere }: { atmosphere: WorldAtmosphere }) {
  const daylight = Math.max(0, Math.sin(atmosphere.dayProgress * Math.PI * 2 - Math.PI / 2));
  const weatherDim = atmosphere.weather === "rain" ? .72 : atmosphere.weather === "cloudy" ? .84 : atmosphere.weather === "snow" ? .8 : 1;
  return (
    <>
      <ambientLight intensity={(.3 + daylight * .4) * weatherDim} color={atmosphere.weather === "snow" ? "#c5d5df" : "#fff0d2"} />
      <directionalLight castShadow position={[-8, 14, 6]} intensity={(.6 + daylight * 1.1) * weatherDim} color={daylight < .25 ? "#9baed2" : "#fff0ce"} />
      {atmosphere.weather === "rain" && <fog attach="fog" args={["#53616a", 8, 28]} />}
    </>
  );
}

function ResourceNode3D({ node, isDepleted, cooldownRemaining, isTargeted }: { node: ResourceNodeDefinition; isDepleted: boolean; cooldownRemaining: number; isTargeted: boolean }) {
  const [x, y, z] = node.position;

  return (
    <group position={[x, y, z]}>
      {/* 3D Visual Mesh based on kind */}
      {node.kind === "tree" && (
        <group>
          <mesh castShadow position={[0, 1.4, 0]}>
            <cylinderGeometry args={[0.26, 0.42, 2.8, 8]} />
            <meshStandardMaterial color="#553e2e" roughness={0.9} />
          </mesh>
          <mesh castShadow position={[0, 3.1, 0]}>
            <dodecahedronGeometry args={[1.5, 1]} />
            <meshStandardMaterial color={isDepleted ? "#566854" : "#3e644b"} roughness={0.9} transparent={isDepleted} opacity={isDepleted ? 0.6 : 1} />
          </mesh>
          <mesh castShadow position={[0.4, 3.8, 0.2]} scale={0.7}>
            <dodecahedronGeometry args={[1.1, 1]} />
            <meshStandardMaterial color={isDepleted ? "#6c7a6b" : "#5a8258"} roughness={0.9} transparent={isDepleted} opacity={isDepleted ? 0.6 : 1} />
          </mesh>
        </group>
      )}

      {node.kind === "boulder" && (
        <group>
          <mesh castShadow position={[0, 0.45, 0]} scale={[1.2, 0.9, 1.1]}>
            <dodecahedronGeometry args={[0.7, 0]} />
            <meshStandardMaterial color={isDepleted ? "#5e6360" : node.color} roughness={0.88} />
          </mesh>
          {node.itemId === "ore" && !isDepleted && (
            <mesh position={[0.25, 0.65, 0.25]} scale={0.3}>
              <octahedronGeometry args={[0.6, 0]} />
              <meshStandardMaterial color="#e8c078" metalness={0.7} roughness={0.3} emissive="#e8c078" emissiveIntensity={0.6} />
            </mesh>
          )}
        </group>
      )}

      {node.kind === "plants" && (
        <group>
          <mesh castShadow position={[0, 0.35, 0]} scale={isDepleted ? 0.5 : 1}>
            <cylinderGeometry args={[0.04, 0.06, 0.7, 6]} />
            <meshStandardMaterial color="#4a7a44" />
          </mesh>
          <mesh position={[0, 0.75, 0]} scale={isDepleted ? [0.3, 0.3, 0.3] : [0.65, 0.65, 0.65]}>
            <dodecahedronGeometry args={[0.45, 0]} />
            <meshStandardMaterial color={node.color} emissive={node.color} emissiveIntensity={isDepleted ? 0.1 : 0.4} />
          </mesh>
        </group>
      )}

      {node.kind === "herbs" && (
        <group>
          <mesh castShadow position={[0, 0.3, 0]} scale={isDepleted ? 0.4 : 0.9}>
            <sphereGeometry args={[0.5, 8, 6]} />
            <meshStandardMaterial color={node.color} roughness={0.9} />
          </mesh>
        </group>
      )}

      {node.kind === "fruit" && (
        <group>
          <mesh castShadow position={[0, 0.45, 0]} scale={isDepleted ? 0.6 : 1}>
            <sphereGeometry args={[0.65, 8, 7]} />
            <meshStandardMaterial color="#3f5a3b" roughness={0.9} />
          </mesh>
          {!isDepleted && (
            <>
              <mesh position={[0.3, 0.6, 0.3]} scale={0.16}>
                <sphereGeometry args={[1, 6, 6]} />
                <meshStandardMaterial color={node.color} emissive={node.color} emissiveIntensity={0.4} />
              </mesh>
              <mesh position={[-0.25, 0.55, -0.2]} scale={0.14}>
                <sphereGeometry args={[1, 6, 6]} />
                <meshStandardMaterial color={node.color} emissive={node.color} emissiveIntensity={0.4} />
              </mesh>
            </>
          )}
        </group>
      )}

      {node.kind === "crystals" && (
        <group>
          <mesh castShadow position={[0, 0.7, 0]} rotation={[0.2, 0.4, -0.1]} scale={isDepleted ? [0.4, 0.4, 0.4] : [0.8, 1.4, 0.8]}>
            <octahedronGeometry args={[0.6, 0]} />
            <meshStandardMaterial color={node.color} emissive={node.color} emissiveIntensity={isDepleted ? 0.2 : 1.2} roughness={0.2} metalness={0.4} />
          </mesh>
          <pointLight color={node.color} intensity={isDepleted ? 0.2 : 1.4} distance={4} position={[0, 0.9, 0]} />
        </group>
      )}

      {node.kind === "fishing" && (
        <group>
          <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.5, 0.9, 16]} />
            <meshStandardMaterial color="#88b5b5" transparent opacity={0.5} />
          </mesh>
        </group>
      )}

      {/* Target indicator ring */}
      {isTargeted && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
          <ringGeometry args={[0.9, 1.05, 24]} />
          <meshStandardMaterial color="#d1b56b" emissive="#d1b56b" emissiveIntensity={1.2} />
        </mesh>
      )}

      {/* Cooldown floating label */}
      {isDepleted && cooldownRemaining > 0 && (
        <Text position={[0, 1.6, 0]} fontSize={0.18} color="#aaa999" outlineColor="#101413" outlineWidth={0.02} anchorX="center">
          {`Respawning in ${cooldownRemaining}s`}
        </Text>
      )}
    </group>
  );
}

function HomeFurniture3D({ object, isSelected, onClick }: { object: HomeObject; isSelected?: boolean; onClick?: () => void }) {
  const item: FurnitureDefinition = FURNITURE_CATALOG.find((candidate) => candidate.id === object.furnitureId) ?? FURNITURE_CATALOG[0]!;
  return (
    <group position={[object.position.x, object.position.y, object.position.z]} rotation={[0, object.rotation, 0]} onClick={onClick}>
      <mesh castShadow position={[0, 0.35, 0]}>
        <boxGeometry args={[item.footprint[0], 0.7, item.footprint[1]]} />
        <meshStandardMaterial color={item.color} roughness={0.85} />
      </mesh>
      {item.category === "lighting" && (
        <>
          <pointLight color="#f3c977" intensity={1.5} distance={5} position={[0, 0.85, 0]} />
          <mesh position={[0, 0.85, 0]}>
            <sphereGeometry args={[0.18, 10, 8]} />
            <meshStandardMaterial color="#ffe9a8" emissive="#f2b85d" emissiveIntensity={2} />
          </mesh>
        </>
      )}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
          <ringGeometry args={[item.footprint[0] * 0.6, item.footprint[0] * 0.7, 24]} />
          <meshStandardMaterial color="#d1b56b" emissive="#d1b56b" emissiveIntensity={1.5} />
        </mesh>
      )}
    </group>
  );
}

function HomeArea3D({ objects, inBuildMode, selectedFurnitureId, selectedObjectId, onSelectObject }: { objects: HomeObject[]; inBuildMode: boolean; selectedFurnitureId: string; selectedObjectId: string | null; onSelectObject: (id: string) => void }) {
  return (
    <group position={[-6, 0, 8]}>
      {/* Plot foundation */}
      <mesh receiveShadow position={[0, -0.04, 0]}>
        <boxGeometry args={[11, 0.08, 8]} />
        <meshStandardMaterial color="#6e6252" roughness={0.95} />
      </mesh>
      <mesh receiveShadow position={[0, 0.01, 0]}>
        <planeGeometry args={[10.6, 7.6]} />
        <meshStandardMaterial color="#8a7c66" roughness={0.9} />
      </mesh>

      {/* Boundary posts */}
      {inBuildMode && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
          <ringGeometry args={[5.2, 5.4, 32]} />
          <meshStandardMaterial color="#d1b56b" emissive="#d1b56b" emissiveIntensity={0.8} />
        </mesh>
      )}

      {/* Placed objects */}
      {objects.map((object) => (
        <HomeFurniture3D
          key={object.id}
          object={object}
          isSelected={object.id === selectedObjectId}
          onClick={() => inBuildMode && onSelectObject(object.id)}
        />
      ))}
    </group>
  );
}

function NpcMarker3D({ npc, isTargeted }: { npc: NpcDefinition; isTargeted: boolean }) {
  return (
    <group position={[npc.position.x, npc.position.y, npc.position.z]}>
      <mesh castShadow position={[0, 0.75, 0]}>
        <capsuleGeometry args={[0.35, 0.8, 6, 10]} />
        <meshStandardMaterial color={npc.id === "mira" ? "#8d5d68" : "#536477"} roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 1.35, 0]}>
        <sphereGeometry args={[0.3, 12, 8]} />
        <meshStandardMaterial color="#c98b64" roughness={0.8} />
      </mesh>
      <Text position={[0, 2.05, 0]} fontSize={0.22} color="#fff6d9" outlineColor="#17201b" outlineWidth={0.025} anchorX="center">
        {npc.name}
      </Text>
      {isTargeted && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
          <ringGeometry args={[0.7, 0.85, 20]} />
          <meshStandardMaterial color="#d1b56b" emissive="#d1b56b" emissiveIntensity={1.2} />
        </mesh>
      )}
    </group>
  );
}

function PortalMarker3D({ portal, isTargeted }: { portal: (typeof PORTAL_CATALOG)[number]; isTargeted: boolean }) {
  const locked = portal.state !== "unlocked";
  return (
    <group position={[portal.position.x, portal.position.y, portal.position.z]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 1.6, 0]}>
        <torusGeometry args={[1.3, 0.16, 12, 28]} />
        <meshStandardMaterial color={locked ? "#7d7185" : "#8aab6b"} emissive={locked ? "#3e304b" : "#314d3c"} emissiveIntensity={1.4} />
      </mesh>
      <Text position={[0, 3.2, 0]} fontSize={0.24} color={locked ? "#c2b1c8" : "#d6e3bb"} outlineColor="#17201b" outlineWidth={0.025} anchorX="center">
        {portal.name}
      </Text>
      {isTargeted && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
          <ringGeometry args={[1.2, 1.4, 24]} />
          <meshStandardMaterial color="#d1b56b" emissive="#d1b56b" emissiveIntensity={1.2} />
        </mesh>
      )}
    </group>
  );
}

function LumenfallWorld({
  nodeCooldowns,
  targetedId,
  homeObjects,
  inBuildMode,
  selectedFurnitureId,
  selectedObjectId,
  onSelectObject
}: {
  nodeCooldowns: Record<string, number>;
  targetedId: string | null;
  homeObjects: HomeObject[];
  inBuildMode: boolean;
  selectedFurnitureId: string;
  selectedObjectId: string | null;
  onSelectObject: (id: string) => void;
}) {
  const now = Date.now();
  return (
    <>
      {/* Terrain ground */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[46, 46]} />
        <meshStandardMaterial color="#71856c" roughness={1} />
      </mesh>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[23, 0.1, 23]} position={[0, -0.2, 0]} />
      </RigidBody>

      {/* Pathways */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 2]}>
        <planeGeometry args={[4, 26]} />
        <meshStandardMaterial color="#b7a27b" roughness={1} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -2]}>
        <planeGeometry args={[26, 3.4]} />
        <meshStandardMaterial color="#b7a27b" roughness={1} />
      </mesh>

      {/* River water */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[-8, 0.04, 1]}>
        <planeGeometry args={[8, 3.5]} />
        <meshStandardMaterial color="#6f9e99" roughness={0.3} metalness={0.15} />
      </mesh>

      {/* Town Center Tavern / Hearth structure */}
      <group position={[0, 0, -4]}>
        <mesh castShadow position={[0, 1.25, 0]}>
          <boxGeometry args={[5, 2.5, 3.2]} />
          <meshStandardMaterial color="#6e5844" roughness={1} />
        </mesh>
        <mesh castShadow position={[0, 3, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[3.4, 2, 4]} />
          <meshStandardMaterial color="#7d4f43" roughness={0.9} />
        </mesh>
        <mesh castShadow position={[0, 1.6, 1.62]}>
          <boxGeometry args={[0.9, 1.4, 0.1]} />
          <meshStandardMaterial color="#273b38" emissive="#152522" emissiveIntensity={0.5} />
        </mesh>
      </group>

      {/* Lantern Stone Monolith */}
      <group position={[4.5, 0, -3.5]}>
        <mesh castShadow position={[0, 0.7, 0]}>
          <cylinderGeometry args={[0.6, 0.8, 1.4, 8]} />
          <meshStandardMaterial color="#7e8990" roughness={0.95} />
        </mesh>
        <pointLight color="#f3c977" intensity={2.2} distance={6} position={[0, 1.8, 0]} />
        <mesh position={[0, 1.85, 0]}>
          <sphereGeometry args={[0.22, 14, 10]} />
          <meshStandardMaterial color="#ffe9a8" emissive="#f2b85d" emissiveIntensity={2.5} />
        </mesh>
        {targetedId === "lantern-stone" && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
            <ringGeometry args={[1, 1.15, 24]} />
            <meshStandardMaterial color="#d1b56b" emissive="#d1b56b" emissiveIntensity={1.4} />
          </mesh>
        )}
      </group>

      {/* Resource Nodes in 3D */}
      {RESOURCE_NODES.map((node) => {
        const readyAt = nodeCooldowns[node.id] ?? 0;
        const isDepleted = now < readyAt;
        const cooldownRemaining = Math.max(0, Math.ceil((readyAt - now) / 1000));
        return (
          <ResourceNode3D
            key={node.id}
            node={node}
            isDepleted={isDepleted}
            cooldownRemaining={cooldownRemaining}
            isTargeted={targetedId === node.id}
          />
        );
      })}

      {/* NPCs */}
      {NPC_CATALOG.map((npc) => (
        <NpcMarker3D key={npc.id} npc={npc} isTargeted={targetedId === npc.id} />
      ))}

      {/* Portals */}
      {PORTAL_CATALOG.map((portal) => (
        <PortalMarker3D key={portal.id} portal={portal} isTargeted={targetedId === portal.id} />
      ))}

      {/* Home / Building Area */}
      <HomeArea3D
        objects={homeObjects}
        inBuildMode={inBuildMode}
        selectedFurnitureId={selectedFurnitureId}
        selectedObjectId={selectedObjectId}
        onSelectObject={onSelectObject}
      />

      {/* Fixed colliders */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[2.5, 1.2, 1.6]} position={[0, 1.2, -4]} />
      </RigidBody>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[0.75, 0.7, 0.75]} position={[4.5, 0.7, -3.5]} />
      </RigidBody>
    </>
  );
}

function WorldScene({
  cameraInput,
  onPositionUpdate,
  appearance,
  onPlayerUpdate,
  onInteractKey,
  onBuildKey,
  remotePlayers,
  homeObjects,
  atmosphere,
  emotes,
  nodeCooldowns,
  targetedId,
  inBuildMode,
  selectedFurnitureId,
  selectedObjectId,
  onSelectObject
}: PlayerControllerProps & {
  remotePlayers: PlayerSnapshot[];
  homeObjects: HomeObject[];
  atmosphere: WorldAtmosphere;
  emotes: Record<string, EmoteId>;
  nodeCooldowns: Record<string, number>;
  targetedId: string | null;
  inBuildMode: boolean;
  selectedFurnitureId: string;
  selectedObjectId: string | null;
  onSelectObject: (id: string) => void;
}) {
  return (
    <>
      <color attach="background" args={["#9fb5aa"]} />
      <fog attach="fog" args={["#9fb5aa", 18, 42]} />
      <Sky distance={450000} sunPosition={[-5, 7, -4]} inclination={0.48} azimuth={0.22} turbidity={8} rayleigh={1.6} />
      <WorldAtmosphereScene atmosphere={atmosphere} />
      <Physics gravity={[0, -16, 0]}>
        <LumenfallWorld
          nodeCooldowns={nodeCooldowns}
          targetedId={targetedId}
          homeObjects={homeObjects}
          inBuildMode={inBuildMode}
          selectedFurnitureId={selectedFurnitureId}
          selectedObjectId={selectedObjectId}
          onSelectObject={onSelectObject}
        />
        <PlayerController
          cameraInput={cameraInput}
          onPositionUpdate={onPositionUpdate}
          appearance={appearance}
          onPlayerUpdate={onPlayerUpdate}
          onInteractKey={onInteractKey}
          onBuildKey={onBuildKey}
        />
        {remotePlayers.map((player) => (
          <RemotePlayer key={player.id} player={player} emote={emotes[player.id]} />
        ))}
        {CREATURE_CATALOG.flatMap((definition) =>
          definition.spawn.map((_, index) => <Creature key={`${definition.id}-${index}`} definition={definition} index={index} />)
        )}
      </Physics>
    </>
  );
}

export default function LumenfallScene() {
  const cameraInput = useRef<CameraInput>({ yaw: 0, pitch: 0 });
  const drag = useRef({ active: false, x: 0, y: 0 });
  const playerPos = useRef<Vector3>(new Vector3(0, 1.2, 7));

  const [notice, setNotice] = useState("");
  const [activePrompt, setActivePrompt] = useState<{ id: string; label: string; action: () => void } | null>(null);
  const [discoveryBanner, setDiscoveryBanner] = useState<{ name: string; description: string } | null>(null);
  const [activeDialogue, setActiveDialogue] = useState<{ npc: NpcDefinition; lineIndex: number; activeQuest?: (typeof QUEST_CATALOG)[number] } | null>(null);

  // Build mode state
  const [inBuildMode, setInBuildMode] = useState(false);
  const [selectedFurnitureId, setSelectedFurnitureId] = useState<string>("bed");
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);

  const [appearance, setAppearance] = useState<CharacterAppearance>(() => createDefaultAppearance());
  const [saved, setSaved] = useState(false);
  const [photoMode, setPhotoMode] = useState(false);
  const [atmosphere, setAtmosphere] = useState<WorldAtmosphere>(() => ({
    dayProgress: (Date.now() % 1_200_000) / 1_200_000,
    weather: ["clear", "cloudy", "rain"][Math.floor(Date.now() / 300_000) % 3] as WorldAtmosphere["weather"]
  }));

  const multiplayer = useMultiplayerSession(appearance);
  const systems = useWorldSystems({
    ownerId: (multiplayer.selfId ?? "local-player") as PlayerId,
    remoteHome: multiplayer.home,
    onHomeChange: multiplayer.updateHome,
    onProfileSync: multiplayer.syncProfile
  });

  const { harvestNode, discover, placeFurnitureAt, rotateFurniture, deleteFurniture } = systems;

  useEffect(() => {
    const updateAtmosphere = () =>
      setAtmosphere({
        dayProgress: (Date.now() % 1_200_000) / 1_200_000,
        weather: ["clear", "cloudy", "rain"][Math.floor(Date.now() / 300_000) % 3] as WorldAtmosphere["weather"]
      });
    const timer = window.setInterval(updateAtmosphere, 10_000);
    return () => window.clearInterval(timer);
  }, []);

  const onPlayerUpdate = useCallback(
    (update: Pick<PlayerSnapshot, "position" | "rotation" | "movement">) => {
      multiplayer.updatePlayer(update);
    },
    [multiplayer]
  );

  // Discovery check and nearby interactable detection
  const onPositionUpdate = useCallback(
    (pos: Vector3) => {
      playerPos.current.copy(pos);

      // Check landmarks for discoveries
      const landmarks: Array<{ id: string; pos: [number, number, number] }> = [
        { id: "lumenfall", pos: [0, 0, 0] },
        { id: "lantern-stone", pos: [4.5, 0, -3.5] },
        { id: "moonwood", pos: [-13, 0, -10] },
        { id: "mysterious-portal", pos: [13, 0, -10] },
        { id: "moon-crystals", pos: [11, 0, -8] },
        { id: "riverbank-pier", pos: [-8, 0, 1] },
        { id: "homestead-meadow", pos: [-6, 0, 8] }
      ];

      for (const landmark of landmarks) {
        const landmarkPos = new Vector3(...landmark.pos);
        if (pos.distanceTo(landmarkPos) <= 4.2) {
          if (!systems.progression.discoveredLocations.includes(landmark.id)) {
            discover(landmark.id);
            const entry = DISCOVERY_CATALOG.find((d) => d.id === landmark.id);
            if (entry) {
              setDiscoveryBanner({ name: entry.name, description: entry.description });
              window.setTimeout(() => setDiscoveryBanner(null), 4500);
            }
          }
        }
      }

      // Check nearest interactable entity for interaction prompt
      let closest: { id: string; label: string; action: () => void } | null = null;
      let minDistance = INTERACTION_DISTANCE;

      // 1. Resource Nodes
      for (const node of RESOURCE_NODES) {
        const nodePos = new Vector3(...node.position);
        const dist = pos.distanceTo(nodePos);
        if (dist <= minDistance) {
          minDistance = dist;
          closest = {
            id: node.id,
            label: `Gather ${node.name}`,
            action: () => {
              const res = harvestNode(node);
              setNotice(res.notice);
              multiplayer.sendWorldInteract("gather", node.id);
              window.setTimeout(() => setNotice(""), 2200);
            }
          };
        }
      }

      // 2. NPCs
      for (const npc of NPC_CATALOG) {
        const npcPos = new Vector3(npc.position.x, npc.position.y, npc.position.z);
        const dist = pos.distanceTo(npcPos);
        if (dist <= minDistance) {
          minDistance = dist;
          const assignedQuest = QUEST_CATALOG.find((q) => npc.quests.includes(q.id));
          closest = {
            id: npc.id,
            label: `Talk to ${npc.name}`,
            action: () => {
              setActiveDialogue({ npc, lineIndex: 0, activeQuest: assignedQuest });
            }
          };
        }
      }

      // 3. Lantern Stone Monolith
      if (pos.distanceTo(LANTERN_STONE_POS) <= minDistance) {
        minDistance = pos.distanceTo(LANTERN_STONE_POS);
        closest = {
          id: "lantern-stone",
          label: "Inspect Lantern Stone Monolith",
          action: () => {
            discover("lantern-stone");
            setNotice("The ancient lantern monolith hums with resonant warmth. The forest awakens.");
            multiplayer.sendWorldInteract("inspect", "lantern-stone");
            window.setTimeout(() => setNotice(""), 3500);
          }
        };
      }

      // 4. Portals
      for (const portal of PORTAL_CATALOG) {
        const portalPos = new Vector3(portal.position.x, portal.position.y, portal.position.z);
        const dist = pos.distanceTo(portalPos);
        if (dist <= minDistance) {
          minDistance = dist;
          closest = {
            id: portal.id,
            label: `Enter ${portal.name}`,
            action: () => {
              if (portal.state === "unlocked") {
                discover("moonwood");
                setNotice("You step toward the Moonwood portal. The ancient leaves rustle in greeting.");
              } else {
                setNotice("The quiet portal remains sealed by ancient starlight.");
              }
              window.setTimeout(() => setNotice(""), 3200);
            }
          };
        }
      }

      setActivePrompt(closest);
    },
    [discover, harvestNode, multiplayer, systems.progression.discoveredLocations]
  );

  const handleInteractKey = useCallback(() => {
    if (activeDialogue) {
      setActiveDialogue(null);
      return;
    }
    if (activePrompt) {
      activePrompt.action();
    } else {
      setNotice("Nothing nearby responds. Approach trees, boulders, plants, NPCs, or monuments.");
      window.setTimeout(() => setNotice(""), 1800);
    }
  }, [activeDialogue, activePrompt]);

  const handleBuildKey = useCallback(() => {
    setInBuildMode((prev) => !prev);
    setSelectedObjectId(null);
  }, []);

  const handlePlaceFurniture = useCallback(() => {
    const pos = playerPos.current;
    // Place slightly in front of player
    const offsetPos = {
      x: Math.round(pos.x - HOME_PLOT_CENTER.x),
      y: 0,
      z: Math.round(pos.z - HOME_PLOT_CENTER.z)
    };
    placeFurnitureAt(selectedFurnitureId, offsetPos, 0);
    setNotice(`Placed ${FURNITURE_CATALOG.find((f) => f.id === selectedFurnitureId)?.name ?? "furniture"} on your home plot.`);
    window.setTimeout(() => setNotice(""), 2000);
  }, [placeFurnitureAt, selectedFurnitureId]);

  const pointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest(".creator, .multiplayer, .systems, .photo-toggle, .dialogue-modal, .build-toolbar, .interaction-prompt")) return;
    drag.current = { active: true, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const pointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current.active || (event.target as HTMLElement).closest(".creator, .multiplayer, .systems, .photo-toggle, .dialogue-modal, .build-toolbar, .interaction-prompt")) return;
    const dx = event.clientX - drag.current.x;
    const dy = event.clientY - drag.current.y;
    drag.current.x = event.clientX;
    drag.current.y = event.clientY;
    cameraInput.current.yaw -= dx * 0.006;
    cameraInput.current.pitch = MathUtils.clamp(cameraInput.current.pitch + dy * 0.02, -1.2, 2);
  };

  const pointerUp = () => {
    drag.current.active = false;
  };

  const timeData = formatTimeOfDay(atmosphere.dayProgress);

  return (
    <div className="scene" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp}>
      <Canvas shadows camera={{ position: [0, 5, 15], fov: 54 }} dpr={[1, 1.75]}>
        <WorldScene
          cameraInput={cameraInput}
          onPositionUpdate={onPositionUpdate}
          appearance={appearance}
          onPlayerUpdate={onPlayerUpdate}
          onInteractKey={handleInteractKey}
          onBuildKey={handleBuildKey}
          remotePlayers={multiplayer.players.filter((player) => player.id !== multiplayer.selfId)}
          homeObjects={systems.home.objects}
          atmosphere={atmosphere}
          emotes={multiplayer.emotes}
          nodeCooldowns={systems.nodeCooldowns}
          targetedId={activePrompt?.id ?? null}
          inBuildMode={inBuildMode}
          selectedFurnitureId={selectedFurnitureId}
          selectedObjectId={selectedObjectId}
          onSelectObject={(id) => setSelectedObjectId(id)}
        />
      </Canvas>

      <div className={`scene-ui ${photoMode ? "photo-mode" : ""}`}>
        <div className="scene-top">
          <div className="brand">
            AFTERLIGHT<small>LUMENFALL CHAPTER · LEVEL {systems.progression.level}</small>
          </div>
          <div className="location">
            <strong>Lumenfall</strong>
            <span>
              {timeData.timeString} · {timeData.phase} · {atmosphere.weather}
            </span>
          </div>
          <button className="photo-toggle" type="button" onClick={() => setPhotoMode((value) => !value)}>
            {photoMode ? "Exit photo" : "Photo mode"}
          </button>
        </div>

        <CharacterCreator
          appearance={appearance}
          onChange={(next) => {
            setAppearance(next);
            setSaved(false);
          }}
          onSave={() => {
            window.localStorage.setItem("afterlight.character.appearance", JSON.stringify(appearance));
            setSaved(true);
          }}
          onLoad={() => {
            const stored = window.localStorage.getItem("afterlight.character.appearance");
            if (stored) {
              setAppearance(JSON.parse(stored));
              setSaved(true);
            }
          }}
          saved={saved}
        />

        <MultiplayerPanel
          status={multiplayer.status}
          session={multiplayer.session}
          selfId={multiplayer.selfId}
          players={multiplayer.players}
          error={multiplayer.error}
          onCreate={multiplayer.createSession}
          onJoin={multiplayer.joinSession}
          onLeave={multiplayer.leaveSession}
        />

        <WorldSystemsPanel
          systems={systems}
          players={multiplayer.players}
          onDiscoverMoonwood={() => systems.discover("moonwood")}
          emotes={multiplayer.emotes}
          onEmote={multiplayer.sendEmote}
        />

        {/* 3D Build Mode Toolbar */}
        {inBuildMode && (
          <div className="build-toolbar">
            <span style={{ color: "#d1b56b", fontSize: "0.7rem", fontWeight: 600, marginRight: "0.4rem" }}>HOME BUILD</span>
            {FURNITURE_CATALOG.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`build-item-btn ${selectedFurnitureId === item.id ? "selected" : ""}`}
                onClick={() => setSelectedFurnitureId(item.id)}
              >
                {item.name}
              </button>
            ))}
            <button type="button" className="primary-action build-action-btn" onClick={handlePlaceFurniture}>
              Place [Space]
            </button>
            {selectedObjectId && (
              <>
                <button type="button" className="secondary-action build-action-btn" onClick={() => rotateFurniture(selectedObjectId)}>
                  Rotate ↻ [R]
                </button>
                <button type="button" className="secondary-action build-action-btn" onClick={() => deleteFurniture(selectedObjectId)}>
                  Store ✕
                </button>
              </>
            )}
            <button type="button" className="secondary-action build-action-btn" onClick={() => setInBuildMode(false)}>
              Exit [B]
            </button>
          </div>
        )}

        {/* Mobile touch dock */}
        <div className="touch-actions-dock">
          {activePrompt && (
            <button className="touch-circle-btn" type="button" onClick={activePrompt.action}>
              E
            </button>
          )}
          <button className="touch-circle-btn" type="button" onClick={handleBuildKey}>
            {inBuildMode ? "✕" : "Build"}
          </button>
        </div>

        <div className="scene-bottom">
          <div className="objective">
            <p className="objective-label">Active Journey</p>
            <p>
              {systems.quests.find((q) => q.state === "active")?.questId
                ? QUEST_CATALOG.find((q) => q.id === systems.quests.find((item) => item.state === "active")?.questId)?.description
                : "Explore Lumenfall, talk to Mira & Oren, gather resources, and build your homestead."}
            </p>
          </div>
          <div className="controls">
            <span className="desktop-only">
              <kbd>W</kbd>
              <kbd>A</kbd>
              <kbd>S</kbd>
              <kbd>D</kbd> move&nbsp;&nbsp; <kbd>SHIFT</kbd> sprint&nbsp;&nbsp; <kbd>E</kbd> interact&nbsp;&nbsp; <kbd>B</kbd> build&nbsp;&nbsp;
            </span>{" "}
            drag to look
          </div>
        </div>
      </div>

      {/* Floating 3D Interaction Prompt */}
      {activePrompt && !activeDialogue && (
        <div className="interaction-prompt" onClick={activePrompt.action} role="button" tabIndex={0}>
          <kbd>E</kbd>
          <span>{activePrompt.label}</span>
        </div>
      )}

      {/* Discovery Banner */}
      {discoveryBanner && (
        <div className="discovery-banner" role="alert">
          <div className="discovery-kicker">✦ Location Discovered</div>
          <div className="discovery-name">{discoveryBanner.name}</div>
          <div className="discovery-desc">{discoveryBanner.description}</div>
        </div>
      )}

      {/* NPC Interactive Dialogue Modal */}
      {activeDialogue && (
        <div className="dialogue-modal">
          <div className="dialogue-card">
            <div className="dialogue-header">
              <span className="dialogue-speaker">{activeDialogue.npc.name}</span>
              <span className="dialogue-status">{npcStateAt(activeDialogue.npc, atmosphere.dayProgress)}</span>
            </div>
            <p className="dialogue-text">
              {activeDialogue.npc.dialogue[activeDialogue.lineIndex % activeDialogue.npc.dialogue.length]}
            </p>

            {activeDialogue.activeQuest && (
              <div className="dialogue-quests">
                <div className="dialogue-quest-title">Thread: {activeDialogue.activeQuest.name}</div>
                <div className="dialogue-quest-desc">{activeDialogue.activeQuest.description}</div>
                <div style={{ color: "#d1b56b", fontSize: "0.68rem" }}>
                  Status: {systems.quests.find((q) => q.questId === activeDialogue.activeQuest?.id)?.state ?? "available"}
                </div>
              </div>
            )}

            <div className="dialogue-actions">
              <button
                type="button"
                className="secondary-action"
                onClick={() =>
                  setActiveDialogue((prev) => (prev ? { ...prev, lineIndex: prev.lineIndex + 1 } : null))
                }
              >
                Next line
              </button>
              <button
                type="button"
                className="primary-action"
                onClick={() => setActiveDialogue(null)}
              >
                Close [E]
              </button>
            </div>
          </div>
        </div>
      )}

      {notice && <div className="interaction" role="status">{notice}</div>}
    </div>
  );
}