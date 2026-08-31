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

Phase 0 — Foundation. The next coherent milestone is a hand-authored Lumenfall scene with a third-person camera, movement, lighting, terrain, and placeholder environment geometry.

## Unfinished tasks

- Add Three.js, React Three Fiber, Drei, and Rapier when Phase 1 begins.
- Build the small Lumenfall scene before attempting a large map.
- Add the data-driven character system in Phase 2.
- Replace the realtime placeholder with a server-authoritative WebSocket implementation in Phase 3.
- Add PostgreSQL persistence only when the first durable gameplay feature needs it.

## Asset requirements

Do not download unverified assets. Record every source, creator, license, URL, and destination in the asset documents. Placeholders must carry TODO(ASSET) and keep the insertion path stable.

## Known issues

The web and mobile clients are foundations, not gameplay. The server responds to health checks but does not yet create sessions or synchronize players. The memory adapter is not durable.
