"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";
import type { Island, Entry } from "@/lib/types";

const MOOD_LABELS = ["😴", "😐", "🙂", "😊", "🔥"];
const TIME_PRESETS = [
  { label: "15m", value: 15 },
  { label: "30m", value: 30 },
  { label: "45m", value: 45 },
  { label: "1h", value: 60 },
  { label: "2h", value: 120 },
];

interface LogEntryModalProps {
  open: boolean;
  onClose: () => void;
  islands: Island[];
  defaultIslandId?: string;
  initialMinutes?: number;
  initialData?: Entry | null;
  onSubmit: (data: {
    islandId: string;
    minutesSpent: number;
    moodScore: number;
    note?: string;
  }) => Promise<void>;
}

export function LogEntryModal({
  open,
  onClose,
  islands,
  defaultIslandId,
  initialMinutes,
  initialData,
  onSubmit,
}: LogEntryModalProps) {
  const [islandId, setIslandId] = useState(
    initialData?.islandId ?? defaultIslandId ?? islands[0]?.islandId ?? ""
  );
  const [minutes, setMinutes] = useState(initialData?.minutesSpent ?? 30);
  const [mood, setMood] = useState(initialData?.moodScore ?? 3);
  const [note, setNote] = useState(initialData?.note ?? "");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync when defaultIslandId or islands change
  useEffect(() => {
    if (open) {
      if (initialData) {
        setIslandId(initialData.islandId);
        setMinutes(initialData.minutesSpent);
        setMood(initialData.moodScore);
        setNote(initialData.note ?? "");
      } else {
        setIslandId(defaultIslandId ?? islands[0]?.islandId ?? "");
        setMood(3);
        setNote("");
        if (initialMinutes && initialMinutes > 0) {
          setMinutes(initialMinutes);
        } else {
          setMinutes(30);
        }
      }
    }
  }, [open, defaultIslandId, initialMinutes, islands, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      await onSubmit({
        islandId,
        minutesSpent: minutes,
        moodScore: mood,
        note: note.trim() || undefined,
      });
      setNote("");
      setMinutes(30);
      setMood(3);
      onClose();
    } catch (err: unknown) {
      const data = (err as { fields?: Record<string, string> })?.fields;
      if (data) setErrors(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={initialData ? "Edit Session" : "Log Passion"}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Island Select */}
        <div>
          <label htmlFor="island-select" className="block text-sm font-semibold mb-2 text-ocean">
            Island
          </label>
          <select
            id="island-select"
            value={islandId}
            onChange={(e) => setIslandId(e.target.value)}
            className="w-full rounded-lg border-2 border-ocean/20 bg-ocean/5 text-ocean px-3 py-2.5 font-medium focus:outline-none focus:border-brass focus:ring-2 focus:ring-brass/20 transition-colors"
            required
          >
            {islands.map((i) => (
              <option key={i.islandId} value={i.islandId}>
                {i.icon} {i.name}
              </option>
            ))}
          </select>
          {errors.islandId && (
            <p className="text-red-500 text-sm mt-1">{errors.islandId}</p>
          )}
        </div>

        {/* Time Spent */}
        <div>
          <label htmlFor="minutes" className="block text-sm font-semibold mb-2 text-ocean">
            Time spent
          </label>
          {/* Quick picks */}
          <div className="flex gap-1.5 mb-2">
            {TIME_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setMinutes(p.value)}
                className={`flex-1 rounded-lg border py-1.5 text-xs font-mono font-bold transition-all ${
                  minutes === p.value
                    ? "bg-brass border-brass text-ocean"
                    : "border-ocean/20 text-ocean/70 hover:border-brass/50 hover:text-ocean"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              id="minutes"
              type="number"
              min={1}
              max={1440}
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              className="w-full rounded-lg border-2 border-ocean/20 bg-ocean/5 text-ocean px-3 py-2.5 font-mono font-bold text-lg focus:outline-none focus:border-brass focus:ring-2 focus:ring-brass/20 transition-colors"
            />
            <span className="text-ocean/60 text-sm font-medium shrink-0">min</span>
          </div>
          {errors.minutesSpent && (
            <p className="text-red-500 text-sm mt-1">{errors.minutesSpent}</p>
          )}
        </div>

        {/* Mood */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-ocean">
            Mood — <span className="font-normal text-ocean/70">{MOOD_LABELS[mood - 1]}</span>
          </label>
          <Slider
            value={mood}
            onChange={setMood}
            labels={MOOD_LABELS}
            id="mood-slider"
          />
        </div>

        {/* Note */}
        <div>
          <label htmlFor="note" className="block text-sm font-semibold mb-2 text-ocean">
            Note <span className="font-normal text-ocean/50">(optional)</span>
          </label>
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="What lit you up about this session?"
            className="w-full rounded-lg border-2 border-ocean/20 bg-ocean/5 text-ocean px-3 py-2.5 resize-none placeholder:text-ocean/40 focus:outline-none focus:border-brass focus:ring-2 focus:ring-brass/20 transition-colors"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !islandId} className="flex-1">
            {loading ? "Saving…" : initialData ? "Save Changes" : "Log Entry"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
