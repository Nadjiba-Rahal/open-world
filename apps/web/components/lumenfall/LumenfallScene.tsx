"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Physics, RigidBody, CapsuleCollider, CuboidCollider, type RapierRigidBody } from "@react-three/rapier";
import { Sky, Text } from "@react-three/drei";
import { NPC_CATALOG, createDefaultAppearance, FURNITURE_CATALOG, type CharacterAppearance, type HomeObject, type MovementState, type NpcDefinition, type PlayerId, type PlayerSnapshot } from "@afterlight/shared";
import { npcStateAt } from "@afterlight/game-core";
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
const SPRINT_SPEED = 6.3;
const INTERACTION_DISTANCE = 3.2;
const STONE_POSITION = new Vector3(4.5, 0, -3.5);
const RESOURCE_SPOTS = [
  { itemId: "wood", position: [-7, 0, 5] as [number, number, number], color: "#79543c" },
  { itemId: "stone", position: [-10, 0, -2] as [number, number, number], color: "#8b9690" },
  { itemId: "flowers", position: [7, 0, 5] as [number, number, number], color: "#d08c91" },
  { itemId: "herbs", position: [9, 0, -1] as [number, number, number], color: "#7fa26b" },
  { itemId: "fruit", position: [-5, 0, -9] as [number, number, number], color: "#bd6d5e" }
];

interface CameraInput {
  yaw: number;
  pitch: number;
}

interface PlayerControllerProps {
  cameraInput: MutableRefObject<CameraInput>;
  onInteract: (position: Vector3) => void;
  appearance: CharacterAppearance;
  onPlayerUpdate?: (update: Pick<PlayerSnapshot, "position" | "rotation" | "movement">) => void;
}

function PlayerController({ cameraInput, onInteract, appearance, onPlayerUpdate }: PlayerControllerProps) {
  const body = useRef<RapierRigidBody>(null);
  const model = useRef<Group>(null);
  const { camera } = useThree();
  const keys = useRef(new Set<string>());
  const lastPosition = useRef(new Vector3(0, 1.2, 7));
  const cameraTarget = useRef(new Vector3());
  const syncClock = useRef(0);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      keys.current.add(event.key.toLowerCase());
      if (event.key.toLowerCase() === "e") {
        const position = body.current?.translation();
        if (position) onInteract(new Vector3(position.x, position.y, position.z));
      }
    };
    const up = (event: KeyboardEvent) => keys.current.delete(event.key.toLowerCase());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [onInteract]);

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

function RemotePlayer({ player }: { player: PlayerSnapshot }) {
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
      <Text position={[0, 2.15, 0]} fontSize={0.22} color="#fff6d9" outlineColor="#17201b" outlineWidth={0.025} anchorX="center" anchorY="middle">
        {player.displayName}
      </Text>
    </group>
  );
}

function ResourceNode({ itemId, position, color }: (typeof RESOURCE_SPOTS)[number]) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, .28, 0]} scale={itemId === "wood" ? [1.2, .55, .65] : [1, 1, 1]}>
        {itemId === "wood" ? <boxGeometry args={[1.1, .45, .45]} /> : <dodecahedronGeometry args={[.38, 0]} />}
        <meshStandardMaterial color={color} roughness={.9} />
      </mesh>
      <mesh position={[0, .7, 0]} scale={.35}>
        <sphereGeometry args={[.5, 8, 6]} />
        <meshStandardMaterial color={color} transparent opacity={.22} emissive={color} emissiveIntensity={.35} />
      </mesh>
    </group>
  );
}

