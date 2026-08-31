"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Physics, RigidBody, CapsuleCollider, CuboidCollider, type RapierRigidBody } from "@react-three/rapier";
import { Sky } from "@react-three/drei";
import { createDefaultAppearance, type CharacterAppearance } from "@afterlight/shared";
import { useCallback, useEffect, useRef, useState, type MutableRefObject, type PointerEvent as ReactPointerEvent } from "react";
import type { Group, PerspectiveCamera } from "three";
import { MathUtils, Vector3 } from "three";
import { CharacterAvatar } from "../character/CharacterAvatar";
import { CharacterCreator } from "../character/CharacterCreator";

const WALK_SPEED = 3.8;
const SPRINT_SPEED = 6.3;
const INTERACTION_DISTANCE = 3.2;
const STONE_POSITION = new Vector3(4.5, 0, -3.5);

interface CameraInput {
  yaw: number;
  pitch: number;
}

interface PlayerControllerProps {
  cameraInput: MutableRefObject<CameraInput>;
  onInteract: (position: Vector3) => void;
  appearance: CharacterAppearance;
}

function PlayerController({ cameraInput, onInteract, appearance }: PlayerControllerProps) {
  const body = useRef<RapierRigidBody>(null);
  const model = useRef<Group>(null);
  const { camera } = useThree();
  const keys = useRef(new Set<string>());
  const lastPosition = useRef(new Vector3(0, 1.2, 7));
  const cameraTarget = useRef(new Vector3());

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
  });

  return (
    <RigidBody ref={body} colliders={false} position={[0, 1.2, 7]} enabledRotations={[false, false, false]} linearDamping={5} lockRotations>
      <CapsuleCollider args={[0.55, 0.45]} />
      <CharacterAvatar appearance={appearance} groupRef={model} />
    </RigidBody>
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
      <RigidBody type="fixed" colliders={false}><CuboidCollider args={[2.5, 1.2, 1.6]} position={[0, 1.2, -4]} /></RigidBody>
      <RigidBody type="fixed" colliders={false}><CuboidCollider args={[.75, .5, .75]} position={[4.5, .5, -3.5]} /></RigidBody>
    </>
  );
}

function WorldScene({ cameraInput, onInteract, appearance }: PlayerControllerProps) {
  return (
    <>
      <color attach="background" args={["#9fb5aa"]} />
      <fog attach="fog" args={["#9fb5aa", 18, 38]} />
      <Sky distance={450000} sunPosition={[-5, 7, -4]} inclination={0.48} azimuth={0.22} turbidity={8} rayleigh={1.6} />
      <ambientLight intensity={1.1} color="#d8e1cb" />
      <directionalLight castShadow position={[-8, 12, 6]} intensity={2.2} color="#ffe3ad" shadow-mapSize={[2048, 2048]} />
      <Physics gravity={[0, -16, 0]}>
        <LumenfallWorld />
        <PlayerController cameraInput={cameraInput} onInteract={onInteract} appearance={appearance} />
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
    if (position.distanceTo(STONE_POSITION) <= INTERACTION_DISTANCE) {
      setNotice("The lantern stone hums beneath your hand. Something answers from the forest.");
      window.setTimeout(() => setNotice(""), 4200);
    } else {
      setNotice("Nothing nearby responds.");
      window.setTimeout(() => setNotice(""), 1800);
    }
  }, []);

  const pointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest(".creator")) return;
    drag.current = { active: true, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const pointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current.active || (event.target as HTMLElement).closest(".creator")) return;
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
        <WorldScene cameraInput={cameraInput} onInteract={onInteract} appearance={appearance} />
      </Canvas>
      <div className="scene-ui">
        <div className="scene-top">
          <div className="brand">AFTERLIGHT<small>PHASE 1 / LUMENFALL</small></div>
          <div className="location"><strong>Lumenfall</strong><span>Southern approach</span></div>
        </div>
        <CharacterCreator appearance={appearance} onChange={(next) => { setAppearance(next); setSaved(false); }} onSave={saveAppearance} onLoad={loadAppearance} saved={saved} />
        <div className="scene-bottom">
          <div className="objective"><p className="objective-label">Current thread</p><p>Find the lantern stone near the town path.</p></div>
          <div className="controls"><span className="desktop-only"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> move&nbsp;&nbsp; <kbd>SHIFT</kbd> sprint&nbsp;&nbsp; <kbd>E</kbd> interact&nbsp;&nbsp;</span> drag to look</div>
        </div>
      </div>
      {notice && <div className="interaction" role="status">{notice}</div>}
    </div>
  );
}