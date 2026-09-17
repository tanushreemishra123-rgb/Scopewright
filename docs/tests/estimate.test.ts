import { describe, it, expect } from "vitest";
import { SCENARIOS } from "../src/core/scenarios";
import { buildCapabilities } from "../src/core/generators";
import { computeEstimate, DEFAULT_EST } from "../src/core/estimate";
import type { Session } from "../src/core/types";

const orion = () => JSON.parse(JSON.stringify(SCENARIOS[0])) as Session;

describe("effort & ROM estimation", () => {
  it("is reproducible: same inputs → same numbers", () => {
    const s = orion(); const caps = buildCapabilities(s);
    const a = computeEstimate(s, caps, DEFAULT_EST);
    const b = computeEstimate(s, caps, DEFAULT_EST);
    expect(a.totalWeeks).toBe(b.totalWeeks);
    expect(a.cost).toBe(b.cost);
  });

  it("total = subtotal + contingency, and subtotal sums its parts", () => {
    const s = orion(); const caps = buildCapabilities(s);
    const e = computeEstimate({ ...s, context: { ...s.context, cloud: "aws" } }, caps, DEFAULT_EST);
    expect(e.subtotal).toBe(e.base + e.securityUplift + e.testingUplift + e.envUplift + e.migrationUplift);
    expect(e.totalWeeks).toBe(e.subtotal + e.contingency);
    expect(e.cost).toBe(e.totalWeeks * DEFAULT_EST.blendedRate);
  });

  it("raising contingency raises total and ROM proportionally", () => {
    const s = orion(); const caps = buildCapabilities(s);
    const low = computeEstimate(s, caps, { ...DEFAULT_EST, contingency: 10 });
    const high = computeEstimate(s, caps, { ...DEFAULT_EST, contingency: 30 });
    expect(high.totalWeeks).toBeGreaterThan(low.totalWeeks);
    expect(high.cost).toBeGreaterThan(low.cost);
  });

  it("changing the blended rate changes cost but not effort", () => {
    const s = orion(); const caps = buildCapabilities(s);
    const a = computeEstimate(s, caps, { ...DEFAULT_EST, blendedRate: 3000 });
    const b = computeEstimate(s, caps, { ...DEFAULT_EST, blendedRate: 6000 });
    expect(a.totalWeeks).toBe(b.totalWeeks);
    expect(b.cost).toBe(a.cost * 2);
  });

  it("data migration adds fixed uplift", () => {
    const s = orion(); const caps = buildCapabilities(s);
    const off = computeEstimate(s, caps, { ...DEFAULT_EST, dataMigration: false });
    const on = computeEstimate(s, caps, { ...DEFAULT_EST, dataMigration: true });
    expect(on.migrationUplift).toBe(8);
    expect(on.subtotal).toBe(off.subtotal + 8);
  });

  it("missing cloud selection blocks/flags estimation inputs", () => {
    const s = orion(); const caps = buildCapabilities(s);
    const noCloud = computeEstimate(s, caps, DEFAULT_EST);
    expect(noCloud.blocked).toBe(true);
    expect(noCloud.missing).toContain("Cloud platform not selected");
    const withCloud = computeEstimate({ ...s, context: { ...s.context, cloud: "aws" } }, caps, DEFAULT_EST);
    expect(withCloud.blocked).toBe(false);
  });

  it("unresolved questions reduce confidence", () => {
    const s = orion(); const caps = buildCapabilities(s);
    const withOpen = computeEstimate(s, caps, DEFAULT_EST);
    expect(["Medium", "Low"]).toContain(withOpen.confidence);
    const resolved = { ...s, openQuestions: s.openQuestions.map(q => ({ ...q, resolved: true })), assumptions: s.assumptions.map(a => ({ ...a, status: "confirmed" as const })) };
    const clean = computeEstimate({ ...resolved, context: { ...s.context, cloud: "aws" } }, caps, DEFAULT_EST);
    expect(clean.confidence).toBe("High");
  });
});
