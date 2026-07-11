"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIslandAchievements } from "@/components/AchievementSystem";
import type { Island } from "@/lib/types";

const RARITY_STYLES = {
  common: {
    border: "border-[#C9973B]/30",
    badge: "bg-[#C9973B]/15 text-[#C9973B]",
    label: "Common",
    glow: "",
  },
  rare: {
    border: "border-[#5C9EA0]/50",
    badge: "bg-[#5C9EA0]/20 text-[#5C9EA0]",
    label: "Rare ✦",
    glow: "shadow-[0_0_12px_rgba(92,158,160,0.3)]",
  },
  legendary: {
    border: "border-[#FF6B4A]/60",
    badge: "bg-[#FF6B4A]/20 text-[#FF6B4A]",
    label: "Legendary ✦✦",
    glow: "shadow-[0_0_20px_rgba(255,107,74,0.4)]",
  },
};

interface PirateScrollProps {
  island: Island;
  open: boolean;
  onClose: () => void;
}

export function PirateScroll({ island, open, onClose }: PirateScrollProps) {
  const achievements = useIslandAchievements(island.islandId);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="scroll-backdrop"
            className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Scroll container */}
          <motion.div
            key="scroll-modal"
            className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none"
          >
            <motion.div
              className="pointer-events-auto relative max-w-md w-full"
              initial={{ opacity: 0, scale: 0.88, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
            >
              {/* Parchment scroll body */}
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{
                  background:
                    "linear-gradient(160deg, #2a1f0e 0%, #1a1408 40%, #1f1a0a 100%)",
                  boxShadow:
                    "0 0 0 1px rgba(201,151,59,0.3), 0 0 40px rgba(201,151,59,0.15), inset 0 0 80px rgba(0,0,0,0.6)",
                }}
              >
                {/* Top scroll curl */}
                <div
                  className="h-5 w-full"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(201,151,59,0.25) 0%, transparent 100%)",
                    borderBottom: "1px solid rgba(201,151,59,0.2)",
                  }}
                />

                {/* Decorative top rope */}
                <div className="flex items-center justify-center gap-3 py-2 px-6">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#C9973B]/40 to-[#C9973B]/20" />
                  <span className="text-[#C9973B]/60 text-sm">✦ ⚓ ✦</span>
                  <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[#C9973B]/40 to-[#C9973B]/20" />
                </div>

                <div className="px-6 pb-2">
                  {/* Header */}
                  <div className="text-center mb-5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#C9973B]/50 mb-1">
                      Bounty Board
                    </p>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      {island.icon && (
                        <span className="text-2xl">{island.icon}</span>
                      )}
                      <h2
                        className="font-display text-2xl font-bold"
                        style={{ color: island.colorHex }}
                      >
                        {island.name}
                      </h2>
                    </div>
                    <p className="text-[#C9973B]/40 text-xs font-mono">
                      {achievements.length === 0
                        ? "No bounties claimed yet"
                        : `${achievements.length} bount${achievements.length === 1 ? "y" : "ies"} claimed`}
                    </p>
                  </div>

                  {/* Achievements list */}
                  {achievements.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                      <span className="text-5xl opacity-30">🗺️</span>
                      <p className="text-[#C9973B]/40 text-sm text-center font-mono leading-relaxed">
                        No achievements earned on this island yet.
                        <br />
                        Log sessions to unlock bounties!
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-2.5 mb-4 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
                      {achievements.map((a) => {
                        const style = RARITY_STYLES[a.rarity];
                        return (
                          <motion.li
                            key={a.id}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                            className={`flex items-center gap-3.5 rounded-xl border ${style.border} ${style.glow} p-3`}
                            style={{
                              background:
                                "rgba(255,255,255,0.03)",
                            }}
                          >
                            <span className="text-3xl shrink-0 leading-none">
                              {a.icon}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-display text-sm text-[#e8d5a0] font-semibold truncate">
                                {a.title}
                              </p>
                              <p className="text-xs text-[#C9973B]/50 leading-snug mt-0.5">
                                {a.description}
                              </p>
                            </div>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${style.badge}`}
                            >
                              {style.label}
                            </span>
                          </motion.li>
                        );
                      })}
                    </ul>
                  )}

                  {/* Bottom rope decoration */}
                  <div className="flex items-center justify-center gap-3 py-2">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#C9973B]/30 to-[#C9973B]/15" />
                    <span className="text-[#C9973B]/40 text-xs">
                      🏴‍☠️
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[#C9973B]/30 to-[#C9973B]/15" />
                  </div>
                </div>

                {/* Bottom scroll curl */}
                <div
                  className="h-5 w-full"
                  style={{
                    background:
                      "linear-gradient(0deg, rgba(201,151,59,0.25) 0%, transparent 100%)",
                    borderTop: "1px solid rgba(201,151,59,0.2)",
                  }}
                />
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute -top-3 -right-3 h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-all hover:scale-110"
                style={{
                  background: "rgba(26,20,8,0.95)",
                  border: "1px solid rgba(201,151,59,0.4)",
                  color: "rgba(201,151,59,0.8)",
                  boxShadow: "0 0 10px rgba(0,0,0,0.5)",
                }}
                aria-label="Close scroll"
              >
                ✕
              </button>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