function HomeFurniture({ object }: { object: HomeObject }) {
  const item = FURNITURE_CATALOG.find((candidate) => candidate.id === object.furnitureId) ?? FURNITURE_CATALOG[0];
  if (!item) return null;
  return (
    <group position={[object.position.x, object.position.y, object.position.z]} rotation={[0, object.rotation, 0]}>
      <mesh castShadow position={[0, .35, 0]}>
        <boxGeometry args={[item.footprint[0], .7, item.footprint[1]]} />
        <meshStandardMaterial color={item.color} roughness={.86} />
      </mesh>
      <mesh position={[0, .76, 0]} scale={[item.footprint[0] * .35, .08, item.footprint[1] * .35]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#d1b56b" emissive="#d1b56b" emissiveIntensity={item.category === "lighting" ? 1.2 : .05} />
      </mesh>
    </group>
  );
}

function HomeRoom({ objects }: { objects: HomeObject[] }) {
  return (
    <group position={[-5.8, 0, 5.7]}>
      <mesh receiveShadow position={[0, -.04, 0]}>
        <boxGeometry args={[9, .08, 6]} />
        <meshStandardMaterial color="#8f8268" roughness={1} />
      </mesh>
      <mesh receiveShadow position={[0, .03, -2.8]}>
        <boxGeometry args={[9, .05, .15]} />
        <meshStandardMaterial color="#5d554c" roughness={1} />
      </mesh>
      {objects.map((object) => <HomeFurniture key={object.id} object={object} />)}
    </group>
  );
}

function Tree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, 1.25, 0]}>
        <cylinderGeometry args={[0.22, 0.36, 2.5, 7]} />
        <meshStandardMaterial color="#594333" roughness={1} />
      </mesh>
      <mesh castShadow position={[0, 2.8, 0]}>
        <icosahedronGeometry args={[1.35, 1]} />
        <meshStandardMaterial color="#476451" roughness={1} />
      </mesh>
      <mesh castShadow position={[0.35, 3.35, 0.1]} scale={0.65}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#6b8360" roughness={1} />
      </mesh>
    </group>
  );
}

function NpcMarker({ npc }: { npc: NpcDefinition }) {
  return (
    <group position={[npc.position.x, npc.position.y, npc.position.z]}>
      <mesh castShadow position={[0, .75, 0]}>
        <capsuleGeometry args={[.35, .8, 6, 10]} />
        <meshStandardMaterial color={npc.id === "mira" ? "#8d5d68" : "#536477"} roughness={.9} />
      </mesh>
      <mesh castShadow position={[0, 1.35, 0]}>
        <sphereGeometry args={[.3, 12, 8]} />
        <meshStandardMaterial color="#c98b64" roughness={.8} />
      </mesh>
      <Text position={[0, 1.95, 0]} fontSize={.18} color="#fff6d9" outlineColor="#17201b" outlineWidth={.02} anchorX="center">{npc.name}</Text>
    </group>
  );
}

function PortalMarker({ position, name, locked }: { position: [number, number, number]; name: string; locked: boolean }) {
  return (
    <group position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 1.4, 0]}>
        <torusGeometry args={[1.1, .13, 10, 24]} />
        <meshStandardMaterial color={locked ? "#7d7185" : "#8aab6b"} emissive={locked ? "#3e304b" : "#314d3c"} emissiveIntensity={1.4} />
      </mesh>
      <Text position={[0, 2.8, 0]} fontSize={.2} color={locked ? "#c2b1c8" : "#d6e3bb"} outlineColor="#17201b" outlineWidth={.02} anchorX="center">{name}</Text>
    </group>
  );
}

