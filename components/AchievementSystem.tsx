"use client";

import { useEffect, useRef, useState, createContext, useContext, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Achievement definitions ── */
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: "common" | "rare" | "legendary";
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_log",
    title: "First Wake",
    description: "Logged your very first passion session",
    icon: "⚓",
    rarity: "common",
  },
  {
    id: "streak_3",
    title: "Three-Day Current",
    description: "Logged passion 3 days in a row",
    icon: "🌊",
    rarity: "common",
  },
  {
    id: "streak_7",
    title: "Week on the Sea",
    description: "A full week of daily logging",
    icon: "🧭",
    rarity: "rare",
  },
  {
    id: "streak_30",
    title: "Grand Line",
    description: "30 consecutive days — you reached the Grand Line",
    icon: "🏴‍☠️",
    rarity: "legendary",
  },
  {
    id: "hours_1",
    title: "Setting Sail",
    description: "Logged your first hour on an island",
    icon: "⛵",
    rarity: "common",
  },
  {
    id: "hours_10",
    title: "Island Explorer",
    description: "10 total hours logged on a single island",
    icon: "🗺️",
    rarity: "rare",
  },
  {
    id: "hours_100",
    title: "Eternal Obsession",
    description: "100 hours logged — the Log Pose is locked in",
    icon: "👑",
    rarity: "legendary",
  },
  {
    id: "islands_3",
    title: "Archipelago",
    description: "Charted 3 islands on your compass",
    icon: "🏝️",
    rarity: "common",
  },
  {
    id: "mood_5",
    title: "On Fire",
    description: "Logged a session with max mood (🔥)",
    icon: "🔥",
    rarity: "common",
  },
];

export interface ClaimedAchievement {
  id: string;
  islandId: string;
  timestamp: number;
}

const STORAGE_KEY = "logpose_achievements_v2";

export function getClaimedAchievements(): ClaimedAchievement[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function claimAchievement(id: string, islandId: string) {
  const claimed = getClaimedAchievements();
  if (!claimed.some((c) => c.id === id && c.islandId === islandId)) {
    claimed.push({ id, islandId, timestamp: Date.now() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(claimed));
  }
}

export function resetAchievementsLocal() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/* ── Check which new achievements are earned ── */
export function checkAchievements({
  totalEntries,
  streak,
  totalMinutes,
  islandCount,
  moodScore,
  islandId,
}: {
  totalEntries: number;
  streak: number;
  totalMinutes: number;
  islandCount?: number;
  moodScore?: number;
  islandId: string;
}): (Achievement & { islandId: string })[] {
  const claimed = getClaimedAchievements();
  const newly: (Achievement & { islandId: string })[] = [];

  const maybe = (id: string, condition: boolean) => {
    // Has this island already claimed this achievement?
    if (condition && !claimed.some((c) => c.id === id && c.islandId === islandId)) {
      const a = ACHIEVEMENTS.find((x) => x.id === id);
      if (a) newly.push({ ...a, islandId });
    }
  };

  maybe("first_log", totalEntries >= 1);
  maybe("streak_3", streak >= 3);
  maybe("streak_7", streak >= 7);
  maybe("streak_30", streak >= 30);
  maybe("hours_1", totalMinutes >= 60);
  maybe("hours_10", totalMinutes >= 600);
  maybe("hours_100", totalMinutes >= 6000);
  maybe("islands_3", (islandCount ?? 0) >= 3);
  maybe("mood_5", moodScore === 5);

  return newly;
}

/* ── Sparkle particle ── */
const COLORS = ["#FFD700", "#FF6B4A", "#C9973B", "#fff", "#aaddff", "#FF4488"];

function Sparkle({
  x,
  y,
  color,
  delay,
}: {
  x: number;
  y: number;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      className="absolute w-2 h-2 rounded-full pointer-events-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        backgroundColor: color,
        boxShadow: `0 0 6px 2px ${color}`,
      }}
      initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        scale: [0, 1.2, 0.8, 0],
        x: [(Math.random() - 0.5) * 80],
        y: [-(40 + Math.random() * 80)],
      }}
      transition={{ delay, duration: 1.2, ease: "easeOut" }}
    />
  );
}

function SparkleField() {
  const particles = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    x: 5 + Math.random() * 90,
    y: 20 + Math.random() * 70,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    delay: Math.random() * 0.6,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <Sparkle key={p.id} x={p.x} y={p.y} color={p.color} delay={p.delay} />
      ))}
    </div>
  );
}

