# Afterlight

Afterlight is a stylized multiplayer 3D fantasy world where friends explore, build, craft, cook, discover hidden worlds, and create their own adventures.

The repository is being built phase by phase. Phase 3 is the current implementation focus, and GitHub is the source of truth.

## Feature status

| Feature | Status |
| --- | --- |
| Monorepo foundation | Implemented |
| Web application shell | Implemented |
| Shared game contracts | Implemented |
| Server and realtime boundary | Implemented |
| Mobile foundation | Implemented |
| Asset documentation system | Implemented |
| Lumenfall 3D world | Implemented |
| Data-driven character creator | Implemented |
| Browser appearance save/load | Implemented (temporary) |
| Multiplayer rooms | Implemented (private Phase 3 milestone) |
| Persistent homes | Planned |
| Inventory, crafting, and cooking | Planned |
| Quests and NPCs | Planned |
| Moonwood exploration | Planned |
| Voice chat | Planned |
| Progression and achievements | Planned |

## Current phase

**Phase 2 complete.** The web client has a small playable Lumenfall scene and a data-driven placeholder humanoid whose appearance can be edited live and saved or loaded in the browser.

**Phase 3 in progress.** The first private-session milestone is implemented: create or join a 2–8 player invite-only room, see shared player avatars and names, synchronize movement/rotation/basic movement state, leave, and reconnect after a short disconnect. The realtime server is standalone and authoritative for room membership and movement bounds.

## Tech stack

- TypeScript with strict compiler settings
- Next.js and React for the web client
- Expo and React Native for the mobile client
- Node.js server boundary for realtime transport
- PostgreSQL adapter boundary for persistent state
- Three.js, React Three Fiber, Drei, and Rapier for the web world renderer
- Data-driven character catalog shared by web and mobile

## Architecture

~~~text
apps/web                 Web client, Lumenfall renderer, and character creator
apps/mobile              Expo foundation sharing game contracts
apps/server              Replaceable realtime and HTTP server boundary
packages/shared          Cross-platform domain contracts
packages/game-core       Deterministic, platform-neutral game rules
packages/networking      Typed realtime transport boundary
packages/world-generation Deterministic world data boundary
packages/database        Persistence port and in-memory development adapter
~~~

The client is intentionally not coupled to a deployment provider. Realtime state will be server-authoritative, while durable state will remain separate from frame-by-frame movement. The networking and database packages are ports, not finished services.

## Project structure

~~~text
apps/                 Runnable applications
packages/             Shared platform-neutral systems
assets/               Licensed assets and documented placeholders
docs/                 Build, continuation, and asset records
scripts/              Repository maintenance scripts
~~~

## Getting started

Requirements: Node.js 20 or newer and pnpm 9 or newer.

~~~bash
pnpm install
pnpm dev:web
~~~

In a second terminal, run the realtime server boundary with pnpm dev:server. The web app runs at http://localhost:3000, the server health endpoint runs at http://localhost:3001/health, and the WebSocket endpoint is ws://localhost:3001/ws.

## Environment variables

Copy .env.example to .env.local for local development. Never commit real secrets. The current server does not require a database connection.

## Mobile

The mobile foundation lives in apps/mobile and uses Expo. The shared contracts are ready, but mobile gameplay and controls are not implemented.

## Assets

No external game assets are included yet. See docs/ASSET_GUIDE.md, docs/ASSET_MANIFEST.md, and docs/ASSET_LICENSES.md before adding any asset.

The current character is geometric placeholder art. Character appearance persistence currently uses browser storage as a temporary adapter; it must move to server/database persistence later. Build verification is currently blocked before compilation by the package mirror refusing the pinned Next.js and Expo dependency downloads.

## Roadmap

1. Phase 0: foundation and contracts
2. Phase 1: small, detailed 3D Lumenfall environment
3. Phase 2: data-driven character creator and provisional save/load
4. Phase 3: private multiplayer sessions (current)
5. Phase 4: persistent homes and cooperative building
6. Phase 5: inventory, crafting, cooking, quests, and NPCs
7. Phase 6: Moonwood exploration and discovery
8. Phase 7: social systems, voice architecture, and photo mode
9. Phase 8: progression
10. Phase 9: mobile gameplay
11. Phase 10: optimization

## Contributing

Keep changes small and coherent. Update the status and continuation documents at each meaningful milestone. Use clear commit messages and do not add unverified assets or secrets.

## License

The project license will be selected before the first public release. Until then, asset licensing is tracked separately in docs/ASSET_LICENSES.md.
