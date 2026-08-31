# Build status

| Field | Value |
| --- | --- |
| Current Phase | Batch implementation — Phases 4–15 |
| Next Phase | Browser verification and durable persistence |
| Phase 1 | COMPLETE |
| Phase 2 | COMPLETE |
| Phase 3 | CORE MILESTONE IMPLEMENTED |
| Current branch | `main` |
| Latest feature commit | `b496e9d04fc2270cb2eec1d1af1e53d385b72420` — `feat: add home inventory and crafting systems` |
| Current working features | Lumenfall 3D world, third-person movement, drag camera, Rapier body/ground physics, data-driven placeholder avatar, live character creator, browser save/load adapter, private 2–8 player sessions, invite codes, authoritative movement updates, shared homes with roles and furniture editing, resource gathering, inventory, crafting, quests, NPC dialogue, discoveries, portals, creatures, atmosphere cycle, emotes, and photo mode |
| Build verification | Blocked before compilation by the package mirror refusing pinned Next.js and Expo dependency downloads |
| Dependency mirror problem | Full install fails resolving Expo's transitive `send` package; isolated web/server install fails fetching the pinned Next.js tarball |
| Browser persistence limitation | Appearance save/load uses `localStorage` temporarily; it is not the final persistence layer |
| Character asset limitation | The avatar is geometric placeholder art; a licensed rigged GLB and animation set are still required |
| Multiplayer status | Core milestone implemented; standalone WebSocket server exposes `/ws`, with in-memory invite-only sessions, server-validated movement, home synchronization, permissions, and emotes |
| Mobile status | Shared-contract and touch-input foundation; native 3D rendering remains |
| CI status | `.github/workflows/ci.yml` could not be published because the GitHub edge filter rejected the workflow path |
| Next implementation | Verify the browser flow, then move durable inventory/home/profile persistence from local adapters into the database boundary |