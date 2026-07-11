import { describe, it, expect } from "vitest";
import {
  computeIslandAngle,
  getLeadingIslandId,
  getNeedleAngle,
  normalizeScores,
} from "@/lib/compass-utils";
import type { Island, PassionScore } from "@/lib/types";

const makeIsland = (id: string): Island => ({
  islandId: id,
  userId: "u1",
  name: id,
  colorHex: "#C9973B",
  icon: "island",
  archived: false,
  createdAt: "",
});

describe("computeIslandAngle", () => {
  it("returns 0 for the first of 4 islands", () => {
    expect(computeIslandAngle(0, 4)).toBe(0);
  });

  it("returns 90 for the second of 4 islands", () => {
    expect(computeIslandAngle(1, 4)).toBe(90);
  });

  it("returns 0 when total is 0", () => {
    expect(computeIslandAngle(0, 0)).toBe(0);
  });

  it("evenly distributes 3 islands at 120° apart", () => {
    expect(computeIslandAngle(0, 3)).toBeCloseTo(0);
    expect(computeIslandAngle(1, 3)).toBeCloseTo(120);
    expect(computeIslandAngle(2, 3)).toBeCloseTo(240);
  });
});

describe("getLeadingIslandId", () => {
  const islands = [makeIsland("a"), makeIsland("b"), makeIsland("c")];

  it("returns island with highest passion score", () => {
    const scores: PassionScore[] = [
      { islandId: "a", passionScore: 2, mostRecentHoursAgo: 1 },
      { islandId: "b", passionScore: 9, mostRecentHoursAgo: 1 },
      { islandId: "c", passionScore: 5, mostRecentHoursAgo: 1 },
    ];
    expect(getLeadingIslandId(islands, scores)).toBe("b");
  });

  it("returns first island when scores are empty", () => {
    expect(getLeadingIslandId(islands, [])).toBe("a");
  });

  it("returns null when islands array is empty", () => {
    expect(getLeadingIslandId([], [])).toBeNull();
  });

  it("handles islands with no score entry (treated as 0)", () => {
    const scores: PassionScore[] = [
      { islandId: "a", passionScore: 0, mostRecentHoursAgo: 1 },
    ];
    expect(getLeadingIslandId(islands, scores)).toBe("a");
  });
});

describe("getNeedleAngle", () => {
  const islands = [makeIsland("x"), makeIsland("y"), makeIsland("z")];

  it("points to angle of leading island", () => {
    const scores: PassionScore[] = [
      { islandId: "x", passionScore: 1, mostRecentHoursAgo: 1 },
      { islandId: "y", passionScore: 10, mostRecentHoursAgo: 1 },
      { islandId: "z", passionScore: 3, mostRecentHoursAgo: 1 },
    ];
    // y is index 1 of 3, so angle = 120
    expect(getNeedleAngle(islands, scores)).toBeCloseTo(120);
  });

  it("returns 0 with no islands", () => {
    expect(getNeedleAngle([], [])).toBe(0);
  });
});

describe("normalizeScores", () => {
  it("maps the top score to 1.0", () => {
    const scores: PassionScore[] = [
      { islandId: "a", passionScore: 4, mostRecentHoursAgo: 1 },
      { islandId: "b", passionScore: 8, mostRecentHoursAgo: 1 },
    ];
    const map = normalizeScores(scores);
    expect(map.get("b")).toBeCloseTo(1.0);
    expect(map.get("a")).toBeCloseTo(0.5);
  });

  it("handles empty array without throwing", () => {
    expect(() => normalizeScores([])).not.toThrow();
  });
});
