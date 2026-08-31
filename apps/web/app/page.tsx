import { CURRENT_PHASE, PHASES, type BuildPhase } from "@afterlight/shared";

const phaseLabels: Record<BuildPhase, string> = {
  foundation: "Foundation", world: "3D world", character: "Character", multiplayer: "Multiplayer", home: "Homes",
  gameplay: "Gameplay", exploration: "Exploration", social: "Social", progression: "Progression", mobile: "Mobile", optimization: "Optimization"
};

export default function HomePage() {
  return <main className="shell">
    <section className="hero" aria-labelledby="title">
      <p className="eyebrow">AFTERLIGHT / PHASE 0</p>
      <h1 id="title">A world worth returning to.</h1>
      <p className="lede">A stylized multiplayer fantasy world for exploration, craft, quiet discovery, and shared moments.</p>
      <div className="status" role="status"><span className="status-dot" aria-hidden="true" /> Foundation online</div>
      <p className="phase-note">Current build phase: {CURRENT_PHASE}</p>
    </section>
    <section className="roadmap" aria-labelledby="roadmap-title">
      <div><p className="eyebrow">BUILD ROADMAP</p><h2 id="roadmap-title">The path into the world</h2></div>
      <ol>{PHASES.map((phase, index) => <li className={index === 0 ? "active" : ""} key={phase}><span>{String(index).padStart(2, "0")}</span>{phaseLabels[phase]}</li>)}</ol>
    </section>
  </main>;
}