function LumenfallWorld() {
  const trees: Array<[number, number, number, number]> = [
    [-11, 0, -8, 1.1], [-8, 0, -13, 0.8], [-3, 0, -14, 1.2], [9, 0, -12, 1], [14, 0, -5, 1.2],
    [-14, 0, 4, 1], [14, 0, 7, 1.1], [-10, 0, 12, 1.25], [5, 0, 13, .9], [12, 0, 13, 1.25]
  ];
  return (
    <>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[42, 42]} />
        <meshStandardMaterial color="#71856c" roughness={1} />
      </mesh>
      <RigidBody type="fixed" colliders={false}><CuboidCollider args={[21, 0.1, 21]} position={[0, -0.2, 0]} /></RigidBody>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 2]}><planeGeometry args={[4, 25]} /><meshStandardMaterial color="#b7a27b" roughness={1} /></mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -2]}><planeGeometry args={[25, 3.4]} /><meshStandardMaterial color="#b7a27b" roughness={1} /></mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[-8, 0.04, 1]}><planeGeometry args={[7, 3]} /><meshStandardMaterial color="#88a5a0" roughness={0.35} metalness={0.1} /></mesh>
      <group position={[0, 0, -4]}>
        <mesh castShadow position={[0, 1.25, 0]}><boxGeometry args={[5, 2.5, 3.2]} /><meshStandardMaterial color="#6e5844" roughness={1} /></mesh>
        <mesh castShadow position={[0, 3, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[3.4, 2, 4]} /><meshStandardMaterial color="#7d4f43" roughness={.9} /></mesh>
        <mesh castShadow position={[0, 1.6, 1.62]}><boxGeometry args={[.9, 1.4, .1]} /><meshStandardMaterial color="#273b38" emissive="#152522" emissiveIntensity={.5} /></mesh>
      </group>
      <group position={[4.5, 0, -3.5]}>
        <mesh castShadow position={[0, .5, 0]}><cylinderGeometry args={[.6, .75, 1, 8]} /><meshStandardMaterial color="#7e8990" roughness={.95} /></mesh>
        <pointLight color="#f3c977" intensity={1.6} distance={5} position={[0, 1.5, 0]} />
        <mesh position={[0, 1.55, 0]}><sphereGeometry args={[.18, 12, 8]} /><meshStandardMaterial color="#ffe9a8" emissive="#f2b85d" emissiveIntensity={2} /></mesh>
      </group>
      {trees.map(([x, y, z, scale]) => <Tree key={`${x}-${z}`} position={[x, y, z]} scale={scale} />)}
      {RESOURCE_SPOTS.map((spot) => <ResourceNode key={spot.itemId} {...spot} />)}
      {NPC_CATALOG.map((npc) => <NpcMarker key={npc.id} npc={npc} />)}
      <PortalMarker position={[-13, 0, -10]} name="Moonwood trail" locked={false} />
      <PortalMarker position={[13, 0, -10]} name="The quiet portal" locked />
      <RigidBody type="fixed" colliders={false}><CuboidCollider args={[2.5, 1.2, 1.6]} position={[0, 1.2, -4]} /></RigidBody>
      <RigidBody type="fixed" colliders={false}><CuboidCollider args={[.75, .5, .75]} position={[4.5, .5, -3.5]} /></RigidBody>
    </>
  );
}

function WorldScene({ cameraInput, onInteract, appearance, onPlayerUpdate, remotePlayers, homeObjects }: PlayerControllerProps & { remotePlayers: PlayerSnapshot[]; homeObjects: HomeObject[] }) {
  return (
    <>
      <color attach="background" args={["#9fb5aa"]} />
      <fog attach="fog" args={["#9fb5aa", 18, 38]} />
      <Sky distance={450000} sunPosition={[-5, 7, -4]} inclination={0.48} azimuth={0.22} turbidity={8} rayleigh={1.6} />
      <ambientLight intensity={1.1} color="#d8e1cb" />
      <directionalLight castShadow position={[-8, 12, 6]} intensity={2.2} color="#ffe3ad" shadow-mapSize={[2048, 2048]} />
      <Physics gravity={[0, -16, 0]}>
        <LumenfallWorld />
        <PlayerController cameraInput={cameraInput} onInteract={onInteract} appearance={appearance} onPlayerUpdate={onPlayerUpdate} />
        {remotePlayers.map((player) => <RemotePlayer key={player.id} player={player} />)}
        <HomeRoom objects={homeObjects} />
      </Physics>
    </>
  );
}

