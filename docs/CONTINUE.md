# Continue Afterlight

## Architecture

This is a pnpm TypeScript monorepo. Runnable applications live under apps and platform-neutral systems live under packages. The web app is Next.js, the mobile app is Expo, and the server is a standalone Node boundary. Realtime transport and persistence are ports so their implementations can change without rewriting gameplay code.

## Commands

~~~bash
pnpm install
pnpm dev:web
pnpm dev:server
pnpm typecheck
pnpm build
~~~

## Environment variables

Start with .env.example. The Phase 0 server uses PORT and CORS_ORIGIN when those integrations are added. DATABASE_URL is intentionally only documented for the future PostgreSQL adapter.

## Database setup

No database is required in Phase 0. packages/database defines the persistence port and a memory adapter for development. The persistent PostgreSQL implementation belongs in a later milestone and must remain separate from realtime movement state.

## Current phase

Phase 2 — Character. The web client mounts a hand-authored Lumenfall scene with third-person movement, drag camera input, lighting, terrain, placeholder geometry, Rapier physics, one proximity interaction, and a data-driven 3D humanoid creator.

## Unfinished tasks

- Verify the web dependency set in an environment where the package mirror can serve the pinned Next.js and Three.js packages.
- Add scene-level collision and a small interaction registry instead of keeping interaction targets inside the scene component.
- Replace the provisional browser appearance adapter with server-backed character persistence when the database and account flow arrive.
- Add animation clips and blend states around the current avatar once a licensed rigged asset is approved.
- Replace the realtime placeholder with a server-authoritative WebSocket implementation in Phase 3.
- Add PostgreSQL persistence only when the first durable gameplay feature needs it.

## Asset requirements

Do not download unverified assets. Record every source, creator, license, URL, and destination in the asset documents. Placeholders must carry TODO(ASSET) and keep the insertion path stable.

## Known issues

The mobile client and multiplayer systems are still foundations. The server responds to health checks but does not yet create sessions or synchronize players. The memory adapter is not durable. The CI workflow is prepared locally but its `.github/workflows` write was rejected by a GitHub edge filter; local dependency verification also needs a package mirror that can serve the pinned Next.js, Three.js, and Expo packages.
