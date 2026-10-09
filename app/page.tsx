"use client";
import { useState } from "react";
import Play from "./play";
import Reference from "./reference";

const TABS = [
  ["play", "🎾", "Match"],
  ["rules", "📖", "Rules"],
  ["flow", "🔄", "Flow"],
  ["scoring", "🔢", "Scoring"],
] as const;

export default function Home() {
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("play");
  return (
    <main className="grid h-dvh w-screen grid-rows-[9dvh_1fr_11dvh] overflow-hidden">
      <header className="flex items-center justify-center bg-gray-900 text-xl font-black text-white">Padel Quick Start</header>
      <div className="min-h-0">
        {/* Play stays mounted so tab switches never lose state */}
        <div className="h-full" hidden={tab !== "play"}><Play /></div>
        {tab !== "play" && <Reference tab={tab} />}
      </div>
      <nav className="grid grid-cols-4 border-t-2 border-gray-900 bg-white">
        {TABS.map(([id, icon, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex min-h-11 flex-col items-center justify-center text-sm font-black ${tab === id ? "bg-yellow-300" : ""}`}>
            <span className="text-2xl">{icon}</span>{label}
          </button>
        ))}
      </nav>
    </main>
  );
}
