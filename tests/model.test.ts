import { describe, it, expect } from "vitest";
import { SCENARIOS } from "../src/core/scenarios";
import { buildCapabilities, buildArchitecture, buildAI } from "../src/core/generators";
import { computeCoverage, computeEstimate, DEFAULT_EST } from "../src/core/estimate";
import { computeChangeImpact } from "../src/core/changeImpact";
import { runQualityGate } from "../src/core/quality";
import { assemblePackage } from "../src/core/packageModel";
import { buildMarkdown } from "../src/export/markdown";
import type { Session } from "../src/core/types";

const orion = () => JSON.parse(JSON.stringify(SCENARIOS[0])) as Session;

describe("coverage & traceability", () => {
  it("references trace back to real requirements; no dangling on a clean model", () => {
    const s = { ...orion(), context: { ...orion().context, cloud: "azure" } };
    const caps = buildCapabilities(s), arch = buildArchitecture(s, "azure"), ai = buildAI(s);
    const cov = computeCoverage(s, caps, arch, ai);
    expect(cov.dangling).toHaveLength(0);
    expect(cov.pct).toBeGreaterThan(0);
    expect(cov.covered + cov.uncovered.length).toBe(cov.total);
  });

  it("excluding a referenced requirement is detected as a dangling/unsupported reference", () => {
    const s = orion();
    const caps = buildCapabilities(s); // capabilities computed BEFORE exclusion still cite FR_01
    const excluded = { ...s, requirements: s.requirements.map(r => r.id === "FR_01" ? { ...r, included: false } : r) };
    const arch = buildArchitecture(excluded, "aws"), ai = buildAI(excluded);
    const cov = computeCoverage(excluded, caps, arch, ai);
    expect(cov.dangling).toContain("FR_01");
  });
});

describe("change-impact analysis", () => {
  it("switching cloud affects architecture but preserves scope and effort", () => {
    const r = computeChangeImpact(orion(), DEFAULT_EST, "aws", "cloud");
    expect(r.cloud).toBe("azure");
    expect(r.impact.affected.join(" ")).toMatch(/architecture/i);
    expect(r.impact.unaffected.join(" ")).toMatch(/scope|Effort/i);
  });
  it("contingency change affects ROM only", () => {
    const r = computeChangeImpact(orion(), DEFAULT_EST, "aws", "contingency");
    expect(r.cfg.contingency).toBe(30);
    expect(r.impact.affected.join(" ")).toMatch(/ROM/);
  });
  it("dropping a low-priority requirement removes it from scope", () => {
    const r = computeChangeImpact(orion(), DEFAULT_EST, "aws", "scope");
    const dropped = r.session.requirements.find(x => x.included === false);
    expect(dropped).toBeTruthy();
    expect(dropped!.priority).toBe("Low");
  });
  it("does not mutate the original session (immutability)", () => {
    const original = orion();
    const before = JSON.stringify(original);
    computeChangeImpact(original, DEFAULT_EST, "aws", "scope");
    expect(JSON.stringify(original)).toBe(before);
  });
});

describe("quality gate & consistency", () => {
  it("flags dangling references and unresolved questions", () => {
    const s = orion();
    const caps = buildCapabilities(s);
    const excluded = { ...s, requirements: s.requirements.map(r => r.id === "FR_01" ? { ...r, included: false } : r) };
    const arch = buildArchitecture(excluded, "aws"), ai = buildAI(excluded);
    const cov = computeCoverage(excluded, caps, arch, ai);
    const est = computeEstimate({ ...excluded, context: { ...excluded.context, cloud: "aws" } }, caps, DEFAULT_EST);
    const gate = runQualityGate(excluded, caps, arch, ai, cov, est);
    expect(gate.checks.find(c => c.label === "No dangling references")!.ok).toBe(false);
    expect(gate.checks.find(c => c.label === "Clarification questions resolved")!.ok).toBe(false);
    expect(gate.status).not.toBe("Ready to export");
  });

  it("a fully resolved model reaches export readiness", () => {
    const base = orion();
    const s: Session = {
      ...base,
      openQuestions: base.openQuestions.map(q => ({ ...q, resolved: true, answer: "confirmed" })),
      assumptions: base.assumptions.map(a => ({ ...a, status: "confirmed" as const })),
      requirements: base.requirements.filter(r => r.id !== "FR_04"), // drop the 'assumed/uncovered' one
    };
    const pkg = assemblePackage(s, "azure", DEFAULT_EST);
    expect(pkg.gate.status).toBe("Ready to export");
  });
});

describe("integrated package + export", () => {
  it("markdown export includes disclaimer, requirement IDs and ROM", () => {
    const pkg = assemblePackage(orion(), "aws", DEFAULT_EST);
    const md = buildMarkdown(pkg);
    expect(md).toContain("not a final quote");
    expect(md).toMatch(/FR_01/);
    expect(md).toMatch(/ROM =/);
    expect(md).toContain("Grounding & sources");
    expect(md).toMatch(/customer-stated/);
  });
});
