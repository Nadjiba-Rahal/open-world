# Continue Afterlight

## What is this project?

Afterlight is a stylized multiplayer 3D fantasy world. The first playable space is Lumenfall, a small social hub intended to grow into exploration, homes, crafting, quests, and shared adventures.

## What has already been implemented?

- Phase 0 foundation: pnpm monorepo, web, mobile, server, shared packages, persistence port, and asset records.
- Phase 1: Lumenfall terrain, paths, water, trees, town geometry, lighting, sky, fog, Rapier ground/body physics, third-person movement, drag camera, and a lantern-stone interaction.
- Phase 2: shared appearance catalog, live 3D placeholder avatar, creator controls, browser save/load, and status documentation.

## What is the current phase?

Phase 2 is complete. Phase 3's first private-session milestone is implemented. Read `docs/PHASE_3_MULTIPLAYER.md` before extending multiplayer.

## Where is the character system?

- `packages/shared/src/index.ts`: `CharacterAppearance`, default appearance, and data-driven option catalogs.
- `apps/web/components/character/CharacterAvatar.tsx`: geometric 3D avatar assembled from appearance data.
- `apps/web/components/character/CharacterCreator.tsx`: creator controls and save/load actions.

## Where is the world system?

`apps/web/components/lumenfall/LumenfallScene.tsx` contains the Canvas, `LumenfallWorld`, Rapier physics setup, lantern-stone interaction, and scene overlay.

## Where is the player controller?

The `PlayerController` function in `apps/web/components/lumenfall/LumenfallScene.tsx` owns keyboard movement, sprinting, rigid-body velocity, facing direction, and the third-person follow camera.

## Where are shared types?

`packages/shared/src/index.ts` contains build phases, world/player identifiers, character appearance data, player snapshots, and the initial realtime message union.

## Where are assets?

The reserved tree is `assets/`. No external game assets are included. Read `docs/ASSET_GUIDE.md`, `docs/ASSET_MANIFEST.md`, and `docs/ASSET_LICENSES.md` before adding anything.

## How does the character creator connect to Lumenfall?

`LumenfallScene` owns the `appearance` state and passes it to `WorldScene`, then `PlayerController`, then `CharacterAvatar`. `CharacterCreator` updates the same state. Save/load currently uses the browser key `afterlight.character.appearance`.

## What is currently temporary?

- The avatar is geometric placeholder art and has no proper rig or animation clips.
- Browser storage is a temporary appearance persistence adapter.
- `packages/database` contains an in-memory adapter, not PostgreSQL persistence.
- `packages/networking` contains the replaceable transport interface and browser WebSocket transport.
- `apps/server` serves `/health` and a standalone `/ws` realtime endpoint with an in-memory authoritative session registry.
- The mobile app is a foundation screen, not mobile gameplay.

## What is currently broken?

Build verification has not been established. The package mirror blocks the pinned Next.js tarball in the isolated web/server install and fails resolving Expo's transitive `send` package in the full workspace install. The CI workflow is prepared in the local staging copy but its `.github/workflows` path was rejected by a GitHub edge filter and is not in the repository.

## What must NOT be rewritten?

- Do not replace the Lumenfall scene or player controller while adding multiplayer.
- Do not replace the shared contracts with app-specific copies.
- Do not make the web client depend on Vercel serverless functions for realtime.
- Do not save frame-by-frame movement to PostgreSQL.
- Do not treat browser storage as final persistence.
- Do not add unverified or copyrighted assets.
- Do not begin Phase 4 systems while Phase 3 is incomplete.

## What does Phase 3 currently implement?

Private multiplayer sessions for 2–8 players are implemented: create a session, join by invite/session code, join a friend, leave, see real players, synchronize position/rotation/basic movement state, display player names, and handle disconnect/reconnect. Keep Lumenfall as the base world. Exclude public matchmaking, MMO scale, combat, guilds, trading, and voice chat. Full requirements are in `docs/PHASE_3_MULTIPLAYER.md`.

Realtime state must remain separate from persistent state. Realtime includes position, rotation, movement/animation state, and session membership. Persistent state includes character, appearance, inventory, quests, home, and progression. Inspect `packages/networking` and `packages/shared` before adding a transport.

## What should happen after Phase 3?

After private sessions are stable, move to Phase 4 persistent homes and cooperative building, then Phase 5 inventory/crafting/cooking/quests/NPCs. Voice, discovery, progression, and mobile gameplay come later.

## Commands

~~~bash
pnpm install
pnpm dev:web
pnpm dev:server
pnpm typecheck
pnpm build
~~~

## Environment and database

Start with `.env.example`. Phase 2 does not require a database. Do not add credentials to the repository. A future PostgreSQL adapter must be used for durable state, separate from realtime movement.

## Asset requirements

Document every missing asset with format, destination, search terms, rig requirements, and licensing requirements. Use placeholders until assets are legally verified.

## Handoff state

The GitHub head before the Phase 3 implementation is `c9fbb4e881d1089bd89607b8e38a0b707ebbaaa9`. The current Phase 3 implementation uses an in-memory session registry and standalone WebSocket transport; no movement is written to the database.

## NEXT ACTION

Phase 1 is complete.
Phase 2 is complete.
Phase 3 core private sessions have been implemented.

The next developer should begin with:

Phase 3 — Private Multiplayer Sessions: browser verification and hardening

Before coding:
1. Read README.md
2. Read docs/BUILD_STATUS.md
3. Read docs/CONTINUE.md
4. Read docs/PHASE_3_MULTIPLAYER.md
5. Inspect the existing architecture
6. Do not rewrite Phase 1 or Phase 2
7. Implement Phase 3 incrementally
8. Commit and push each meaningful milestone