"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { HistoryChart } from "@/components/HistoryChart";
import { LogEntryModal } from "@/components/LogEntryModal";
import { PirateScroll } from "@/components/PirateScroll";
import { useToast } from "@/components/ui/Toast";
import { useAchievements, checkAchievements } from "@/components/AchievementSystem";
import type { Island, Entry, PassionScore } from "@/lib/types";

const EternalLogPose = dynamic(
  () => import("@/components/three/EternalLogPose").then((m) => m.EternalLogPose),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full rounded-xl" /> }
);

const MOOD_LABELS = ["😴", "😐", "🙂", "😊", "🔥"];

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

import { computeStreak, normalizeIcon } from "@/lib/compass-utils";

export default function IslandDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const { push: pushAchievements } = useAchievements();
  const [island, setIsland] = useState<Island | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [score, setScore] = useState<PassionScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [scrollOpen, setScrollOpen] = useState(false);

  // Session timer
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    setTimerRunning(true);
    setTimerSeconds(0);
    timerRef.current = setInterval(() => {
      setTimerSeconds((s) => s + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerRunning(false);
    // timerSeconds is already set — the modal will read timerMinutes
    setLogModalOpen(true);
  };

  const cancelTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerRunning(false);
    setTimerSeconds(0);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [islandRes, entriesRes, scoresRes] = await Promise.all([
        fetch(`/api/islands/${id}`),
        fetch(`/api/entries?islandId=${id}&limit=50`),
        fetch("/api/passion-scores"),
      ]);
      if (islandRes.status === 401) {
        router.push("/login");
        return;
      }
      if (islandRes.status === 404) {
        setIsland(null);
        setLoading(false);
        return;
      }
      const islandData = await islandRes.json();
      const entriesData = await entriesRes.json();
      const scoresData = await scoresRes.json();
      const found: Island | null = islandData.island ?? null;
      setIsland(found);
      setName(found?.name ?? "");
      setEntries(entriesData.entries ?? []);
      setScore(
        (scoresData.scores ?? []).find(
          (s: PassionScore) => s.islandId === id
        ) ?? null
      );
    } catch {
      toast("Failed to load island", "error");
    } finally {
      setLoading(false);
    }
  }, [id, router, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    const res = await fetch(`/api/islands/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      toast("Failed to update", "error");
      return;
    }
    setEditing(false);
    toast("Island updated", "success");
    fetchData();
  };

  const handleArchive = async () => {
    if (!confirm("Archive this island? You can't undo this.")) return;
    await fetch(`/api/islands/${id}`, { method: "DELETE" });
    toast("Island archived", "success");
    router.push("/dashboard");
  };

  const handleLogEntry = async (data: {
    islandId: string;
    minutesSpent: number;
    moodScore: number;
    note?: string;
  }) => {
    const isEditing = !!editingEntry;
    const url = isEditing ? `/api/entries/${editingEntry.entryId}` : "/api/entries";
    const method = isEditing ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await res.json();
    if (!res.ok) throw body;
    toast(isEditing ? "Session updated! ⚓" : "Session logged! ⚓", "success");
    setTimerSeconds(0);
    setEditingEntry(null);
    
    if (!isEditing) {
      // Check achievements (bound to this island)
      const newTotalMinutes = totalMinutes + data.minutesSpent;
      const newStreak = computeStreak([...entries, body.entry]);
      const earned = checkAchievements({
        totalEntries: entries.length + 1,
        streak: newStreak,
        totalMinutes: newTotalMinutes,
        moodScore: data.moodScore,
        islandId: id,
      });
      if (earned.length > 0) pushAchievements(earned);
    }

    await fetchData();
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm("Delete this log entry?")) return;
    const res = await fetch(`/api/entries/${entryId}`, { method: "DELETE" });
    if (!res.ok) {
      toast("Failed to delete log entry", "error");
      return;
    }
    toast("Log entry deleted", "success");
    fetchData();
  };

  const timerMinutes = Math.max(1, Math.round(timerSeconds / 60));
  const streak = computeStreak(entries);
  const totalMinutes = entries.reduce((sum, e) => sum + e.minutesSpent, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalMins = totalMinutes % 60;

  if (loading) {
    return (
      <main className="min-h-screen p-6 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </main>
    );
  }

  if (!island) {
    return (
      <main className="min-h-screen p-6 text-center">
        <p className="text-parchment/60 mb-4">Island not found</p>
        <Link href="/dashboard">
          <Button variant="secondary">Back to Dashboard</Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      {/* Back nav */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-brass text-sm hover:text-brass/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass rounded"
      >
        ← Back to compass
      </Link>

      {/* Island header */}
      <header className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex gap-2 items-center">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="font-display text-2xl bg-ocean-light border border-parchment/20 rounded-xl px-3 py-1.5 text-parchment focus:outline-none focus:border-brass focus:ring-2 focus:ring-brass/20 w-full"
              />
              <Button size="sm" onClick={handleSave}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>✕</Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {island.icon && <span className="text-4xl">{normalizeIcon(island.icon)}</span>}
              <h1 className="font-display text-3xl font-bold">{island.name}</h1>
              <button
                onClick={() => setScrollOpen(true)}
                title="View island achievements"
                aria-label="Open achievement scroll"
                className="ml-1 text-2xl leading-none transition-all hover:scale-125 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass rounded-full"
                style={{ filter: "drop-shadow(0 0 6px rgba(201,151,59,0.6))" }}
              >
                ⭐
              </button>
            </div>
          )}

          {score && (
            <div className="flex items-center gap-3 mt-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: island.colorHex }}
              />
              <p className="font-mono text-sm text-parchment/50">
                Passion: <span className="text-brass">{score.passionScore.toFixed(2)}</span>
                {" · "}Last logged{" "}
                {score.mostRecentHoursAgo < 1
                  ? "just now"
                  : score.mostRecentHoursAgo < 24
                  ? `${Math.round(score.mostRecentHoursAgo)}h ago`
                  : `${Math.round(score.mostRecentHoursAgo / 24)}d ago`}
              </p>
            </div>
          )}
        </div>
      </header>

      {/* Eternal Log Pose Visualizer */}
      <section className="rounded-xl border border-brass/20 bg-ocean-light overflow-hidden h-72 md:h-96 relative">
        <div className="absolute inset-x-0 top-4 text-center z-10 pointer-events-none">
          <p className="font-mono text-xs uppercase tracking-widest text-parchment/40">
            Eternal Log Pose
          </p>
          <p className="font-display text-lg text-brass opacity-80">{island.name}</p>
        </div>
        <EternalLogPose targetDeg={0} color={island.colorHex} className="w-full h-full" />
      </section>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-parchment/10 bg-parchment/3 p-4 text-center">
          <p className="font-display text-2xl text-brass">
            {streak > 0 ? `${streak}🔥` : "—"}
          </p>
          <p className="text-xs text-parchment/40 mt-1">day streak</p>
        </div>
        <div className="rounded-xl border border-parchment/10 bg-parchment/3 p-4 text-center">
          <p className="font-display text-2xl text-parchment">
            {totalHours > 0 ? `${totalHours}h ${totalMins}m` : `${totalMins}m`}
          </p>
          <p className="text-xs text-parchment/40 mt-1">total time</p>
        </div>
        <div className="rounded-xl border border-parchment/10 bg-parchment/3 p-4 text-center">
          <p className="font-display text-2xl text-parchment">{entries.length}</p>
          <p className="text-xs text-parchment/40 mt-1">sessions</p>
        </div>
      </div>

      {/* Session Timer */}
      <section className="rounded-xl border border-parchment/10 p-5">
        <h2 className="font-display text-lg mb-4">Session Timer</h2>
        {timerRunning ? (
          <div className="flex flex-col items-center gap-4">
            <div
              className="font-mono text-5xl font-bold tabular-nums"
              style={{ color: island.colorHex }}
            >
              {formatDuration(timerSeconds)}
            </div>
            <p className="text-parchment/40 text-sm">Session in progress…</p>
            <div className="flex gap-3">
              <Button onClick={stopTimer} className="px-6">
                Stop & Log
              </Button>
              <Button variant="ghost" onClick={cancelTimer}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-parchment/60 text-sm">
                Start a timed session and auto-fill your log when you&apos;re done.
              </p>
            </div>
            <Button onClick={startTimer} variant="secondary">
              ▶ Start
            </Button>
          </div>
        )}
      </section>

      {/* History Chart */}
      <section className="rounded-xl border border-parchment/10 p-4">
        <h2 className="font-display text-lg mb-4">History</h2>
        <HistoryChart entries={entries} />
      </section>

      {/* Recent Entries */}
      <section className="space-y-2">
        <h2 className="font-display text-lg">Recent Sessions</h2>
        {entries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-parchment/15 p-8 text-center">
            <p className="text-4xl mb-2">🗺️</p>
            <p className="text-parchment/50 text-sm">
              No logs yet. Start a session above or log your first entry.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {entries.slice(0, 10).map((e) => (
              <li
                key={e.entryId}
                className="rounded-xl border border-parchment/10 p-3.5 hover:border-parchment/20 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-base">
                      {MOOD_LABELS[e.moodScore - 1]}
                    </span>
                    <div>
                      <span className="font-mono text-sm text-parchment/80">
                        {e.minutesSpent < 60
                          ? `${e.minutesSpent}m`
                          : `${Math.floor(e.minutesSpent / 60)}h ${e.minutesSpent % 60}m`}
                      </span>
                      {e.sentimentScore != null && e.sentimentScore !== 0 && (
                        <span className="ml-2 font-mono text-xs text-brass">
                          ✦ {e.sentimentScore.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-parchment/40">
                      {new Date(e.loggedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <button
                      onClick={() => setEditingEntry(e)}
                      className="text-brass/70 hover:text-brass p-1 rounded hover:bg-parchment/5 transition-colors"
                      title="Edit entry"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => handleDeleteEntry(e.entryId)}
                      className="text-ember/70 hover:text-ember p-1 rounded hover:bg-parchment/5 transition-colors"
                      title="Delete entry"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                {e.note && (
                  <p className="mt-2 text-sm text-parchment/70 leading-relaxed border-t border-parchment/5 pt-2">
                    {e.note}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Actions */}
      <div className="flex gap-3 pt-2 pb-8 border-t border-parchment/10">
        {!editing && (
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
            ✎ Rename
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setTimerSeconds(0);
            setLogModalOpen(true);
          }}
          className="text-brass border border-brass/30 hover:bg-brass/10"
        >
          + Log Session
        </Button>
        <Button variant="ghost" size="sm" onClick={handleArchive} className="text-fog ml-auto">
          Archive
        </Button>
      </div>

      {/* Log Entry Modal */}
      <LogEntryModal
        open={logModalOpen || !!editingEntry}
        onClose={() => {
          setLogModalOpen(false);
          setEditingEntry(null);
          if (!timerRunning) setTimerSeconds(0);
        }}
        islands={island ? [island] : []}
        defaultIslandId={island?.islandId}
        initialMinutes={timerSeconds > 0 ? timerMinutes : undefined}
        initialData={editingEntry}
        onSubmit={handleLogEntry}
      />

      {/* Pirate Scroll — island achievements */}
      {island && (
        <PirateScroll
          island={island}
          open={scrollOpen}
          onClose={() => setScrollOpen(false)}
        />
      )}
    </main>
  );
}
