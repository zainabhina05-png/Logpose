import { describe, it, expect } from "vitest";
import { computeDecayWeight, DEFAULT_DECAY_CONSTANT } from "@/lib/passionScore";

describe("computeDecayWeight", () => {
  it("returns ~1 at hoursAgo=0", () => {
    expect(computeDecayWeight(0)).toBeCloseTo(1, 5);
  });

  it("reduces weight monotonically as hoursAgo increases", () => {
    const w1 = computeDecayWeight(10);
    const w2 = computeDecayWeight(50);
    const w3 = computeDecayWeight(200);
    expect(w1).toBeGreaterThan(w2);
    expect(w2).toBeGreaterThan(w3);
  });

  it("approaches 0 for very large hoursAgo", () => {
    expect(computeDecayWeight(10000)).toBeLessThan(0.001);
  });

  it("respects custom decay constant", () => {
    const slow = computeDecayWeight(100, 0.001);
    const fast = computeDecayWeight(100, 0.02);
    expect(fast).toBeLessThan(slow);
  });

  it("uses default decay constant", () => {
    const expected = Math.exp(-DEFAULT_DECAY_CONSTANT * 24);
    expect(computeDecayWeight(24)).toBeCloseTo(expected, 5);
  });

  it("clamps negative hoursAgo to weight 1", () => {
    expect(computeDecayWeight(-5)).toBe(1);
    expect(computeDecayWeight(-100)).toBe(1);
  });

  it("half-life is ~115 hours at default decay", () => {
    // ln(2) / 0.006 ≈ 115.5 hours for weight to reach 0.5
    const halfLifeHours = Math.log(2) / DEFAULT_DECAY_CONSTANT;
    expect(computeDecayWeight(halfLifeHours)).toBeCloseTo(0.5, 3);
  });
});
