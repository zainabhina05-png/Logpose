"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { LogEntryModal } from "@/components/LogEntryModal";
import { IslandCard } from "@/components/IslandCard";
import { ShareCard } from "@/components/ShareCard";
import { CompassView } from "@/components/three/CompassView";
import { useToast } from "@/components/ui/Toast";
import { useAchievements, checkAchievements } from "@/components/AchievementSystem";
import { getLeadingIslandId, computeStreak } from "@/lib/compass-utils";
import type { Island, PassionScore, Entry } from "@/lib/types";

const ISLAND_COLORS = [
  "#C9973B", // brass
  "#FF6B4A", // ember
  "#5C9EA0", // teal
  "#8B7355", // earth
  "#7B68EE", // lavender
  "#2E8B57", // sea green
];

const ISLAND_ICONS = ["⚡", "🎨", "🏃", "📚", "🎵", "🌿", "💻", "🔬", "✈️", "🎯", "🏋️", "🎮"];

function TodayStats({ entries }: { entries: Entry[] }) {
  const today = new Date().toDateString();
  const todayEntries = entries.filter(
    (e) => new Date(e.loggedAt).toDateString() === today
  );
  const totalMin = todayEntries.reduce((sum, e) => sum + e.minutesSpent, 0);
  const avgMood =
    todayEntries.length > 0
      ? todayEntries.reduce((sum, e) => sum + e.moodScore, 0) / todayEntries.length
      : null;

  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  if (todayEntries.length === 0) return null;

  return (
    <div className="rounded-xl border border-parchment/10 bg-parchment/3 p-4">
      <p className="text-xs font-mono uppercase tracking-wider text-parchment/40 mb-3">Today</p>
      <div className="flex gap-4">
        <div>
          <p className="font-display text-2xl text-brass">{timeStr}</p>
          <p className="text-xs text-parchment/50">logged</p>
        </div>
        {avgMood !== null && (
          <div>
            <p className="font-display text-2xl text-ember">
              {["😴", "😐", "🙂", "😊", "🔥"][Math.round(avgMood) - 1]}
            </p>
            <p className="text-xs text-parchment/50">avg mood</p>
          </div>
        )}
        <div>
          <p className="font-display text-2xl text-parchment/80">{todayEntries.length}</p>
          <p className="text-xs text-parchment/50">sessions</p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { push: pushAchievements, reset: resetAchievements } = useAchievements();
  const [islands, setIslands] = useState<Island[]>([]);
  const [scores, setScores] = useState<PassionScore[]>([]);
  const [allEntries, setAllEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [quickLogIslandId, setQuickLogIslandId] = useState<string | undefined>(undefined);

  // Add island state
  const [showAddIsland, setShowAddIsland] = useState(false);
  const [newIslandName, setNewIslandName] = useState("");
  const [newIslandColor, setNewIslandColor] = useState(ISLAND_COLORS[0]);
  const [newIslandIcon, setNewIslandIcon] = useState(ISLAND_ICONS[0]);
  const [addingIsland, setAddingIsland] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Compass interaction state
  const [focusedIslandId, setFocusedIslandId] = useState<string | undefined>(undefined);

  const fetchData = useCallback(async () => {
    try {
      const [islandsRes, scoresRes, entriesRes] = await Promise.all([
        fetch("/api/islands"),
        fetch("/api/passion-scores"),
        fetch("/api/entries?limit=100"),
      ]);
      if (islandsRes.status === 401) {
        router.push("/login");
        return;
      }
      const islandsData = await islandsRes.json();
      const scoresData = await scoresRes.json();
      const entriesData = entriesRes.ok ? await entriesRes.json() : { entries: [] };
      setIslands(islandsData.islands ?? []);
      setScores(scoresData.scores ?? []);
      setAllEntries(entriesData.entries ?? []);
    } catch {
      toast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  }, [router, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Passive score refresh every 20s
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetch("/api/passion-scores")
          .then((r) => r.json())
          .then((d) => setScores(d.scores ?? []))
          .catch(() => {});
      }
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut: N = open log modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === "n" &&
        !e.metaKey && !e.ctrlKey &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(
          (e.target as HTMLElement)?.tagName ?? ""
        )
      ) {
        if (islands.length > 0) {
          setQuickLogIslandId(undefined);
          setModalOpen(true);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [islands]);

  const handleLogEntry = async (data: {
    islandId: string;
    minutesSpent: number;
    moodScore: number;
    note?: string;
  }) => {
    const res = await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await res.json();
    if (!res.ok) throw body;
    toast("Entry logged! ⚓", "success");

    // Check achievements
    const newTotalMinutes = allEntries.reduce((sum, e) => sum + e.minutesSpent, 0) + data.minutesSpent;
    const newStreak = computeStreak([...allEntries, body.entry]);
    const earned = checkAchievements({
      totalEntries: allEntries.length + 1,
      streak: newStreak,
      totalMinutes: newTotalMinutes,
      islandCount: islands.length,
      moodScore: data.moodScore,
      islandId: data.islandId,
    });
    if (earned.length > 0) pushAchievements(earned);

    await fetchData();
  };

  const handleAddIsland = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIslandName.trim()) return;
    setAddingIsland(true);
    const res = await fetch("/api/islands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newIslandName.trim(),
        colorHex: newIslandColor,
        icon: newIslandIcon,
      }),
    });
    setAddingIsland(false);
    if (!res.ok) {
      toast("Failed to create island", "error");
      return;
    }
    setNewIslandName("");
    setNewIslandColor(ISLAND_COLORS[0]);
    setNewIslandIcon(ISLAND_ICONS[0]);
    setShowAddIsland(false);
    toast("Island charted! 🗺️", "success");
    await fetchData();
  };

  const handleSeed = async () => {
    const res = await fetch("/api/demo-seed", { method: "POST" });
    const data = await res.json();
    if (data.seeded) {
      toast("Demo data loaded!", "success");
      await fetchData();
    } else {
      toast("Already has entries", "info");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  const openAddIsland = () => {
    setShowAddIsland(true);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  };

  const handleQuickLog = (islandId: string) => {
    setQuickLogIslandId(islandId);
    setModalOpen(true);
  };

  const leadingId = getLeadingIslandId(islands, scores);

  if (loading) {
    return (
      <main className="min-h-screen p-4 md:p-6 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-6 py-3.5 border-b border-parchment/10 backdrop-blur-sm sticky top-0 z-30 bg-ocean/80">
        <Link href="/dashboard" className="font-display text-xl font-bold text-brass">
          Log Pose
        </Link>
        <div className="flex items-center gap-2">
          <span className="hidden sm:block text-xs font-mono text-parchment/30 mr-1">
            Press <kbd className="bg-parchment/10 px-1 py-0.5 rounded text-parchment/50">N</kbd> to log
          </span>
          <Button variant="ghost" size="sm" onClick={() => {
            resetAchievements();
            toast("Achievements Reset", "info");
          }}>
            Reset ✦
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSeed}>
            Demo
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 p-4 md:p-6">
        {/* Compass / Empty State */}
        <section className="relative rounded-xl border border-parchment/10 overflow-hidden min-h-[320px] lg:min-h-[500px]">
          {islands.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[320px] p-8 text-center">
              <div className="text-6xl mb-4">🧭</div>
              <p className="font-display text-2xl mb-2 text-parchment">
                Your chart is empty
              </p>
              <p className="text-parchment/50 mb-6 max-w-xs">
                Add your first passion project and the compass will point you where your heart burns brightest.
              </p>
              <Button onClick={openAddIsland} className="px-6">
                Chart First Island
              </Button>
            </div>
          ) : (
            <CompassView
              islands={islands}
              scores={scores}
              focusedIslandId={focusedIslandId}
              onIslandClick={(id) => {
                if (!id || focusedIslandId === id) setFocusedIslandId(undefined);
                else setFocusedIslandId(id);
              }}
              onNavigate={(id) => router.push(`/dashboard/islands/${id}`)}
            />
          )}
        </section>

        {/* Sidebar */}
        <aside className="space-y-4">
          <ShareCard islands={islands} scores={scores} />

          {/* Today's Stats */}
          <TodayStats entries={allEntries} />

          {/* Islands list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg">Islands</h2>
              <Button variant="ghost" size="sm" onClick={openAddIsland}>
                + Add
              </Button>
            </div>

            {islands.length === 0 ? (
              <div className="rounded-xl border border-dashed border-parchment/15 p-6 text-center">
                <p className="text-sm text-parchment/40 mb-3">No islands charted yet</p>
                <Button size="sm" onClick={openAddIsland}>
                  Add Island
                </Button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {islands.map((island) => (
                  <IslandCard
                    key={island.islandId}
                    island={island}
                    score={scores.find((s) => s.islandId === island.islandId)}
                    isLeading={island.islandId === leadingId}
                    onQuickLog={handleQuickLog}
                  />
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* FAB — Log Entry */}
      {islands.length > 0 && (
        <button
          onClick={() => {
            setQuickLogIslandId(undefined);
            setModalOpen(true);
          }}
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brass text-ocean shadow-xl hover:bg-brass/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-ocean transition-all hover:scale-110 active:scale-95"
          aria-label="Log new entry"
          title="Log entry (N)"
        >
          <span className="text-2xl font-bold leading-none">+</span>
        </button>
      )}

      {/* Log Entry Modal */}
      <LogEntryModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setQuickLogIslandId(undefined);
        }}
        islands={islands}
        defaultIslandId={quickLogIslandId}
        onSubmit={handleLogEntry}
      />

      {/* Add Island Modal */}
      {showAddIsland && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-ocean/80 backdrop-blur-sm">
          <form
            onSubmit={handleAddIsland}
            className="bg-ocean-light rounded-2xl border border-parchment/15 p-6 w-full max-w-sm space-y-5 shadow-2xl"
          >
            <div>
              <h3 className="font-display text-2xl text-parchment mb-0.5">New Island</h3>
              <p className="text-sm text-parchment/40">Chart a new passion on your compass.</p>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-parchment/40 mb-2">
                Name
              </label>
              <input
                ref={nameInputRef}
                value={newIslandName}
                onChange={(e) => setNewIslandName(e.target.value)}
                placeholder="e.g. Morning Runs, Side Project…"
                className="w-full rounded-xl border border-parchment/15 bg-ocean px-4 py-2.5 text-parchment placeholder:text-parchment/30 focus:outline-none focus:border-brass focus:ring-2 focus:ring-brass/20 transition-colors"
                required
              />
            </div>

            {/* Icon picker */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-parchment/40 mb-2">
                Icon
              </label>
              <div className="grid grid-cols-6 gap-1.5">
                {ISLAND_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setNewIslandIcon(icon)}
                    className={`text-xl p-2 rounded-lg transition-all ${
                      newIslandIcon === icon
                        ? "bg-brass/20 ring-2 ring-brass scale-110"
                        : "hover:bg-parchment/10"
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Color picker */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-parchment/40 mb-2">
                Color
              </label>
              <div className="flex gap-2">
                {ISLAND_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewIslandColor(color)}
                    className={`h-8 w-8 rounded-full transition-all ${
                      newIslandColor === color
                        ? "ring-2 ring-offset-2 ring-offset-ocean-light ring-parchment scale-110"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="flex items-center gap-3 rounded-xl bg-ocean px-4 py-3 border border-parchment/10">
              <span className="text-2xl">{newIslandIcon}</span>
              <div>
                <p className="font-display text-base text-parchment">
                  {newIslandName || "Island Name"}
                </p>
                <p className="text-xs text-parchment/40 font-mono">New island</p>
              </div>
              <div
                className="ml-auto h-4 w-4 rounded-full shrink-0"
                style={{ backgroundColor: newIslandColor }}
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowAddIsland(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={addingIsland}>
                {addingIsland ? "Charting…" : "Chart Island"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
