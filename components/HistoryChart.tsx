"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { Entry } from "@/lib/types";
import { computeDecayWeight } from "@/lib/passionScore";

interface HistoryChartProps {
  entries: Entry[];
}

export function HistoryChart({ entries }: HistoryChartProps) {
  const data = [...entries]
    .reverse()
    .map((e) => {
      const hoursAgo =
        (Date.now() - new Date(e.loggedAt).getTime()) / (1000 * 60 * 60);
      const decay = computeDecayWeight(hoursAgo);
      const weighted =
        (e.minutesSpent / 60) *
        (1 + e.moodScore / 5) *
        (1 + Math.max(e.sentimentScore ?? 0, 0)) *
        decay;
      return {
        date: new Date(e.loggedAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        minutes: e.minutesSpent,
        weighted: Number(weighted.toFixed(2)),
      };
    });

  if (data.length === 0) {
    return (
      <p className="text-parchment/60 text-center py-8">
        No entries yet — log your first session to see the chart.
      </p>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#5C6B7033" />
          <XAxis dataKey="date" stroke="#EDE3D080" fontSize={12} />
          <YAxis stroke="#EDE3D080" fontSize={12} />
          <Tooltip
            contentStyle={{
              background: "#EDE3D0",
              border: "none",
              borderRadius: 8,
              color: "#0B2027",
            }}
          />
          <Line
            type="monotone"
            dataKey="minutes"
            stroke="#C9973B"
            strokeWidth={2}
            dot={false}
            name="Minutes"
          />
          <Line
            type="monotone"
            dataKey="weighted"
            stroke="#FF6B4A"
            strokeWidth={2}
            dot={false}
            name="Weighted Score"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
