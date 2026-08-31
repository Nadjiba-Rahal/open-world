# Phase 3 — Private Multiplayer Sessions

This document is the Phase 3 scope and implementation record.

## Goal

Add small, private multiplayer sessions to the existing single-player Lumenfall world without replacing the Phase 1 scene or Phase 2 character system.

## Initial target

Support 2–8 real players per invite-only session.

## Required player flows

1. Create a private session.
2. Receive or join with an invite/session code.
3. Join a friend's session.
4. Leave a session.
5. See other real players in Lumenfall.
6. Synchronize position and rotation.
7. Synchronize basic movement/animation state.
8. Display player names.
9. Handle disconnect and reconnect.

## Explicitly out of scope

Do not build public matchmaking, massive MMO infrastructure, combat, guilds, trading, or voice chat in Phase 3. Those belong to later milestones.

## Architecture constraints

The frontend must remain independently deployable, including on Vercel. The realtime server must remain replaceable and must not be tightly coupled to Vercel serverless functions.

Inspect these existing boundaries before coding:

- `packages/shared`: `RealtimeMessage`, `PlayerSnapshot`, and identifiers.
- `packages/networking`: `RealtimeTransport` and `SessionDescriptor`.
- `apps/server`: current standalone server entry point.
- `apps/web/components/lumenfall/LumenfallScene.tsx`: current world, player controller, and avatar mount.

Use a typed transport boundary so a WebSocket server or another realtime provider can be substituted without rewriting the game. The server must validate session membership and movement payloads; never trust the client.

## Realtime versus persistent state

Realtime state:

- player position
- player rotation
- movement state
- basic animation state
- session membership

Persistent state:

- character
- appearance
- inventory
- quests
- home
- progression

Do not save movement every frame to PostgreSQL. Persist snapshots or durable changes at deliberate boundaries instead.

## Suggested milestone order

1. Add a server-authoritative session registry with invite-only codes.
2. Add connect/join/leave/reconnect messages to the typed protocol.
3. Add a replaceable WebSocket transport implementation.
4. Render remote players using the existing appearance/avatar path.
5. Synchronize movement, rotation, names, and basic state.
6. Add disconnect/reconnect handling and server validation.
7. Update tests, README, BUILD_STATUS, and CONTINUE only after the flow works.

## Acceptance checklist

- Two browser windows can create and join the same private Lumenfall session.
- Both windows see distinct real players, not fake placeholders.
- Movement and rotation update for both players.
- Player names render above remote avatars.
- Leaving removes the player.
- A temporary disconnect can reconnect without corrupting the session.
- The existing local character creator still updates the local avatar.
- No movement frame stream is written to the database.

## Current implementation

The first milestone is implemented in:

- `apps/server/src/index.ts`: in-memory invite-only session registry, 2–8 player limit, server-generated invite codes and player IDs, movement validation, leave, and a 30-second reconnect grace period.
- `apps/server/src/websocket.ts`: standalone RFC 6455 text transport with no provider-specific dependency.
- `packages/networking/src/index.ts`: replaceable `RealtimeTransport` contract and browser WebSocket implementation.
- `apps/web/components/multiplayer/`: create/join/leave UI and reconnect-aware session hook.
- `apps/web/components/lumenfall/LumenfallScene.tsx`: remote avatar rendering through the existing `CharacterAvatar` and 10Hz movement updates.

The server keeps realtime state in memory. Character appearance is sent with session membership and reused by remote avatars; it is not persisted as frame-by-frame movement. A two-client protocol smoke test has passed locally. Full browser build verification remains blocked by the documented dependency mirror problem.