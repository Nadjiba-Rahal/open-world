# Afterlight

Afterlight is a stylized multiplayer 3D fantasy world where friends explore, build, craft, cook, discover hidden worlds, and create their own adventures.

The repository is being built phase by phase. GitHub is the source of truth.

## Feature status

| Feature | Status |
| --- | --- |
| Monorepo foundation | Implemented |
| Web application shell | Implemented |
| Shared game contracts | Implemented |
| Server and realtime boundary | Implemented |
| Mobile foundation | Implemented |
| Asset documentation system | Implemented |
| 3D world | Planned |
| Character customization | Planned |
| Multiplayer rooms | Planned |
| Persistent homes | Planned |
| Inventory, crafting, and cooking | Planned |
| Quests and NPCs | Planned |
| Moonwood exploration | Planned |
| Voice chat | Planned |
| Progression and achievements | Planned |

## Tech stack

- TypeScript with strict compiler settings
- Next.js and React for the web client
- Expo and React Native for the mobile client
- Node.js server boundary for realtime transport
- PostgreSQL adapter boundary for persistent state
- Three.js, React Three Fiber, Drei, and Rapier will be introduced in the 3D world phase

## Architecture

~~~text
apps/web                 Web client and future 3D renderer
apps/mobile              Expo client sharing game contracts
apps/server              Replaceable realtime and HTTP server boundary
packages/shared          Cross-platform domain contracts
packages/game-core       Deterministic, platform-neutral game rules
packages/networking      Typed realtime transport boundary
packages/world-generation Deterministic world data boundary
packages/database        Persistence port and in-memory development adapter
~~~

The client is intentionally not coupled to a deployment provider. Realtime state will be server-authoritative, while durable state will remain separate from frame-by-frame movement.

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

In a second terminal, run the server boundary with pnpm dev:server. The web app runs at http://localhost:3000 and the server health endpoint runs at http://localhost:3001/health.

## Environment variables

Copy .env.example to .env.local for local development. Never commit real secrets. The Phase 0 server does not require a database connection.

## Mobile

The mobile foundation lives in apps/mobile and uses Expo. Run it with the Expo CLI after installing dependencies in the workspace.

## Assets

No external game assets are included yet. See docs/ASSET_GUIDE.md, docs/ASSET_MANIFEST.md, and docs/ASSET_LICENSES.md before adding any asset.

## Roadmap

1. Phase 0: foundation and contracts
2. Phase 1: small, detailed 3D Lumenfall environment
3. Phase 2: data-driven character creator
4. Phase 3: private multiplayer sessions
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
