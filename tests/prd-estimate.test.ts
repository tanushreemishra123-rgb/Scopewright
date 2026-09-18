import { describe, it, expect } from "vitest";
import { SCENARIOS } from "../src/core/scenarios";
import { buildCapabilities, buildPRDExtras, buildRisks } from "../src/core/generators";
import { computeEstimate, DEFAULT_EST } from "../src/core/estimate";
import { assemblePackage } from "../src/core/packageModel";
import type { Session } from "../src/core/types";

const orion = () => JSON.parse(JSON.stringify(SCENARIOS[0])) as Session;

describe("PRD depth", () => {
  it("exposes personas, journeys and risks on seeds", () => {
    const s = orion();
    expect(s.personas!.length).toBeGreaterThan(0);
    expect(s.journeys!.length).toBeGreaterThan(0);
    expect(s.risks!.length).toBeGreaterThan(0);
  });
  it("recommended enhancements are the AI-inferred requirements", () => {
    const x = buildPRDExtras(orion());
    expect(x.enhancements.every(r => r.classification === "ai-inferred")).toBe(true);
  });
  it("excluding a requirement lists it as out-of-scope", () => {
    const s = orion();
    s.requirements = s.requirements.map(r => r.id === "FR_04" ? { ...r, included: false } : r);
    const x = buildPRDExtras(s);
    expect(x.outOfScope.join(" ")).toMatch(/FR_04/);
  });
  it("dependencies are derived from requirement edges", () => {
    const x = buildPRDExtras(orion());
    expect(x.dependencies.length).toBeGreaterThan(0);
    expect(x.dependencies[0]).toHaveProperty("from");
  });
  it("each capability exposes external dependencies (not its own reqs)", () => {
    const caps = buildCapabilities(orion());
    for (const c of caps) {
      expect(Array.isArray(c.dependencies)).toBe(true);
      // a capability never lists one of its own requirement IDs as a dependency
      for (const d of c.dependencies) expect(c.reqs).not.toContain(d);
    }
    // at least one capability has a real cross-capability dependency
    expect(caps.some(c => c.dependencies.length > 0)).toBe(true);
  });
});

describe("estimation depth", () => {
  it("role breakdown roughly allocates the total effort and costs are positive", () => {
    const s = { ...orion(), context: { ...orion().context, cloud: "aws" } };
    const est = computeEstimate(s, buildCapabilities(s), DEFAULT_EST);
    const roleWeeks = est.roles.reduce((a, r) => a + r.weeks, 0);
    expect(Math.abs(roleWeeks - est.totalWeeks)).toBeLessThan(2); // rounding tolerance
    expect(est.roles.every(r => r.cost > 0 && r.weeklyRate > 0)).toBe(true);
    expect(est.roleCostTotal).toBeGreaterThan(0);
  });
  it("effort range brackets the nominal total", () => {
    const s = orion();
    const est = computeEstimate(s, buildCapabilities(s), DEFAULT_EST);
    expect(est.weeksLow).toBeLessThanOrEqual(est.totalWeeks);
    expect(est.weeksHigh).toBeGreaterThanOrEqual(est.totalWeeks);
  });
  it("produces six increasing milestones and delivery risks", () => {
    const s = orion();
    const est = computeEstimate(s, buildCapabilities(s), DEFAULT_EST);
    expect(est.milestones).toHaveLength(6);
    for (let i = 1; i < est.milestones.length; i++) expect(est.milestones[i].endWeek).toBeGreaterThanOrEqual(est.milestones[i - 1].endWeek);
    expect(est.deliveryRisks.length).toBeGreaterThan(0);
  });
});

describe("added quality-gate checks", () => {
  it("integrations appear in the delivery plan, and commercials reconcile", () => {
    const pkg = assemblePackage(orion(), "aws", DEFAULT_EST);
    const labels = Object.fromEntries(pkg.gate.checks.map(c => [c.label, c.ok]));
    expect(labels["Integrations in the delivery plan"]).toBe(true);
    expect(labels["Estimate & commercials reconcile"]).toBe(true);
    expect(labels["No conflicting cloud / technology"]).toBe(true);
  });
});
