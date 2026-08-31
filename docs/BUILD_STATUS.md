# Build status

| Field | Value |
| --- | --- |
| Current Phase | Phase 3 — Private Multiplayer Sessions |
| Next Phase | Phase 4 — Persistent Homes and Cooperative Building |
| Phase 1 | COMPLETE |
| Phase 2 | COMPLETE |
| Phase 3 | CORE MILESTONE IMPLEMENTED |
| Current branch | `main` |
| Latest feature commit | `339f0583f7a70283e8e92d7b5d8b44b066f28f4d` — `feat: add data-driven character creator` |
| Current working features | Lumenfall 3D world, third-person movement, drag camera, Rapier body/ground physics, data-driven placeholder avatar, live character creator, browser save/load adapter, private 2–8 player sessions, invite codes, authoritative movement updates, names, leave, and reconnect grace period |
| Build verification | Blocked before compilation by the package mirror refusing pinned Next.js and Expo dependency downloads |
| Dependency mirror problem | Full install fails resolving Expo's transitive `send` package; isolated web/server install fails fetching the pinned Next.js tarball |
| Browser persistence limitation | Appearance save/load uses `localStorage` temporarily; it is not the final persistence layer |
| Character asset limitation | The avatar is geometric placeholder art; a licensed rigged GLB and animation set are still required |
| Multiplayer status | Core milestone implemented; standalone WebSocket server exposes `/ws`, with in-memory invite-only sessions and server-validated movement |
| Mobile status | Foundation only; gameplay controls and 3D mobile rendering are not implemented |
| CI status | `.github/workflows/ci.yml` could not be published because the GitHub edge filter rejected the workflow path |
| Next implementation | Test the browser flow with two clients, then harden the transport or begin Phase 4 only after explicit approval |