export default function LumenfallScene() {
  const cameraInput = useRef<CameraInput>({ yaw: 0, pitch: 0 });
  const drag = useRef({ active: false, x: 0, y: 0 });
  const [notice, setNotice] = useState("");
  const [appearance, setAppearance] = useState<CharacterAppearance>(() => createDefaultAppearance());
  const [saved, setSaved] = useState(false);
  const multiplayer = useMultiplayerSession(appearance);
  const systems = useWorldSystems({
    ownerId: (multiplayer.selfId ?? "local-player") as PlayerId,
    remoteHome: multiplayer.home,
    onHomeChange: multiplayer.updateHome
  });
  const { gather, discover } = systems;
  const onPlayerUpdate = useCallback((update: Pick<PlayerSnapshot, "position" | "rotation" | "movement">) => {
    multiplayer.updatePlayer(update);
  }, [multiplayer.updatePlayer]);

  useEffect(() => {
    const stored = window.localStorage.getItem("afterlight.character.appearance");
    if (!stored) return;
    try {
      const candidate = JSON.parse(stored) as Partial<CharacterAppearance>;
      setAppearance({
        ...createDefaultAppearance(),
        ...candidate,
        accessories: Array.isArray(candidate.accessories) ? candidate.accessories : createDefaultAppearance().accessories
      });
      setSaved(true);
    } catch {
      window.localStorage.removeItem("afterlight.character.appearance");
    }
  }, []);

  const saveAppearance = useCallback(() => {
    window.localStorage.setItem("afterlight.character.appearance", JSON.stringify(appearance));
    setSaved(true);
  }, [appearance]);

  const loadAppearance = useCallback(() => {
    const stored = window.localStorage.getItem("afterlight.character.appearance");
    if (!stored) return;
    try {
      const candidate = JSON.parse(stored) as Partial<CharacterAppearance>;
      setAppearance({
        ...createDefaultAppearance(),
        ...candidate,
        accessories: Array.isArray(candidate.accessories) ? candidate.accessories : createDefaultAppearance().accessories
      });
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }, []);

  const onInteract = useCallback((position: Vector3) => {
    const resource = RESOURCE_SPOTS.find((spot) => position.distanceTo(new Vector3(...spot.position)) <= INTERACTION_DISTANCE);
    if (resource) {
      gather(resource.itemId);
      setNotice(`You gathered ${resource.itemId}. Your pack has been updated.`);
      window.setTimeout(() => setNotice(""), 1800);
      return;
    }
    if (position.distanceTo(STONE_POSITION) <= INTERACTION_DISTANCE) {
      discover("lantern-stone");
      setNotice("The lantern stone hums beneath your hand. Something answers from the forest.");
      window.setTimeout(() => setNotice(""), 4200);
      return;
    }
    const npc = NPC_CATALOG.find((candidate) => position.distanceTo(new Vector3(candidate.position.x, candidate.position.y, candidate.position.z)) <= INTERACTION_DISTANCE);
    if (npc) {
      const line = npc.dialogue[Math.floor(Date.now() / 6000) % npc.dialogue.length] ?? npc.dialogue[0] ?? "The town is quiet.";
      setNotice(`${npc.name} · ${npcStateAt(npc, (Date.now() % 1_200_000) / 1_200_000)} — ${line}`);
      window.setTimeout(() => setNotice(""), 4200);
      return;
    }
    setNotice("Nothing nearby responds.");
    window.setTimeout(() => setNotice(""), 1800);
  }, [discover, gather]);

  const pointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest(".creator, .multiplayer, .systems")) return;
    drag.current = { active: true, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const pointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current.active || (event.target as HTMLElement).closest(".creator, .multiplayer, .systems")) return;
    const dx = event.clientX - drag.current.x;
    const dy = event.clientY - drag.current.y;
    drag.current.x = event.clientX;
    drag.current.y = event.clientY;
    cameraInput.current.yaw -= dx * 0.006;
    cameraInput.current.pitch = MathUtils.clamp(cameraInput.current.pitch + dy * 0.02, -1.2, 2);
  };
  const pointerUp = () => { drag.current.active = false; };

  return (
    <div className="scene" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp}>
      <Canvas shadows camera={{ position: [0, 5, 15], fov: 54 }} dpr={[1, 1.75]}>
        <WorldScene cameraInput={cameraInput} onInteract={onInteract} appearance={appearance} onPlayerUpdate={onPlayerUpdate} remotePlayers={multiplayer.players.filter((player) => player.id !== multiplayer.selfId)} homeObjects={systems.home.objects} />
      </Canvas>
      <div className="scene-ui">
        <div className="scene-top">
          <div className="brand">AFTERLIGHT<small>PHASE 1 / LUMENFALL</small></div>
          <div className="location"><strong>Lumenfall</strong><span>Southern approach</span></div>
        </div>
        <CharacterCreator appearance={appearance} onChange={(next) => { setAppearance(next); setSaved(false); }} onSave={saveAppearance} onLoad={loadAppearance} saved={saved} />
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
        <WorldSystemsPanel systems={systems} players={multiplayer.players} onDiscoverMoonwood={() => systems.discover("moonwood")} />
        <div className="scene-bottom">
          <div className="objective"><p className="objective-label">Current thread</p><p>Find the lantern stone near the town path.</p></div>
          <div className="controls"><span className="desktop-only"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> move&nbsp;&nbsp; <kbd>SHIFT</kbd> sprint&nbsp;&nbsp; <kbd>E</kbd> interact&nbsp;&nbsp;</span> drag to look</div>
        </div>
      </div>
      {notice && <div className="interaction" role="status">{notice}</div>}
    </div>
  );
}