"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { Island, PassionScore } from "@/lib/types";

const SAMPLE_ISLANDS: Island[] = [
  { islandId: "1", userId: "demo", name: "Side Project", colorHex: "#C9973B", icon: "💻", archived: false, createdAt: "" },
  { islandId: "2", userId: "demo", name: "Watercolor", colorHex: "#FF6B4A", icon: "🎨", archived: false, createdAt: "" },
  { islandId: "3", userId: "demo", name: "Morning Runs", colorHex: "#5C9EA0", icon: "🏃", archived: false, createdAt: "" },
  { islandId: "4", userId: "demo", name: "Rust Learning", colorHex: "#8B7355", icon: "📚", archived: false, createdAt: "" },
];

const SAMPLE_SCORES: PassionScore[] = [
  { islandId: "3", passionScore: 8.2, mostRecentHoursAgo: 12 },
  { islandId: "4", passionScore: 7.5, mostRecentHoursAgo: 4 },
  { islandId: "1", passionScore: 5.1, mostRecentHoursAgo: 24 },
  { islandId: "2", passionScore: 2.3, mostRecentHoursAgo: 96 },
];

const CompassView = dynamic(
  () => import("@/components/three/CompassView").then((m) => m.CompassView),
  { ssr: false, loading: () => <div className="h-[400px] animate-pulse bg-parchment/5 rounded-xl" /> }
);

export default function LandingPage() {
  const router = useRouter();
  const [focusedIslandId, setFocusedIslandId] = useState<string | undefined>(undefined);

  return (
    <main className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-parchment/10">
        <h1 className="font-display text-2xl font-bold text-brass">Log Pose</h1>
        <div className="flex gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Set Sail</Button>
          </Link>
        </div>
      </header>

      <section className="flex-1 flex flex-col lg:flex-row items-center gap-8 px-6 py-12 max-w-6xl mx-auto w-full">
        <div className="flex-1 space-y-6 text-center lg:text-left">
          <h2 className="font-display text-4xl md:text-5xl font-bold leading-tight">
            Chart what burns brightest{" "}
            <span className="text-ember">right now</span>
          </h2>
          <p className="text-lg text-parchment/70 max-w-lg mx-auto lg:mx-0">
            Log Pose is a passion tracker disguised as a ship&apos;s compass.
            Your projects are islands. Log time, mood, and notes — the needle
            drifts toward what you&apos;re most obsessed with. Neglect an island
            and its light fades.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Set Sail — It&apos;s Free
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                Continue as Guest
              </Button>
            </Link>
          </div>
          <p className="font-mono text-xs text-parchment/40">
            Passion scores computed in Snowflake · Decay + Cortex sentiment
          </p>
        </div>

        <div className="flex-1 w-full h-[400px] lg:h-[500px] rounded-xl overflow-hidden border border-brass/20">
          <CompassView 
            islands={SAMPLE_ISLANDS} 
            scores={SAMPLE_SCORES} 
            focusedIslandId={focusedIslandId}
            onIslandClick={(id) => {
              if (!id || focusedIslandId === id) setFocusedIslandId(undefined);
              else setFocusedIslandId(id);
            }}
            onNavigate={() => router.push("/signup")}
          />
        </div>
      </section>

      <footer className="px-6 py-4 border-t border-parchment/10 text-center text-sm text-parchment/40">
        Built for DEV Weekend Challenge — Passion Edition
      </footer>
    </main>
  );
}