/* ── Rarity color map ── */
const RARITY_STYLES = {
  common: {
    border: "border-parchment/30",
    badge: "bg-parchment/20 text-parchment",
    glow: "shadow-[0_0_30px_rgba(201,151,59,0.3)]",
    label: "Common",
  },
  rare: {
    border: "border-brass/50",
    badge: "bg-brass/20 text-brass",
    glow: "shadow-[0_0_40px_rgba(201,151,59,0.5)]",
    label: "Rare",
  },
  legendary: {
    border: "border-ember/60",
    badge: "bg-ember/20 text-ember",
    glow: "shadow-[0_0_60px_rgba(255,107,74,0.6)]",
    label: "Legendary ✦",
  },
};

/* ── Single achievement toast ── */
function AchievementToastCard({
  achievement,
  islandId,
  onDismiss,
}: {
  achievement: Achievement;
  islandId: string;
  onDismiss: () => void;
}) {
  const style = RARITY_STYLES[achievement.rarity];

  useEffect(() => {
    const t = setTimeout(onDismiss, 5500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 80, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -40, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 200, damping: 22 }}
      className={`relative overflow-hidden rounded-2xl border ${style.border} ${style.glow} bg-ocean-light p-5 w-80 cursor-pointer`}
      onClick={onDismiss}
    >
      <SparkleField />

      {/* Top label */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-parchment/40">
          Achievement Unlocked
        </span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.badge}`}>
          {style.label}
        </span>
      </div>

      {/* Icon + content */}
      <div className="flex items-start gap-4">
        <motion.div
          className="text-5xl shrink-0 leading-none"
          initial={{ rotate: -20, scale: 0.5 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
        >
          {achievement.icon}
        </motion.div>
        <div>
          <p className="font-display text-xl text-parchment mb-0.5">
            {achievement.title}
          </p>
          <p className="text-sm text-parchment/60 leading-snug">
            {achievement.description}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <motion.div
        className="absolute bottom-0 left-0 h-0.5 bg-brass/60"
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: 5.5, ease: "linear" }}
      />
    </motion.div>
  );
}

/* ── Achievement Context Provider ── */
interface AchievementContextValue {
  push: (achievements: (Achievement & { islandId: string })[]) => void;
  reset: () => void;
}

const AchievementContext = createContext<AchievementContextValue | null>(null);

export function AchievementProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<(Achievement & { islandId: string })[]>([]);

  const push = (achievements: (Achievement & { islandId: string })[]) => {
    setQueue((prev) => {
      const claimed = getClaimedAchievements();
      const newOnes = achievements.filter(
        (a) =>
          !prev.some((p) => p.id === a.id && p.islandId === a.islandId) &&
          !claimed.some((c) => c.id === a.id && c.islandId === a.islandId)
      );
      return [...prev, ...newOnes];
    });
  };

  const dismiss = (id: string) => {
    setQueue((prev) => prev.filter((a) => a.id !== id));
  };

  const reset = () => {
    resetAchievementsLocal();
    setQueue([]);
  };

  return (
    <AchievementContext.Provider value={{ push, reset }}>
      {children}
      <div className="fixed bottom-24 right-6 z-[100] flex flex-col gap-3 items-end pointer-events-none">
        <div className="pointer-events-auto">
          <AnimatePresence mode="sync">
            {queue.map((a) => (
              <AchievementToastCard
                key={`${a.id}-${a.islandId}`}
                achievement={a}
                islandId={a.islandId}
                onDismiss={() => {
                  claimAchievement(a.id, a.islandId);
                  dismiss(a.id);
                }}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </AchievementContext.Provider>
  );
}

export function useAchievements() {
  const ctx = useContext(AchievementContext);
  if (!ctx) throw new Error("useAchievements must be used within AchievementProvider");
  return ctx;
}

export function useIslandAchievements(islandId: string) {
  const [claimed, setClaimed] = useState<ClaimedAchievement[]>([]);
  
  useEffect(() => {
    setClaimed(getClaimedAchievements().filter(c => c.islandId === islandId));
  }, [islandId]);

  const earned = claimed.map(c => ACHIEVEMENTS.find(a => a.id === c.id)).filter(Boolean) as Achievement[];
  return earned;
}
