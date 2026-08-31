import dynamic from "next/dynamic";

const LumenfallScene = dynamic(() => import("../components/lumenfall/LumenfallScene"), {
  ssr: false,
  loading: () => <div className="scene-loading">Preparing Lumenfall...</div>
});

export default function HomePage() {
  return <main className="game-page"><LumenfallScene /></main>;
}
